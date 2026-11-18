/* Cookie preferences: no optional analytics or private IP logs without opt-in. */
(function () {
  'use strict';
  var KEY = 'ns_cookie_preferences_v1';
  var TOKEN = 'f86d3b2fa87342d89f78a8c3ae6ca1a3';
  var privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  var choice = readChoice();
  var trackingLoaded = false;
  var overlay = null, previousFocus = null;

  function readChoice() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (v && v.version === 1 && typeof v.analytics === 'boolean') return v;
    } catch (e) {}
    return null;
  }
  function saveChoice(analytics) {
    choice = { version: 1, analytics: !!analytics, updatedAt: new Date().toISOString() };
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
  function closePanel() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('ns-privacy-open');
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }
  function setCustom(custom) {
    overlay.querySelector('#ns-privacy-custom').hidden = !custom;
    overlay.querySelector('#ns-privacy-actions').hidden = custom;
    overlay.querySelector('#ns-privacy-save').hidden = !custom;
    overlay.querySelector('#ns-privacy-back').hidden = !custom;
    overlay.querySelector('#ns-analytics-opt-in').checked = !!(choice && choice.analytics);
    if (custom) overlay.querySelector('#ns-analytics-opt-in').focus();
  }
  function openPanel() {
    if (!overlay) return;
    previousFocus = document.activeElement;
    setCustom(false);
    overlay.hidden = false;
    document.body.classList.add('ns-privacy-open');
    overlay.querySelector('#ns-privacy-reject').focus();
  }
  function choose(yes) {
    var wasLoaded = trackingLoaded;
    saveChoice(yes);
    closePanel();
    if (choice.analytics) loadTracking();
    // Reload after withdrawal: an already-running beacon cannot be reliably unloaded.
    if (!choice.analytics && wasLoaded) location.reload();
  }
  function initialize() {
    var old = document.getElementById('cookie-banner');
    if (old) old.remove();
    overlay = document.createElement('div');
    overlay.id = 'ns-privacy-overlay';
    overlay.className = 'ns-privacy-overlay';
    overlay.hidden = true;
    overlay.innerHTML =
      '<section class="ns-privacy-panel" role="dialog" aria-modal="true" aria-labelledby="ns-privacy-title" aria-describedby="ns-privacy-description">' +
      '<div class="ns-privacy-heading"><span class="ns-privacy-shield" aria-hidden="true">◈</span><div>' +
      '<p class="ns-privacy-kicker">YOUR PRIVACY MATTERS</p><h2 id="ns-privacy-title">Privacy &amp; Cookie Preferences</h2></div></div>' +
      '<p id="ns-privacy-description" class="ns-privacy-intro">Choose whether to allow optional website analytics. Essential site features still work if you decline.</p>' +
      '<div class="ns-privacy-row"><div><strong>Essential site functions</strong>' +
      '<p>Saved privacy choice and contact-form spam protection (Google reCAPTCHA on form pages).</p></div>' +
      '<span class="ns-privacy-status">Always active</span></div>' +
      '<div class="ns-privacy-row"><div><strong>Optional site analytics</strong>' +
      '<p>Cloudflare page/performance metrics and private visit logs (IP address, country, page and time; scheduled deletion after 30 days).</p></div>' +
      '<span class="ns-privacy-status">Off by default</span></div>' +
      '<div class="ns-privacy-custom" id="ns-privacy-custom" hidden>' +
      '<label for="ns-analytics-opt-in"><span><strong>Allow optional analytics</strong>' +
      '<small>You may change this later using the footer link.</small></span>' +
      '<input id="ns-analytics-opt-in" type="checkbox"></label></div>' +
      '<div class="ns-privacy-buttons" id="ns-privacy-actions">' +
      '<button type="button" id="ns-privacy-reject" class="ns-privacy-button ns-privacy-outline">Reject Optional</button>' +
      '<button type="button" id="ns-privacy-customize" class="ns-privacy-button ns-privacy-ghost">Customize</button>' +
      '<button type="button" id="ns-privacy-accept" class="ns-privacy-button ns-privacy-primary">Accept Optional</button></div>' +
      '<div class="ns-privacy-buttons ns-privacy-save-actions">' +
      '<button type="button" id="ns-privacy-back" class="ns-privacy-button ns-privacy-ghost" hidden>Back</button>' +
      '<button type="button" id="ns-privacy-save" class="ns-privacy-button ns-privacy-primary" hidden>Save Preferences</button></div>' +
      '<p class="ns-privacy-footnote">No advertising pixels are installed by this site. ' +
      '<a href="/privacy-policy.html">Privacy Policy</a>. Browser Do Not Track and Global Privacy Control are respected.</p>' +
      '</section>';
    document.body.appendChild(overlay);
    overlay.querySelector('#ns-privacy-reject').addEventListener('click', function () { choose(false); });
    overlay.querySelector('#ns-privacy-accept').addEventListener('click', function () { choose(true); });
    overlay.querySelector('#ns-privacy-customize').addEventListener('click', function () { setCustom(true); });
    overlay.querySelector('#ns-privacy-back').addEventListener('click', function () { setCustom(false); });
    overlay.querySelector('#ns-privacy-save').addEventListener('click', function () {
      choose(overlay.querySelector('#ns-analytics-opt-in').checked);
    });
    overlay.addEventListener('keydown', function (event) {
      if (event.key !== 'Tab' || overlay.hidden) return;
      var focusable = Array.prototype.slice.call(overlay.querySelectorAll('button:not([hidden]),input:not([hidden]),a[href]'))
        .filter(function (node) { return !node.closest('[hidden]'); });
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    var footer = document.querySelector('footer .footer-bottom');
    if (footer) {
      var reopen = document.createElement('button');
      reopen.type = 'button';
      reopen.className = 'ns-privacy-footer-link';
      reopen.textContent = 'Cookie preferences';
      reopen.addEventListener('click', openPanel);
      footer.appendChild(reopen);
    }
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href="#cookie-preferences"]');
      if (link) { event.preventDefault(); openPanel(); }
    });
    if (!choice) openPanel();
  }
  // Old notice-dismissal value is never treated as consent.
  loadTracking();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();