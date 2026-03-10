/**
 * Bye Bye Bots — Google Search content script
 *
 * Removes AI Overview, AI Mode buttons, and other AI features
 * from Google Search results pages.
 */
(() => {
  if (typeof PACKS === "undefined" || typeof BlockEngine === "undefined") return;

  /* ---------- AI Mode (udm=50) redirect ---------- */

  const AI_MODE_PARAM_RE = /[?&]udm=50(?:[&#]|$)/;

  /**
   * If the current page is Google AI Mode (udm=50), hide the page
   * immediately and redirect to the same search without AI mode.
   * This is a content-script fallback for when the DNR rule hasn't
   * fired (e.g. blockFullSites is off but blockPartialFeatures is on).
   */
  if (AI_MODE_PARAM_RE.test(window.location.search)) {
    // Hide page instantly to prevent AI content flash
    const hideStyle = document.createElement("style");
    hideStyle.id = "bbb-ai-mode-hide";
    hideStyle.textContent = "html{visibility:hidden!important}";
    document.documentElement.prepend(hideStyle);

    chrome.storage.local.get(null, (state) => {
      state = state || {};
      const shouldBlock = state.enabled !== false &&
                          state.blockPartialFeatures !== false &&
                          (state.siteToggles || {}).google !== false;
      if (shouldBlock) {
        try {
          const url = new URL(window.location.href);
          url.searchParams.delete("udm");
          window.location.replace(url.toString());
          return;
        } catch (_) { /* fall through */ }
      }
      // Not blocking — reveal the page
      const s = document.getElementById("bbb-ai-mode-hide");
      if (s) s.remove();
    });
  }

  /* ---------- "Dive deeper in AI mode" promo removal ---------- */

  /**
   * Regex matching common AI-mode promo text on Google SERPs.
   * Covers variations across browsers / A-B tests.
   */
  const AI_PROMO_RE = /\b(dive deeper.*ai|try ai mode|switch to ai mode|learn more in ai mode|ask.{0,20}follow.{0,5}up.{0,20}ai mode|generate.*ai.*answer)\b/i;

  function removeAiModePromos() {
    // 1. Remove links / buttons that point to AI mode by href
    //    Hide the link element itself (not the parent container — we don't
    //    want to remove the entire AI Overview block, just the chat entry).
    document.querySelectorAll('a[href*="udm=50"]').forEach(el => {
      if (el.getAttribute("data-bbb-hidden")) return;
      el.style.setProperty("display", "none", "important");
      el.setAttribute("data-bbb-hidden", "1");
    });

    // 2. Text-based scan: find and hide "Learn more in AI mode",
    //    "Dive deeper in AI mode" and similar promo buttons/links.
    //    This catches elements regardless of tag/class differences across browsers.
    //    Only hide the matched element itself — not parent containers —
    //    so the AI Overview informational block stays visible.
    const candidates = document.querySelectorAll(
      'a, button, [role="link"], [role="button"], .card-section'
    );
    candidates.forEach(el => {
      if (el.getAttribute("data-bbb-hidden")) return;
      const text = el.textContent || "";
      // Only check reasonably-sized text (avoid scanning huge containers)
      if (text.length > 0 && text.length < 200 && AI_PROMO_RE.test(text)) {
        el.style.setProperty("display", "none", "important");
        el.setAttribute("data-bbb-hidden", "1");
      }
    });
  }

  /* ---------- Engine init with augmented scanning ---------- */

  const engine = new BlockEngine(PACKS.google);

  // Patch _applyOnce so every DOM scan also removes AI-mode promos
  const _origApply = engine._applyOnce.bind(engine);
  engine._applyOnce = function () {
    _origApply();
    if (engine.enabled) {
      removeAiModePromos();
    }
  };

  engine.init();
})();
