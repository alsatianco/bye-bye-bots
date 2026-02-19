/**
 * Bye Bye Bots — Google Search content script
 *
 * Removes AI Overview, AI Mode buttons, and other AI features
 * from Google Search results pages.
 */
(() => {
  if (typeof PACKS === "undefined" || typeof BlockEngine === "undefined") return;

  const engine = new BlockEngine(PACKS.google);
  engine.init();
})();
