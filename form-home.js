/* Editorial V2: submit to Formspree in place, without leaving this website.
   Preserve the HTML form action so local preview can use a separate test form.
   Formspree (not this script) must also verify reCAPTCHA server-side. */
(function () {
  'use strict';

  var form = document.getElementById('home-contact-form');
  var notice = document.getElementById('home-form-error');
  if (!form || !notice) return;

  var button = form.querySelector('button[type="submit"]');
  if (!button) return;
  var initialLabel = button.textContent;
  var busy = false;

  function showMessage(message, success) {
    notice.textContent = message;
    notice.classList.toggle('error', !success);
    notice.setAttribute('role', success ? 'status' : 'alert');
    notice.setAttribute('aria-live', success ? 'polite' : 'assertive');
    notice.hidden = false;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy) return;

    if (!form.reportValidity()) return;

    var captcha = window.grecaptcha;
    var responseToken = captcha && typeof captcha.getResponse === 'function'
      ? captcha.getResponse()
      : '';
    if (!responseToken) {
      showMessage('Please complete the security check before sending.', false);
      return;
    }

    var data = new FormData(form);
    data.set('g-recaptcha-response', responseToken);
    busy = true;
    notice.hidden = true;
    button.disabled = true;
    button.textContent = 'Sending…';

    try {
      var response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) {
        var message = 'Your message could not be sent. Please try again.';
        try {
          var result = await response.json();
          if (Array.isArray(result.errors) && result.errors.length) {
            message = result.errors.map(function (item) {
              return item.message || 'Submission failed';
            }).join(' ');
          }
        } catch (_) {
          // Keep generic failure message if the server did not return JSON.
        }
        throw new Error(message);
      }

      // Formspree accepted the submission; delivery to the inbox is separate.
      form.reset();
      if (captcha && typeof captcha.reset === 'function') captcha.reset();
      showMessage('Thank you! Your message has been sent successfully.', true);
    } catch (error) {
      showMessage(error && error.message
        ? error.message
        : 'Network error. Please try again or email me directly.', false);
      if (captcha && typeof captcha.reset === 'function') captcha.reset();
    } finally {
      busy = false;
      button.disabled = false;
      button.textContent = initialLabel;
    }
  });
})();
