/**
 * Bye Bye Bots — Options page script
 *
 * Full settings management:
 * - Global toggle, full-site block, partial-feature block
 * - Per-site toggles
 * - Custom block list, allow list
 * - PIN lock management
 * - Report broken block diagnostics
 */
(() => {
  /* ---------- built-in blocked domains ---------- */
  const BUILTIN_DOMAINS = [
    "chatgpt.com", "chat.openai.com", "claude.ai", "gemini.google.com",
    "poe.com", "character.ai", "perplexity.ai", "bard.google.com",
    "copilot.microsoft.com", "you.com", "pi.ai", "huggingface.co/chat",
    "deepai.org", "writesonic.com", "jasper.ai", "meta.ai", "grok.com",
    "deepseek.com"
  ];

  /* ---------- DOM refs ---------- */
  const $ = (id) => document.getElementById(id);

  const pinGate = $("pinGate");
  const settingsArea = $("settingsArea");
  const gatePinInput = $("gatePinInput");
  const gatePinSubmit = $("gatePinSubmit");
  const gatePinError = $("gatePinError");

  const globalEnabled = $("globalEnabled");
  const blockFullSites = $("blockFullSites");
  const blockPartialFeatures = $("blockPartialFeatures");

  const siteToggles = {
    google: $("toggleGoogle"),
    bing: $("toggleBing"),
    duckduckgo: $("toggleDuckDuckGo"),
    youtube: $("toggleYouTube")
  };

  const builtinList = $("builtinList");
  const customBlockInput = $("customBlockInput");
  const addCustomBlock = $("addCustomBlock");
  const customBlockList = $("customBlockList");

  const allowInput = $("allowInput");
  const addAllow = $("addAllow");
  const allowList = $("allowList");

  const pinSection = $("pinSection");
  const btnReportBroken = $("btnReportBroken");

  let state = {};
  let pinVerified = false;

  /* ---------- init ---------- */

  chrome.runtime.sendMessage({ type: "GET_STATE" }, (s) => {
    state = s || {};
    // Check if PIN gate is needed
    if (state.pin && state.pin.enabled && !pinVerified) {
      pinGate.style.display = "";
      settingsArea.style.display = "none";
    } else {
      pinGate.style.display = "none";
      settingsArea.style.display = "";
    }
    populateAll();
  });

  /* ---------- PIN gate ---------- */

  gatePinSubmit.addEventListener("click", verifyGatePin);
  gatePinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") verifyGatePin();
  });

  function verifyGatePin() {
    chrome.runtime.sendMessage({
      type: "VERIFY_PIN",
      pinInput: gatePinInput.value
    }, (result) => {
      if (result && result.valid) {
        pinVerified = true;
        pinGate.style.display = "none";
        settingsArea.style.display = "";
      } else {
        gatePinError.style.display = "";
        gatePinInput.value = "";
        gatePinInput.focus();
      }
    });
  }

  /* ---------- populate ---------- */

  function populateAll() {
    // Toggles
    globalEnabled.checked = state.enabled !== false;
    blockFullSites.checked = state.blockFullSites !== false;
    blockPartialFeatures.checked = state.blockPartialFeatures !== false;

    // Site toggles
    for (const [key, el] of Object.entries(siteToggles)) {
      el.checked = (state.siteToggles || {})[key] !== false;
    }

    // Built-in list
    builtinList.innerHTML = "";
    for (const d of BUILTIN_DOMAINS) {
      builtinList.appendChild(makeTag(d, "builtin"));
    }

    // Custom block list
    renderCustomBlocks();

    // Allow list
    renderAllowList();

    // PIN section
    renderPinSection();
  }

  /* ---------- toggle handlers ---------- */

  globalEnabled.addEventListener("change", () => save({ enabled: globalEnabled.checked }));
  blockFullSites.addEventListener("change", () => save({ blockFullSites: blockFullSites.checked }));
  blockPartialFeatures.addEventListener("change", () => save({ blockPartialFeatures: blockPartialFeatures.checked }));

  for (const [key, el] of Object.entries(siteToggles)) {
    el.addEventListener("change", () => {
      const toggles = { ...(state.siteToggles || {}) };
      toggles[key] = el.checked;
      save({ siteToggles: toggles });
    });
  }

  /* ---------- custom block list ---------- */

  addCustomBlock.addEventListener("click", addCustomBlockDomain);
  customBlockInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addCustomBlockDomain(); });

  function addCustomBlockDomain() {
    const raw = customBlockInput.value.trim();
    const domain = normalizeDomain(raw);
    if (!domain) return;

    const list = [...(state.customBlockDomains || [])];
    if (list.includes(domain)) {
      customBlockInput.value = "";
      return;
    }
    list.push(domain);
    customBlockInput.value = "";
    save({ customBlockDomains: list });
  }

  function removeCustomBlock(domain) {
    const list = (state.customBlockDomains || []).filter(d => d !== domain);
    save({ customBlockDomains: list });
  }

  function renderCustomBlocks() {
    customBlockList.innerHTML = "";
    for (const d of (state.customBlockDomains || [])) {
      customBlockList.appendChild(makeTag(d, "custom", () => removeCustomBlock(d)));
    }
  }

  /* ---------- allow list ---------- */

  addAllow.addEventListener("click", addAllowDomain);
  allowInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addAllowDomain(); });

  function addAllowDomain() {
    const raw = allowInput.value.trim();
    const domain = normalizeDomain(raw);
    if (!domain) return;

    const list = [...(state.allowDomains || [])];
    if (list.includes(domain)) {
      allowInput.value = "";
      return;
    }
    list.push(domain);
    allowInput.value = "";
    save({ allowDomains: list });
  }

  function removeAllow(domain) {
    const list = (state.allowDomains || []).filter(d => d !== domain);
    save({ allowDomains: list });
  }

  function renderAllowList() {
    allowList.innerHTML = "";
    for (const d of (state.allowDomains || [])) {
      allowList.appendChild(makeTag(d, "custom", () => removeAllow(d)));
    }
  }

  /* ---------- PIN management ---------- */

  function renderPinSection() {
    const isOn = state.pin && state.pin.enabled;
    pinSection.innerHTML = "";

    const status = document.createElement("p");
    status.className = "pin-status " + (isOn ? "on" : "off");
    status.textContent = isOn ? "PIN lock is enabled" : "PIN lock is disabled";
    pinSection.appendChild(status);

    if (isOn) {
      // Change PIN
      const changeBtn = document.createElement("button");
      changeBtn.className = "btn btn-secondary";
      changeBtn.textContent = "Change PIN";
      changeBtn.style.marginRight = "8px";
      changeBtn.addEventListener("click", () => showPinForm("change"));
      pinSection.appendChild(changeBtn);

      // Disable PIN
      const disableBtn = document.createElement("button");
      disableBtn.className = "btn btn-danger";
      disableBtn.textContent = "Disable PIN";
      disableBtn.addEventListener("click", () => {
        chrome.runtime.sendMessage({ type: "DISABLE_PIN" }, () => {
          state.pin = { enabled: false, saltB64: "", hashB64: "" };
          renderPinSection();
        });
      });
      pinSection.appendChild(disableBtn);
    } else {
      const setBtn = document.createElement("button");
      setBtn.className = "btn btn-primary";
      setBtn.textContent = "Set PIN";
      setBtn.addEventListener("click", () => showPinForm("set"));
      pinSection.appendChild(setBtn);
    }
  }

  function showPinForm(mode) {
    pinSection.innerHTML = "";

    const label = document.createElement("p");
    label.className = "desc";
    label.style.marginBottom = "12px";
    label.textContent = mode === "change" ? "Enter new PIN (4–8 digits)" : "Choose a PIN (4–8 digits)";
    pinSection.appendChild(label);

    const form = document.createElement("div");
    form.className = "pin-form";

    const input = document.createElement("input");
    input.type = "password";
    input.maxLength = 8;
    input.placeholder = "PIN";
    input.autocomplete = "off";
    form.appendChild(input);

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn btn-primary";
    confirmBtn.textContent = "Save";
    confirmBtn.addEventListener("click", () => {
      const val = input.value.trim();
      if (val.length < 4 || val.length > 8) {
        alert("PIN must be 4–8 characters.");
        return;
      }
      chrome.runtime.sendMessage({ type: "SET_PIN", pinInput: val }, () => {
        state.pin = { enabled: true, saltB64: "set", hashB64: "set" };
        renderPinSection();
      });
    });
    form.appendChild(confirmBtn);

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => renderPinSection());
    form.appendChild(cancelBtn);

    pinSection.appendChild(form);
    input.focus();
  }

  /* ---------- report broken block ---------- */

  btnReportBroken.addEventListener("click", () => {
    const diag = {
      version: "1.0.0",
      browser: navigator.userAgent,
      enabled: state.enabled,
      blockFullSites: state.blockFullSites,
      blockPartialFeatures: state.blockPartialFeatures,
      siteToggles: state.siteToggles,
      url: location.href,
      timestamp: new Date().toISOString()
    };
    const text = JSON.stringify(diag, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      alert("Diagnostics copied to clipboard!\n\nPaste it in your bug report.");
    });
  });

  /* ---------- helpers ---------- */

  function save(partial) {
    Object.assign(state, partial);
    chrome.runtime.sendMessage({ type: "SET_STATE", data: partial });
    populateAll();
  }

  function normalizeDomain(raw) {
    if (!raw) return null;
    // Strip protocol + path
    let d = raw.replace(/^https?:\/\//, "").split("/")[0].split("?")[0].toLowerCase().trim();
    // Basic hostname validation
    if (!d || d.includes(" ") || !d.includes(".")) return null;
    return d;
  }

  function makeTag(domain, type, onRemove) {
    const tag = document.createElement("span");
    tag.className = "tag" + (type === "builtin" ? " builtin" : "");
    tag.textContent = domain;

    if (onRemove) {
      const x = document.createElement("span");
      x.className = "remove-tag";
      x.textContent = "×";
      x.addEventListener("click", onRemove);
      tag.appendChild(x);
    }

    return tag;
  }
})();
