/**
 * Bye Bye Bots — Popup script
 *
 * Shows global ON/OFF toggle, status summary, and link to options.
 * Prompts for PIN if PIN lock is enabled.
 */
(() => {
  const globalToggle = document.getElementById("globalToggle");
  const statusText = document.getElementById("statusText");
  const pinOverlay = document.getElementById("pinOverlay");
  const pinInput = document.getElementById("pinInput");
  const pinSubmit = document.getElementById("pinSubmit");
  const pinCancel = document.getElementById("pinCancel");
  const pinError = document.getElementById("pinError");
  const mainContent = document.getElementById("mainContent");
  const openOptions = document.getElementById("openOptions");

  let currentState = {};
  let pendingToggle = null;

  /* ---------- init ---------- */

  chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
    if (!state) state = {};
    currentState = state;
    globalToggle.checked = state.enabled !== false;
    updateStatus(state);
  });

  /* ---------- toggle ---------- */

  globalToggle.addEventListener("change", () => {
    const newValue = globalToggle.checked;

    // If PIN is enabled, prompt before applying
    if (currentState.pin && currentState.pin.enabled) {
      pendingToggle = newValue;
      globalToggle.checked = !newValue; // revert until PIN confirmed
      showPinPrompt();
      return;
    }

    applyToggle(newValue);
  });

  function applyToggle(enabled) {
    chrome.runtime.sendMessage({
      type: "SET_STATE",
      data: { enabled }
    }, () => {
      currentState.enabled = enabled;
      globalToggle.checked = enabled;
      updateStatus(currentState);
    });
  }

  /* ---------- PIN ---------- */

  function showPinPrompt() {
    pinOverlay.style.display = "block";
    pinInput.value = "";
    pinError.style.display = "none";
    pinInput.focus();
  }

  function hidePinPrompt() {
    pinOverlay.style.display = "none";
    pendingToggle = null;
  }

  pinCancel.addEventListener("click", hidePinPrompt);

  pinSubmit.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "VERIFY_PIN",
      pinInput: pinInput.value
    }, (result) => {
      if (result && result.valid) {
        hidePinPrompt();
        if (pendingToggle !== null) {
          applyToggle(pendingToggle);
        }
      } else {
        pinError.style.display = "block";
        pinInput.value = "";
        pinInput.focus();
      }
    });
  });

  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") pinSubmit.click();
  });

  /* ---------- status ---------- */

  function updateStatus(state) {
    if (!state || state.enabled === false) {
      statusText.innerHTML = '<span class="inactive">Protection is OFF</span>';
      return;
    }

    const lines = [];
    if (state.blockFullSites !== false) {
      const builtIn = 18; // count of static rules
      const custom = (state.customBlockDomains || []).length;
      lines.push(`Blocking ${builtIn + custom} AI sites`);
    }
    if (state.blockPartialFeatures !== false) {
      const sites = Object.entries(state.siteToggles || {})
        .filter(([, v]) => v)
        .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
      if (sites.length > 0) {
        lines.push(`Hiding AI on: ${sites.join(", ")}`);
      }
    }
    if (lines.length === 0) {
      lines.push("All protections disabled");
    }
    statusText.innerHTML = '<span class="active">' + lines.join("<br>") + '</span>';
  }

  /* ---------- options link ---------- */

  openOptions.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
})();
