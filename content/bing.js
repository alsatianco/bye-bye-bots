/**
 * Bye Bye Bots — Bing content script
 *
 * Removes Copilot sidebar, chat tab, and AI answer blocks
 * from Bing search results pages.
 */
(() => {
  if (typeof PACKS === "undefined" || typeof BlockEngine === "undefined") return;

  const engine = new BlockEngine(PACKS.bing);
  engine.init();
})();
