/**
 * Bye Bye Bots — Site Packs
 *
 * Data-driven selector definitions for partial-page AI blocking.
 * Each pack defines CSS selectors to hide/remove AI features on a given site.
 *
 * Selector strategy:
 * - Prefer aria-label, role, data-* attributes for stability
 * - Maintain multiple selectors per feature (A/B variant coverage)
 * - Include failsafe heuristic text patterns
 */

// eslint-disable-next-line no-unused-vars
const PACKS = {
  google: {
    key: "google",
    hideSelectors: [
      // Only AI Mode panels / chips — NOT AI Overview content
      ".eKPi4",                    // AI mode panel
      ".Wt5Tfe",                   // AI mode suggestion chips
      // AI Mode promo / entry point containers
      "[data-attrid*='AIMode']",
      "[data-attrid*='AiMode']",
      "[data-attrid*='ai_mode']",
    ],
    removeSelectors: [
      // "AI Mode" button / tab / chip
      "a[href*='udm=50']",        // AI Mode link/tab
      ".T2Ycoe [data-sml*='ai']", // AI search mode button
      ".GZKQnc",                   // AI mode tab
      // Broader AI Mode entry points (Edge / variant UIs)
      "button[data-enable_aml]",   // AI mode launch button
      "[jsaction*='aiMode']",      // JS-action AI mode buttons
    ],
    heuristicTexts: ["AI Overview", "AI Mode", "Generative AI is experimental"],
  },

  bing: {
    key: "bing",
    hideSelectors: [
      // Copilot sidebar/panel
      "#b_sydConvCont",            // Sydney conversation container
      "#b_sydWelcome",             // Copilot welcome
      "#b_results .b_sydConv",     // Copilot in results
      "#b-scopeListItem-conv",     // Chat tab
      ".cib-serp-main",            // Copilot SERP main
      "#b_pole .bnc_copilot_pane", // Copilot pole position
      "[data-bm='CopilotSydney']",
      ".b_aiTopSection",           // AI top section
      ".b_aiAns",                  // AI answer block
      "#copilot-main-container",
    ],
    removeSelectors: [
      // Chat / Copilot tab entry points
      "a[href*='/chat']",
      "#b-scopeListItem-conv",
      ".b_scopebar a[href*='chat']",
    ],
    heuristicTexts: ["Copilot", "AI-generated"],
  },

  duckduckgo: {
    key: "duckduckgo",
    hideSelectors: [
      // DuckAssist / AI answer
      "[data-testid='aiAnswer']",
      ".module--ai",
      ".EAm1Qe",                   // AI answer container
      "[data-area='aiChat']",
      ".js-duckAssist",
      ".module--duckAssist",
      "#duckbar a[data-zci-link='ai_chat']",
      ".ai-chat-main",
    ],
    removeSelectors: [
      // AI Chat entry points
      "a[href*='/aichat']",
      "[data-testid='ai-chat-tab']",
    ],
    heuristicTexts: ["DuckAssist", "AI Chat", "AI-generated"],
  },

  youtube: {
    key: "youtube",
    hideSelectors: [
      // AI summary cards
      "ytd-ai-summary-renderer",
      "#ai-summary",
      "ytd-engagement-panel-section-list-renderer[target-id*='ai']",
      "[data-target-id*='ai_summary']",
    ],
    removeSelectors: [],
    heuristicTexts: ["AI-generated summary"],
  }
};
