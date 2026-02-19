# Bye Bye Bots — Privacy Policy

**Last updated:** 2026-02-15

Bye Bye Bots is a Chrome extension that helps block access to selected AI chat websites and hide AI features on certain search engines.

## Summary

- Bye Bye Bots does **not** sell, share, or transfer personal data to third parties.
- Bye Bye Bots does **not** use analytics or advertising trackers.
- Bye Bye Bots does **not** send your browsing history to any server.
- Settings are stored **locally on your device** using Chrome extension storage.

## What data the extension accesses

To do its job, the extension may **observe the websites you navigate to** so it can decide whether to block or allow a page.

Specifically:

- **Websites you visit (URL matching):** Used to determine whether a request matches a blocked/allowed domain.
- **Extension settings:** Such as protection toggles, custom block list, allow list, and (optional) PIN lock.

## What data the extension collects

The extension stores the following **locally** (on-device) via `chrome.storage.local`:

- Global ON/OFF and feature toggles
- Per-site toggles (Google/Bing/DuckDuckGo/YouTube)
- Custom blocked domains and allow-list domains
- Optional PIN lock state (stored as a salted SHA-256 hash; the PIN itself is not stored in plain text)

## What data the extension does NOT collect

Bye Bye Bots does **not**:

- collect names, emails, phone numbers, or account identifiers
- collect or transmit full browsing history
- read the contents of your private messages or form inputs
- use remote code execution (no externally hosted scripts)

## Data sharing

Bye Bye Bots does not share data with any third parties.

## Data transfer

Bye Bye Bots does not transmit personal data to a remote server.

## Data retention & deletion

All extension data is stored locally in your browser profile.

To delete the data:

- Open Chrome → Extensions → Bye Bye Bots → **Remove**
- Or keep the extension installed and clear its local data from the extension’s site data/storage tools

## Permissions explanation

Bye Bye Bots requests the following permissions:

- `declarativeNetRequest` / `declarativeNetRequestWithHostAccess`: to block or redirect navigation to blocked domains.
- `host_permissions` (`<all_urls>`): to apply blocking/allow rules to any domain you choose to add to your custom block list or allow list.
- `storage`: to save your settings locally.

## Children / parental control use

Bye Bye Bots is designed for parental control scenarios. It does not include behavioral advertising, profiling, or data monetization.

## Contact

If you have questions about this policy, contact:

- **Support email:** (add your support email here)
- **Project / homepage:** (add your website or repo link here)
