# Bye Bye Bots — Testing Checklist

Run through this checklist before every release.

---

## Full-Site Blocking

- [ ] Open a blocked domain directly (e.g. `chatgpt.com`) → redirected to blocked page
- [ ] Open `claude.ai` → redirected to blocked page
- [ ] Open `gemini.google.com` → redirected to blocked page
- [ ] Open `perplexity.ai` → redirected to blocked page
- [ ] Open `copilot.microsoft.com` → redirected to blocked page
- [ ] Open `character.ai` → redirected to blocked page
- [ ] Open `poe.com` → redirected to blocked page
- [ ] Open `chat.deepseek.com` → redirected to blocked page
- [ ] Open `grok.com` → redirected to blocked page
- [ ] Open `meta.ai` → redirected to blocked page
- [ ] Open `chat.mistral.ai` → redirected to blocked page
- [ ] Open `chat.qwen.ai` → redirected to blocked page
- [ ] Open `duck.ai` → redirected to blocked page
- [ ] Open `venice.ai/chat` → redirected to blocked page
- [ ] Open `kimi.com` → redirected to blocked page
- [ ] Open `openrouter.ai/chat` → redirected to blocked page
- [ ] Open `my.replika.com` → redirected to blocked page
- [ ] Open `crushon.ai` → redirected to blocked page
- [ ] Open `janitorai.com` → redirected to blocked page
- [ ] Open `polybuzz.ai` → redirected to blocked page
- [ ] Open `candy.ai` → redirected to blocked page
- [ ] Open `spicychat.ai` → redirected to blocked page
- [ ] Open `gptgirlfriend.online` → redirected to blocked page
- [ ] Open blocked domain via search result click → redirected
- [ ] Open blocked domain in a new tab → redirected
- [ ] Open blocked domain in incognito (if "Allow in incognito" enabled) → redirected
- [ ] Blocked page shows correct domain name
- [ ] "Go Back" button works on blocked page
- [ ] "Copy site name" button copies domain to clipboard

## Allow List

- [ ] Add a blocked domain to the allow list → it loads normally
- [ ] Remove domain from allow list → it is blocked again

## Custom Block List

- [ ] Add a custom domain → it gets blocked
- [ ] Remove a custom domain → it loads normally again

## Partial-Page Blocking (Content Scripts)

### Google Search
- [ ] Search for common queries → no AI Overview appears
- [ ] Change query / navigate within search → AI content stays hidden
- [ ] Scroll through results → no flash of AI content
- [ ] "AI Mode" tab/button hidden (if present)

### Bing
- [ ] Open Bing and search → Copilot panel/sidebar hidden
- [ ] Chat tab / entry point hidden
- [ ] No major layout breaks

### DuckDuckGo
- [ ] Search on DuckDuckGo → DuckAssist / AI answer hidden
- [ ] AI Chat tab hidden

### YouTube (optional, off by default)
- [ ] Enable YouTube toggle → AI summary cards hidden
- [ ] Disable YouTube toggle → normal behavior

## Popup

- [ ] Open popup → shows ON/OFF toggle
- [ ] Toggle OFF → status shows "Protection is OFF"
- [ ] Toggle ON → status shows blocked site count + active partial sites
- [ ] Settings link opens options page
- [ ] If PIN enabled, toggling requires PIN entry
- [ ] Incorrect PIN shows error
- [ ] Correct PIN allows toggle

## Options Page

- [ ] All toggles load with correct state
- [ ] Global ON/OFF works
- [ ] "Block full AI chat sites" toggle works (disables/enables static rules)
- [ ] "Block AI features inside sites" toggle works
- [ ] Per-site toggles (Google/Bing/DDG/YouTube) work
- [ ] Built-in blocked sites displayed (read-only)
- [ ] Can add/remove custom blocked domains
- [ ] Can add/remove allow list domains
- [ ] Can set PIN → subsequent visits require PIN entry
- [ ] Can change PIN
- [ ] Can disable PIN
- [ ] "Report Broken Block" copies diagnostics to clipboard
- [ ] If PIN set, options page requires PIN to access

## Regression

- [ ] Turn protection OFF → all sites load normally, AI features visible
- [ ] Turn partial-only OFF → full-site blocking still works
- [ ] Turn full-site-only OFF → partial blocking still works
- [ ] Re-enable → protections resume immediately
- [ ] No console errors in service worker
- [ ] No console errors in content scripts

## Performance

- [ ] No noticeable lag on Google search results
- [ ] No flickering / flash of AI content
- [ ] Extension doesn't break page layout on any tested site

## Edge Cases

- [ ] Extension works after browser restart
- [ ] Settings persist after browser restart
- [ ] Multiple tabs with different search engines all work
- [ ] Navigating from Google to a blocked AI site triggers redirect
