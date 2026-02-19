/**
 * Bye Bye Bots — Service Worker (MV3)
 *
 * Responsibilities:
 * - Install: initialize default storage
 * - Handle global ON/OFF: enable/disable static rulesets + dynamic rules
 * - Manage dynamic block/allow rules for custom & allowlist domains
 * - Relay toggle messages to content scripts
 */

const STATIC_RULESET_ID = "static_block";
const DYNAMIC_BLOCK_START = 10000;
const DYNAMIC_ALLOW_START = 20000;
const BLOCK_PRIORITY = 1;
const ALLOW_PRIORITY = 100;

/* ---------- helpers ---------- */

function hashDomain(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function allocateId(domain, base, usedIds) {
  // Keep IDs within [base, base+9999]
  const start = base + (hashDomain(domain) % 10000);
  for (let i = 0; i < 10000; i++) {
    const id = base + ((start - base + i) % 10000);
    if (!usedIds.has(id)) {
      usedIds.add(id);
      return id;
    }
  }
  throw new Error("Bye Bye Bots: unable to allocate dynamic rule id");
}

function allocateIdPair(domain, base, usedIds) {
  // Allocate two consecutive IDs (id, id+1) within [base, base+9999].
  // Ensure 'id' is even so the pair stays aligned.
  const startRaw = base + (hashDomain(domain) % 10000);
  const start = startRaw % 2 === 0 ? startRaw : (startRaw === base + 9999 ? startRaw - 1 : startRaw + 1);

  for (let i = 0; i < 5000; i++) {
    const id = base + ((start - base + (i * 2)) % 10000);
    const id2 = id === base + 9999 ? base : id + 1;
    if (!usedIds.has(id) && !usedIds.has(id2)) {
      usedIds.add(id);
      usedIds.add(id2);
      return [id, id2];
    }
  }
  throw new Error("Bye Bye Bots: unable to allocate dynamic rule id pair");
}

function makeBlockRule(id, domain) {
  return {
    id,
    priority: BLOCK_PRIORITY,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/ui/blocked.html?domain=" + encodeURIComponent(domain) }
    },
    condition: {
      urlFilter: "||" + domain + "/",
      resourceTypes: ["main_frame"]
    }
  };
}

function makeApiBlockRule(id, domain) {
  return {
    id,
    priority: BLOCK_PRIORITY,
    action: { type: "block" },
    condition: {
      urlFilter: "||" + domain + "/",
      resourceTypes: ["xmlhttprequest", "sub_frame", "script"]
    }
  };
}

function makeAllowRule(id, domain) {
  return {
    id,
    priority: ALLOW_PRIORITY,
    action: { type: "allow" },
    condition: {
      urlFilter: "||" + domain + "/",
      resourceTypes: ["main_frame", "xmlhttprequest", "sub_frame", "script"]
    }
  };
}

/* ---------- default state ---------- */

const DEFAULT_STATE = {
  enabled: true,
  blockFullSites: true,
  blockPartialFeatures: true,
  pin: { enabled: false, saltB64: "", hashB64: "" },
  allowDomains: [],
  customBlockDomains: [],
  siteToggles: {
    google: true,
    bing: true,
    duckduckgo: true,
    youtube: false
  }
};

/* ---------- install ---------- */

chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get(null);
  // Merge defaults with any existing settings (preserve user data on update)
  const state = { ...DEFAULT_STATE, ...existing };
  await chrome.storage.local.set(state);
  // Ensure static ruleset is enabled
  await syncRulesets(state);
});

/* ---------- ruleset sync ---------- */

async function syncRulesets(state) {
  if (!state) {
    state = await chrome.storage.local.get(null);
  }

  // 1) Static ruleset enable/disable
  const enabledSets = [];
  const disabledSets = [];
  if (state.enabled && state.blockFullSites) {
    enabledSets.push(STATIC_RULESET_ID);
  } else {
    disabledSets.push(STATIC_RULESET_ID);
  }

  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: enabledSets,
      disableRulesetIds: disabledSets
    });
  } catch (e) {
    console.warn("Bye Bye Bots: updateEnabledRulesets error", e);
  }

  // 2) Dynamic rules: remove all, then re-add if enabled
  const existingDynamic = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingDynamic.map(r => r.id);

  const addRules = [];
  if (state.enabled && state.blockFullSites) {
    const usedIds = new Set();

    // Custom block domains
    for (const domain of (state.customBlockDomains || [])) {
      const [redirectId, apiId] = allocateIdPair(domain, DYNAMIC_BLOCK_START, usedIds);
      addRules.push(makeBlockRule(redirectId, domain));
      addRules.push(makeApiBlockRule(apiId, domain));
    }
    // Allow domains (override blocks)
    for (const domain of (state.allowDomains || [])) {
      const id = allocateId(domain, DYNAMIC_ALLOW_START, usedIds);
      addRules.push(makeAllowRule(id, domain));
    }
  }

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: addRules
    });
  } catch (e) {
    console.warn("Bye Bye Bots: updateDynamicRules error", e);
  }
}

/* ---------- storage change listener ---------- */

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local") return;
  // Re-sync rules whenever relevant settings change
  const relevant = ["enabled", "blockFullSites", "customBlockDomains", "allowDomains"];
  if (relevant.some(k => k in changes)) {
    await syncRulesets();
  }
  // Broadcast changes to all content scripts
  broadcastToContentScripts({ type: "SETTINGS_CHANGED", changes });
});

/* ---------- message handler ---------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATE") {
    chrome.storage.local.get(null).then(state => sendResponse(state));
    return true; // async
  }

  if (msg.type === "SET_STATE") {
    chrome.storage.local.set(msg.data).then(() => {
      syncRulesets().then(() => sendResponse({ ok: true }));
    });
    return true;
  }

  if (msg.type === "VERIFY_PIN") {
    chrome.storage.local.get("pin").then(async ({ pin }) => {
      if (!pin || !pin.enabled) {
        sendResponse({ valid: true });
        return;
      }
      const valid = await verifyPin(msg.pinInput, pin.saltB64, pin.hashB64);
      sendResponse({ valid });
    });
    return true;
  }

  if (msg.type === "SET_PIN") {
    setPin(msg.pinInput).then(result => sendResponse(result));
    return true;
  }

  if (msg.type === "DISABLE_PIN") {
    chrome.storage.local.set({ pin: { enabled: false, saltB64: "", hashB64: "" } })
      .then(() => sendResponse({ ok: true }));
    return true;
  }
});

/* ---------- PIN helpers (Web Crypto SHA-256) ---------- */

async function setPin(pinInput) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = btoa(String.fromCharCode(...salt));
  const hashB64 = await hashPin(salt, pinInput);
  await chrome.storage.local.set({
    pin: { enabled: true, saltB64, hashB64 }
  });
  return { ok: true };
}

async function verifyPin(pinInput, saltB64, hashB64) {
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const computed = await hashPin(salt, pinInput);
  return computed === hashB64;
}

async function hashPin(salt, pin) {
  const encoder = new TextEncoder();
  const data = new Uint8Array([...salt, ...encoder.encode(pin)]);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

/* ---------- broadcast helper ---------- */

async function broadcastToContentScripts(message) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      } catch (_) {}
    }
  } catch (_) {}
}
