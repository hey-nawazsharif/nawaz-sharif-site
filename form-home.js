/* V2 contact forms: show Formspree's result on this page, not its hosted thanks page.
   The server must still verify any reCAPTCHA token. JS checks are only UX protection. */
(function () {
  'use strict';

  var forms = document.querySelectorAll('#home-contact-form, #portfolio-form');
  forms.forEach(function (form) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;

    var status = document.createElement('p');
    status.className = 'form-alert';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.hidden = true;
    button.insertAdjacentElement('afterend', status);

    var initialText = button.textContent;
    var busy = false;

    function message(text, isError) {
      status.textContent = text;
      status.classList.toggle('error', isError);
      status.setAttribute('role', isError ? 'alert' : 'status');
      status.hidden = false;
    }

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (busy || !form.reportValidity()) return;

      var hasCaptcha = Boolean(form.querySelector('.g-recaptcha'));
      var recaptcha = window.grecaptcha;
      var token = recaptcha && typeof recaptcha.getResponse === 'function'
        ? recaptcha.getResponse() : '';

      if (hasCaptcha && !token) {
        message('Please complete the security check before sending.', true);
        return;
      }

      var payload = new FormData(form);
      if (hasCaptcha) payload.set('g-recaptcha-response', token);

      busy = true;
      status.hidden = true;
      button.disabled = true;
      button.textContent = 'Sending…';

      try {
        var response = await fetch(form.action, {
          method: 'POST',
          body: payload,
          headers: { 'Accept': 'application/json' },
          mode: 'cors'
        });
        if (!response.ok) {
          var errorText = 'Message could not be submitted. Please try again.';
          try {
            var result = await response.json();
            if (result && Array.isArray(result.errors) && result.errors.length) {
              errorText = result.errors.map(function (e) {
                return e.message || 'Submission rejected';
              }).join(' ');
            }
          } catch (_) {}
          throw new Error(errorText);
        }

        form.reset();
        if (hasCaptcha && recaptcha && typeof recaptcha.reset === 'function') {
          recaptcha.reset();
        }
        message('Thank you! Your message has been submitted successfully.', false);
      } catch (error) {
        if (hasCaptcha && recaptcha && typeof recaptcha.reset === 'function') {
          recaptcha.reset();
        }
        message(error && error.message ? error.message
          : 'Network error. Please try again or email me directly.', true);
      } finally {
        busy = false;
        button.disabled = false;
        button.textContent = initialText;
      }
    });
  });
})();
