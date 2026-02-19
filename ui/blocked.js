// ===== Blocked domain display =====
(function () {
  var domainEl = document.getElementById("blockedDomain");

  // Try to extract the blocked domain from the URL query string
  // Expected format: ?url=https://example.com/... or ?domain=example.com
  var params = new URLSearchParams(window.location.search);
  var blocked = params.get("url") || params.get("domain") || "";

  if (blocked) {
    try {
      // If it looks like a full URL, extract just the hostname
      var url = new URL(blocked);
      domainEl.textContent = "🚫 " + url.hostname + " is paused on this device.";
    } catch (_) {
      domainEl.textContent = "🚫 " + blocked + " is paused on this device.";
    }
  }

})();
