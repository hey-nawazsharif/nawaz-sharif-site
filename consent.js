/* Keep old bookmarks working while showing the preferred extensionless page URL.
   The equivalent path is verified on GitHub Pages; replaceState does not reload. */
(function () {
  'use strict';
  try {
    var path = window.location.pathname;
    if (!/^\/[a-zA-Z0-9_-]+\.html$/.test(path)) return;
    var clean = path === '/index.html' ? '/' : path.slice(0, -5);
    window.history.replaceState(window.history.state, '', clean + window.location.search + window.location.hash);
  } catch (_) {
    // URL display is cosmetic; never interrupt the page or privacy preferences.
  }
})();

/* Minimal privacy choice panel. Optional site tracking runs only after opt-in. */
(function () {
  'use strict';
  var KEY = 'ns_cookie_preferences_v1';
  var TOKEN = 'f86d3b2fa87342d89f78a8c3ae6ca1a3';
  var privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  var choice = readChoice();
  var trackingLoaded = false;
  var panel = null;

  function readChoice() {
    try {
      var item = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (item && item.version === 1 && typeof item.analytics === 'boolean') return item;
    } catch (e) {}
    return null;
  }
  function saveChoice(enabled) {
    choice = { version: 1, analytics: !!enabled, updatedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(choice)); } catch (e) {}
  }
  function loadTracking() {
    if (trackingLoaded || !choice || !choice.analytics || privacySignal) return;
    if (location.hostname !== 'nawazsharif.in' && location.hostname !== 'www.nawazsharif.in') return;
    trackingLoaded = true;
    var beacon = document.createElement('script');
    beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    beacon.async = true;
    beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
    document.head.appendChild(beacon);
    var logger = document.createElement('script');
    logger.src = '/visit-log.js';
    logger.async = true;
    document.head.appendChild(logger);
  }
  function showDetails(expanded) {
    panel.querySelector('#ns-privacy-details').hidden = !expanded;
    panel.querySelector('#ns-privacy-actions').hidden = expanded;
    panel.querySelector('#ns-privacy-save-actions').hidden = !expanded;
    panel.querySelector('#ns-privacy-customize').setAttribute('aria-expanded', expanded ? 'true' : 'false');
    panel.querySelector('#ns-analytics-opt-in').checked = !!(choice && choice.analytics);
    if (expanded) panel.querySelector('#ns-analytics-opt-in').focus();
    else panel.querySelector('#ns-privacy-customize').focus();
  }
  function openPanel(fromFooter) {
    if (!panel) return;
    panel.hidden = false;
    panel.querySelector('#ns-privacy-details').hidden = true;
    panel.querySelector('#ns-privacy-actions').hidden = false;
    panel.querySelector('#ns-privacy-save-actions').hidden = true;
    panel.querySelector('#ns-privacy-customize').setAttribute('aria-expanded', 'false');
    if (fromFooter) panel.querySelector('#ns-privacy-reject').focus();
  }
  function choose(enabled) {
    var wasLoaded = trackingLoaded;
    saveChoice(enabled);
    panel.hidden = true;
    if (enabled) loadTracking();
    // Previously loaded analytics scripts cannot be unloaded reliably mid-page.
    if (!enabled && wasLoaded) window.location.reload();
  }
  function initialize() {
    var old = document.getElementById('cookie-banner');
    if (old) old.remove();
    panel = document.createElement('aside');
    panel.className = 'ns-privacy-panel';
    panel.id = 'ns-privacy-panel';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', 'ns-privacy-title');
    panel.hidden = true;
    panel.innerHTML =
      '<div class="ns-privacy-heading">' +
        '<div><span class="ns-privacy-kicker">NAWAZSHARIF.IN / PRIVACY</span>' +
        '<h2 id="ns-privacy-title">Your privacy, your choice.</h2></div>' +
      '</div>' +
      '<p class="ns-privacy-intro">We use essential site functions. Optional analytics includes page metrics and private visitor logs (IP, country, page and time). It stays off unless you accept.</p>' +
      '<div class="ns-privacy-buttons" id="ns-privacy-actions">' +
        '<button type="button" class="ns-privacy-button ns-privacy-primary" id="ns-privacy-accept">Accept optional</button>' +
        '<button type="button" class="ns-privacy-button ns-privacy-outline" id="ns-privacy-reject">Reject optional</button>' +
        '<button type="button" class="ns-privacy-button ns-privacy-ghost" id="ns-privacy-customize" aria-controls="ns-privacy-details" aria-expanded="false">Customize</button>' +
      '</div>' +
      '<div class="ns-privacy-details" id="ns-privacy-details" hidden>' +
        '<div class="ns-privacy-detail"><strong>Essential services</strong><span>Always on</span>' +
          '<p>Remember your preference; Google reCAPTCHA may be used to protect contact forms.</p></div>' +
        '<label for="ns-analytics-opt-in" class="ns-privacy-toggle"><span><strong>Optional analytics &amp; visit logs</strong>' +
          '<small>Cloudflare analytics plus private IP, country, page and time logging; records scheduled for deletion after 30 days.</small></span>' +
          '<input type="checkbox" id="ns-analytics-opt-in"></label>' +
        '<p class="ns-privacy-detail-note">Browser Do Not Track and Global Privacy Control settings override optional tracking.</p>' +
      '</div>' +
      '<div class="ns-privacy-buttons ns-privacy-save-actions" id="ns-privacy-save-actions" hidden>' +
        '<button type="button" class="ns-privacy-button ns-privacy-outline" id="ns-privacy-back">Back</button>' +
        '<button type="button" class="ns-privacy-button ns-privacy-primary" id="ns-privacy-save">Save preferences</button>' +
      '</div>' +
      '<p class="ns-privacy-footnote"><a href="/privacy-policy.html">Privacy policy</a><span aria-hidden="true">·</span> Change this choice anytime in the footer.</p>';
    document.body.appendChild(panel);
    panel.querySelector('#ns-privacy-accept').addEventListener('click', function () { choose(true); });
    panel.querySelector('#ns-privacy-reject').addEventListener('click', function () { choose(false); });
    panel.querySelector('#ns-privacy-customize').addEventListener('click', function () { showDetails(true); });
    panel.querySelector('#ns-privacy-back').addEventListener('click', function () { showDetails(false); });
    panel.querySelector('#ns-privacy-save').addEventListener('click', function () {
      choose(panel.querySelector('#ns-analytics-opt-in').checked);
    });

    var footer = document.querySelector('footer .footer-bottom');
    if (footer) {
      var reopen = document.createElement('button');
      reopen.type = 'button';
      reopen.className = 'ns-privacy-footer-link';
      reopen.textContent = 'Cookie preferences';
      reopen.addEventListener('click', function () { openPanel(true); });
      footer.appendChild(reopen);
    }
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href="#cookie-preferences"]');
      if (link) {
        event.preventDefault();
        openPanel(true);
      }
    });
    if (!choice) openPanel(false);
  }

  // The older cookie-notice dismissal setting never counts as consent.
  loadTracking();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();