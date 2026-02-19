# Chrome Web Store Listing Draft — Bye Bye Bots

## Short description (up to ~132 chars)
Block AI chat sites and hide AI features on search engines. A simple parental-control style switch for AI.

## Detailed description
Bye Bye Bots helps you reduce access to AI chat tools and AI answer panels.

It provides two protections you can toggle independently:

1) **Full-site blocking (network-level)**
- Blocks navigation to common AI chat websites.
- Supports a custom block list and an allow list.

2) **Hide AI features inside supported sites (page-level)**
- Hides AI Overviews / AI panels / AI chat entry points on supported search engines.

### Works on
- Google Search
- Bing
- DuckDuckGo
- (Optional) YouTube AI summary surfaces

### Customization
- Global ON/OFF
- “Block full AI chat sites” toggle
- “Hide AI features inside sites” toggle
- Custom blocked domains
- Allow list domains
- Optional PIN lock to discourage casual disabling

### Notes for parents / admins
A determined user can disable or remove extensions unless the browser profile or device is supervised/managed.

## Permission justification (copy/paste into the CWS permission prompt)

### Why the extension needs access to all sites (`<all_urls>`)
Users can add **any** domain to the custom block list or allow list. To apply those rules consistently, the extension needs host access to match requests to any website.

### Why the extension uses Declarative Net Request
The extension blocks/redirects navigation using Chrome’s `declarativeNetRequest` API (rules-based blocking). This is required to implement full-site blocking reliably in Manifest V3.

### Why the extension uses Storage
Settings (toggles, block list, allow list, optional PIN lock) are stored locally using `chrome.storage.local`.

## Privacy practices (high-level, align with your dashboard answers)
- No data selling/sharing
- No analytics or advertising trackers
- No remote code execution
- No browsing history transmitted off-device
- Settings stored locally

## Support
- Support email: (add)
- Website / documentation: (add)
- Privacy policy URL: (host `docs/privacy-policy.md` somewhere public)
