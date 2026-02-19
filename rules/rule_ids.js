/**
 * Rule ID constants and helpers for Bye Bye Bots DNR rules.
 *
 * Static rule IDs:        1 – 999
 * Dynamic block rule IDs: 10,000+
 * Dynamic allow rule IDs: 20,000+
 */

export const STATIC_RULE_START = 1;
export const DYNAMIC_BLOCK_START = 10000;
export const DYNAMIC_ALLOW_START = 20000;

// Priorities
export const BLOCK_PRIORITY = 1;
export const ALLOW_PRIORITY = 100; // higher → overrides blocks

/**
 * Generate a deterministic rule ID from a domain string.
 * Uses a simple hash so we can remove rules by domain later.
 */
export function domainToId(domain, base) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return base + (Math.abs(hash) % 10000);
}

/**
 * Build a redirect-to-blocked-page rule for a domain.
 */
export function makeBlockRule(id, domain) {
  return {
    id,
    priority: BLOCK_PRIORITY,
    action: {
      type: "redirect",
      redirect: { extensionPath: "/ui/blocked.html?domain=" + encodeURIComponent(domain) }
    },
    condition: {
      urlFilter: "||" + domain + "/",
      resourceTypes: ["main_frame"]
    }
  };
}

/**
 * Build an API-blocking rule for a domain (blocks XHR, sub_frame, script).
 */
export function makeApiBlockRule(id, domain) {
  return {
    id: id + 5000, // offset to avoid collision
    priority: BLOCK_PRIORITY,
    action: { type: "block" },
    condition: {
      urlFilter: "||" + domain + "/",
      resourceTypes: ["xmlhttprequest", "sub_frame", "script"]
    }
  };
}

/**
 * Build an allow rule for a domain (overrides block rules).
 */
export function makeAllowRule(id, domain) {
  return {
    id,
    priority: ALLOW_PRIORITY,
    action: { type: "allow" },
    condition: {
      urlFilter: "||" + domain + "/",
      resourceTypes: ["main_frame", "xmlhttprequest", "sub_frame", "script"]
    }
  };
}
