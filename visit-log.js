/* Lightweight visit logging. No cookies or browser fingerprinting.
   The receiving Cloudflare Worker stores IP, country, page and UTC time privately.
   DNT / Global Privacy Control preferences are respected. */
(function () {
  'use strict';
  var host = location.hostname.toLowerCase();
  if (host !== 'nawazsharif.in' && host !== 'www.nawazsharif.in') return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  var page = location.pathname || '/';
  if (!/^\/[a-zA-Z0-9/_\-.]*$/.test(page) || page.length > 220) return;
  var endpoint = 'https://nawaz-visit-logger.nawaz-site-observer.workers.dev/collect';
  var payload = JSON.stringify({ page: page });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, payload)) return;
  } catch (_) {}
  try {
    fetch(endpoint, { method: 'POST', mode: 'no-cors', keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, body: payload }).catch(function () {});
  } catch (_) {}
})();
