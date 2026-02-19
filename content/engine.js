/**
 * Bye Bye Bots — DOM Block Engine
 *
 * Shared utility used by per-site content scripts.
 * Handles CSS injection, DOM removal, MutationObserver, and settings sync.
 */

// eslint-disable-next-line no-unused-vars
class BlockEngine {
  /**
   * @param {object} pack - A pack from PACKS (see packs.js)
   */
  constructor(pack) {
    this.pack = pack;
    this.observer = null;
    this.styleEl = null;
    this.enabled = false;
    this.pendingScan = false;
    this.scanTimer = null;
    this.DEBOUNCE_MS = 200;
  }

  /**
   * Initialize the engine: read settings, inject CSS, observe DOM.
   */
  async init() {
    try {
      const state = await this._getState();
      this.enabled = state.enabled &&
                     state.blockPartialFeatures &&
                     (state.siteToggles || {})[this.pack.key] !== false;

      if (this.enabled) {
        this._injectCss();
        this._applyOnce();
        this._startObserver();
      }

      this._listenForChanges();
    } catch (e) {
      console.warn("Bye Bye Bots engine init error:", e);
    }
  }

  /**
   * Remove all injected elements and stop observing.
   */
  destroy() {
    this._stopObserver();
    if (this.styleEl && this.styleEl.parentNode) {
      this.styleEl.parentNode.removeChild(this.styleEl);
      this.styleEl = null;
    }
  }

  /* ---------- CSS injection (prevents flash of AI content) ---------- */

  _injectCss() {
    if (this.styleEl) return;
    const allSelectors = [
      ...(this.pack.hideSelectors || []),
      ...(this.pack.removeSelectors || [])
    ];
    if (allSelectors.length === 0) return;

    this.styleEl = document.createElement("style");
    this.styleEl.id = "bye-bye-bots-css";
    this.styleEl.textContent = allSelectors.join(",\n") +
      " {\n  display: none !important;\n  visibility: hidden !important;\n  height: 0 !important;\n  overflow: hidden !important;\n}\n";

    // Insert as early as possible
    const target = document.head || document.documentElement;
    if (target) {
      target.insertBefore(this.styleEl, target.firstChild);
    }
  }

  _removeCss() {
    if (this.styleEl && this.styleEl.parentNode) {
      this.styleEl.parentNode.removeChild(this.styleEl);
      this.styleEl = null;
    }
  }

  /* ---------- DOM scanning ---------- */

  _applyOnce() {
    // Hide elements by hideSelectors
    for (const sel of (this.pack.hideSelectors || [])) {
      try {
        document.querySelectorAll(sel).forEach(el => {
          el.style.setProperty("display", "none", "important");
          el.setAttribute("data-bbb-hidden", "1");
        });
      } catch (_) {}
    }

    // Remove elements by removeSelectors
    for (const sel of (this.pack.removeSelectors || [])) {
      try {
        document.querySelectorAll(sel).forEach(el => {
          el.setAttribute("data-bbb-removed", "1");
          el.style.setProperty("display", "none", "important");
        });
      } catch (_) {}
    }
  }

  _undoApply() {
    document.querySelectorAll("[data-bbb-hidden]").forEach(el => {
      el.style.removeProperty("display");
      el.removeAttribute("data-bbb-hidden");
    });
    document.querySelectorAll("[data-bbb-removed]").forEach(el => {
      el.style.removeProperty("display");
      el.removeAttribute("data-bbb-removed");
    });
  }

  /* ---------- MutationObserver ---------- */

  _startObserver() {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      this._scheduleScan();
    });

    const root = document.documentElement || document.body;
    if (root) {
      this.observer.observe(root, {
        childList: true,
        subtree: true
      });
    }
  }

  _stopObserver() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  _scheduleScan() {
    if (this.pendingScan) return;
    this.pendingScan = true;
    this.scanTimer = setTimeout(() => {
      this.pendingScan = false;
      if (this.enabled) {
        this._applyOnce();
      }
    }, this.DEBOUNCE_MS);
  }

  /* ---------- settings sync ---------- */

  _listenForChanges() {
    // Listen for storage changes (live toggle)
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      this._reconfigure();
    });

    // Listen for direct messages from popup/service worker
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "SETTINGS_CHANGED") {
        this._reconfigure();
      }
    });
  }

  async _reconfigure() {
    try {
      const state = await this._getState();
      const shouldBeEnabled = state.enabled &&
                              state.blockPartialFeatures &&
                              (state.siteToggles || {})[this.pack.key] !== false;

      if (shouldBeEnabled && !this.enabled) {
        // turning ON
        this.enabled = true;
        this._injectCss();
        this._applyOnce();
        this._startObserver();
      } else if (!shouldBeEnabled && this.enabled) {
        // turning OFF
        this.enabled = false;
        this._stopObserver();
        this._removeCss();
        this._undoApply();
      }
    } catch (e) {
      console.warn("Bye Bye Bots reconfigure error:", e);
    }
  }

  _getState() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
        if (chrome.runtime.lastError) {
          // fallback: read storage directly
          chrome.storage.local.get(null, (s) => resolve(s || {}));
        } else {
          resolve(state || {});
        }
      });
    });
  }
}
