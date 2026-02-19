/**
 * Bye Bye Bots — DuckDuckGo content script
 *
 * Removes DuckAssist and AI chat features
 * from DuckDuckGo search results pages.
 */
(() => {
  if (typeof PACKS === "undefined" || typeof BlockEngine === "undefined") return;

  const engine = new BlockEngine(PACKS.duckduckgo);
  engine.init();
})();
