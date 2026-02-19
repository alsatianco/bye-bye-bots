# Bye Bye Bots — Specific Implementation Plan (MV3)

## 0) Product rules (what “blocking” means)

You’ll support two protections, each independently toggleable:

1. **Full-site block (network level)**

* If a user navigates to a blocked AI-chat site, the tab is redirected to a bundled `blocked.html` page (preferred) or hard-blocked (fallback).
* Also block common **API endpoints** so embedded widgets / scripts can’t quietly call AI backends.

2. **Partial-page block (DOM level)**

* On allowed sites (Google/Bing/etc.), remove/hide only the AI chat/AI answer UI, without breaking the rest of the page.
* Must handle **dynamic rendering** (MutationObserver) and avoid “flash of AI content” (early CSS injection).

---

## 1) Repo scaffold (file layout)

Keep your structure; make it more “config-driven” so you don’t end up with spaghetti selectors:

```
bye-bye-bots/
├── manifest.json
├── sw.js                         # service worker
├── rules/
│   ├── static_block.json         # built-in DNR ruleset
│   └── rule_ids.js               # constants + helper for generating IDs
├── ui/
│   ├── blocked.html
│   ├── blocked.js
│   └── blocked.css
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/
│   ├── options.html
│   ├── options.js
│   └── options.css
├── content/
│   ├── engine.js                 # shared DOM-block engine (observer + css injection)
│   ├── packs.js                  # per-site “packs” (selectors + logic flags)
│   ├── google.js
│   ├── bing.js
│   ├── duckduckgo.js
│   └── youtube.js                # optional
└── icons/
    ├── 16.png
    ├── 48.png
    └── 128.png
```

---

## 2) Storage schema (keep it predictable)

Use `chrome.storage.local` for everything (PIN included).

Suggested keys:

```js
{
  enabled: true,                        // global ON/OFF
  blockFullSites: true,
  blockPartialFeatures: true,

  pin: {                                // optional lock
    enabled: true,
    saltB64: "...",
    hashB64: "..."                      // SHA-256(salt + pin)
  },

  allowDomains: ["school.ai.example"],  // allowlist overrides block
  customBlockDomains: ["some.ai.site"], // parent-added

  siteToggles: {                        // partial blocking per site pack
    google: true,
    bing: true,
    duckduckgo: true,
    youtube: false
  }
}
```

---

## 3) Manifest V3 specifics (what permissions you actually need)

### 3.1 Permissions for full-site blocking

* Use `declarativeNetRequest` + static rulesets. ([Chrome for Developers][1])
* If you **redirect** to an extension page, Chrome’s migration guide notes redirecting requires host access permission + host permissions. ([Chrome for Developers][2])

**Practical plan**

* Start with **redirect** (better UX) and accept broader permissions *or* do a fallback “block” mode to avoid broad host warnings.
* Implement both: a setting “Use friendly blocked page” (redirect) vs “Hard block” (block).

### 3.2 Incognito support

* Set `"incognito": "spanning"` (common default) and tell parents to enable “Allow in incognito” in Chrome’s extension settings. ([Chrome for Developers][3])
* Test redirect in incognito; if it’s flaky, use the fallback “block” in incognito.

---

## 4) Phase 1 — Full-site blocking (DNR)

### 4.1 Static block ruleset (`rules/static_block.json`)

Create rules to block **main_frame** loads for known AI chat domains.

**Rule strategy**

* Use `action.type = "redirect"` to `/ui/blocked.html` for the friendly page, OR `action.type="block"` as fallback.
* Add a separate set of rules for **API endpoints** (resourceTypes like `xmlhttprequest`, `sub_frame`, `script`) so “embedded AI chat widgets” also break.

**Example static rule pattern**

```json
{
  "id": 1,
  "priority": 1,
  "action": { "type": "redirect", "redirect": { "extensionPath": "/ui/blocked.html" } },
  "condition": {
    "urlFilter": "||chatgpt.com/",
    "resourceTypes": ["main_frame"]
  }
}
```

> You’ll repeat for each domain (chatgpt.com, claude.ai, gemini.google.com, poe.com, character.ai, perplexity.ai, etc.)

### 4.2 Allowlist override (important!)

Parents will eventually want “allow this one domain”. Do it with **higher-priority allow rules** in dynamic rules (so it can override static blocks).

Implementation:

* Dynamic allow rule priority = `100`
* Block rules priority = `1`

### 4.3 Custom domains (dynamic rules)

In `options.js`, when parent adds a domain:

1. Normalize: strip scheme/path → hostname
2. Validate: must be a hostname (and not empty)
3. Save to `customBlockDomains`
4. Generate a dynamic rule (unique ID range, e.g. 10,000+)
5. Call `chrome.declarativeNetRequest.updateDynamicRules({ addRules: [...] })` ([MDN Web Docs][4])

Also support removal by stored rule IDs.

### 4.4 Global ON/OFF behavior (make it truly off)

Don’t just “pretend off” in the UI—actually disable protections:

* **Static ruleset enable/disable** via `updateEnabledRulesets` ([MDN Web Docs][5])
* **Dynamic rules** remove all when OFF, re-add when ON

Concrete behavior:

* On toggle OFF:

  * disable static ruleset
  * remove all dynamic block/allow rule IDs
* On toggle ON:

  * enable static ruleset
  * re-add dynamic rules from storage

This makes ON/OFF feel reliable for parents.

---

## 5) Blocked page UX (`ui/blocked.html`)

Goal: friendly + no bypass.

Include:

* Title: “Blocked by Bye Bye Bots”
* Message: “This site is blocked. If you need it for school, ask your parent.”
* Buttons:

  * **Go Back** (`history.back()`)
  * **Copy site name** (copies the hostname so kid can show parent)
* Optional: show the blocked hostname

  * If redirect doesn’t preserve URL, store last-blocked hostname in `sw.js` using a DNR matched-rule debug path during development (note: feedback APIs behave differently in store builds).

---

## 6) Phase 2 — Partial-page blocking (content scripts)

### 6.1 The “DOM Block Engine” (shared utility)

Put the hard logic in `content/engine.js`, reused by each site.

Engine responsibilities:

1. Read settings (`enabled`, `blockPartialFeatures`, per-site toggle)
2. Inject a `<style>` at `document_start` for known selectors (prevents flash)
3. Run `applyOnce()`:

   * remove nodes by selectors
   * optionally replace with a small placeholder
4. Start a MutationObserver watching `document.documentElement`:

   * debounce scans (e.g., run at most every 200ms)
   * re-apply removals
5. Listen to:

   * `chrome.storage.onChanged` (reconfigure live)
   * `chrome.runtime.onMessage` (fast toggle updates)

### 6.2 “Packs” (data-driven selectors)

In `content/packs.js`, define per-site packs:

```js
export const PACKS = {
  google: {
    match: ["*://www.google.com/search*","*://www.google.co.th/search*"],
    hideSelectors: [
      /* AI Overview container selectors */
    ],
    removeSelectors: [
      /* buttons/tabs for “AI Mode” */
    ],
    allFrames: true,
    runAt: "document_start"
  },
  bing: { ... },
  duckduckgo: { ... }
};
```

**Why this matters:** you can update selectors without rewriting logic.

### 6.3 Selector strategy (how to make it survive UI changes)

Google/Bing change class names a lot. Your selector “rules of thumb”:

* Prefer stable attributes: `aria-label`, `role`, `data-*` identifiers
* Prefer structural selectors anchored to known layout containers
* Avoid brittle “.class123” unless it’s stable across weeks
* Maintain multiple selectors per feature (A/B UI variants)

Also add a **failsafe heuristic** option per pack:

* If a node contains an iframe/section whose accessible name includes “AI”, “Copilot”, “Gemini” (language-dependent), hide it
* Keep heuristics off by default; enable only when selectors break

### 6.4 Concrete initial targets

**Google Search**

* Remove/hide:

  * AI answer modules (AI Overview / AI Mode panel)
  * entry points: “AI Mode” button/tab/chip if present
* Must handle:

  * results updating without full page reload
  * delayed insertion after fetch
* Implementation:

  * CSS injection + MutationObserver scan

**Bing**

* Remove:

  * Copilot sidebar/panel
  * Chat tab / entry points

**DuckDuckGo**

* Remove:

  * DuckAssist / AI answer box

**YouTube (optional)**

* Remove:

  * AI summary cards (if present)

---

## 7) Phase 3 — Parent-friendly UI + PIN lock

### 7.1 Popup (one job: ON/OFF)

Popup shows:

* Big toggle: Protection ON/OFF
* Small status:

  * “Blocking X sites”
  * “Blocking AI features on: Google, Bing, …”

When toggling:

* If PIN lock enabled → show PIN prompt
* If PIN correct → apply changes

### 7.2 Options page (simple + expandable)

Sections:

1. **Protection**

   * global ON/OFF
   * “Block full AI chat sites”
   * “Block AI features inside sites”
2. **Site toggles**

   * Google / Bing / DuckDuckGo / YouTube
3. **Block list**

   * Built-in list (read-only display)
   * Custom block list (add/remove)
4. **Allow list**

   * Add domain to allow
5. **PIN**

   * Set PIN / change PIN / disable lock

### 7.3 PIN hashing (don’t store plaintext)

Use Web Crypto SHA-256 with a random salt:

* Store `saltB64` and `hashB64`
* Verify by hashing `salt + pinInput`

(Still not anti-hacker security, but perfect for “stop casual toggling”.)

---

## 8) Phase 4 — Edge cases & reliability

### 8.1 Performance controls (MutationObserver done right)

* Use a debounced queue:

  * mark `pending = true` on mutations
  * run scan via `setTimeout` or `requestIdleCallback`
* Stop observing if:

  * global OFF
  * partial-block OFF
  * site toggle OFF

### 8.2 “Kids can uninstall it”

Be explicit in your options page:

* “A determined teen can disable/remove extensions unless the browser profile/device is supervised/managed.”

### 8.3 Incognito

* Manifest incognito mode set. ([Chrome for Developers][3])
* Provide a small onboarding note: “Enable ‘Allow in incognito’ if needed.”

---

## 9) Phase 5 — Testing checklist (repeatable)

Create a `/TESTING.md` and run it every release:

**Full-site**

* open blocked domains directly
* open via search result click
* open in new tab
* open in incognito (if enabled)
* confirm allowlist overrides work

**Partial**

* Google: run several searches; scroll; change query; ensure AI module doesn’t appear
* Bing: open/search; ensure Copilot panel doesn’t appear
* DDG: confirm DuckAssist hidden
* Confirm no major layout breaks

**Regression**

* Turn protection OFF → everything behaves normal
* Turn partial-only OFF → full-site still blocked

---

## 10) Release & maintenance (practical reality)

* Expect selectors to break occasionally—plan “selector updates” as normal releases.
* Keep `packs.js` tidy and versioned.
* Add an in-options “Report broken block” button that:

  * copies diagnostics (browser version, enabled toggles, current hostname)
  * and optionally opens a GitHub Issues template (if you have a repo)

---

## Suggested build order (implementation-first)

1. **Static DNR ruleset + blocked page** (prove full-site blocking)
2. **Popup toggle** + wire it to enable/disable rulesets + dynamic rules
3. **DOM engine** + **Google pack** (CSS injection + MutationObserver)
4. Add Bing + DuckDuckGo packs
5. Options page: custom block/allow + per-site toggles
6. PIN lock gating popup + options
