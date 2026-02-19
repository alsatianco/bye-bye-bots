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
      // AI Overview container (multiple known variants)
      "[data-aiid]",
      "#m-x-content .kp-wholepage[data-attrid*='ai']",
      ".M8OgIe .XGPnSe",          // AI Overview wrapper
      ".ILfuVd[data-attrid*='AIChatEntryPoint']",
      "[jsname='N760bc']",          // AI overview block
      "#arc-srp",                   // AI arc panel
      "[data-q-a-id]",             // AI Q&A
      ".bS2gfe",                   // AI chat entry
      ".eKPi4",                    // AI mode panel
      ".Wt5Tfe",                   // AI mode suggestion chips
      "div[data-hveid] div[data-initq]", // AI overview with init query
      ".kQdGHd",                   // AI suggestions container
      ".LWkfKe .vdQmEd",          // Generative AI experience container
      ".FYIRhc",                   // AI answer container variant
    ],
    removeSelectors: [
      // "AI Mode" button / tab / chip
      "a[href*='udm=50']",        // AI Mode link/tab
      "[data-loeid='AIChatEntryPoint']",
      ".T2Ycoe [data-sml*='ai']", // AI search mode button
      ".GZKQnc",                   // AI mode tab
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
