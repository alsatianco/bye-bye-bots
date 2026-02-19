/**
 * Bye Bye Bots — YouTube content script
 *
 * Removes AI summary cards and AI-generated features
 * from YouTube pages.
 */
(() => {
  if (typeof PACKS === "undefined" || typeof BlockEngine === "undefined") return;

  const engine = new BlockEngine(PACKS.youtube);
  engine.init();
})();
