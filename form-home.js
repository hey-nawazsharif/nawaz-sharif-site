/* V2 contact forms: show Formspree's result on this page, not its hosted thanks page.
   The server must still verify any reCAPTCHA token. JS checks are only UX protection. */
(function () {
  'use strict';

  var forms = document.querySelectorAll('form[action^="https://formspree.io/f/"]');
  forms.forEach(function (form) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;

    // The HTML maxlength is the limit; the counter only mirrors current input.
    var messageField = form.querySelector('textarea[name="message"][maxlength]');
    var counter = form.querySelector('.message-counter');
    var updateCounter = null;
    if (messageField && counter) {
      updateCounter = function () {
        counter.textContent = messageField.value.length + ' / ' + messageField.maxLength + ' characters';
      };
      messageField.addEventListener('input', updateCounter);
      updateCounter();
    }

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
        // Formspree can report validation or CAPTCHA errors in JSON
        // even when the HTTP response status is 200.
        var result;
        try {
          result = await response.json();
        } catch (_) {
          throw new Error('Could not confirm submission. Please try again or email me directly.');
        }

        var errorText = '';
        if (result && typeof result.error === 'string' && result.error.trim()) {
          errorText = result.error;
        } else if (result && Array.isArray(result.errors) && result.errors.length) {
          errorText = result.errors.map(function (e) {
            return typeof e === 'string' ? e : (e && e.message) || 'Submission rejected';
          }).join(' ');
        } else if (result && (result.ok === false || result.success === false)) {
          errorText = 'Form submission was not accepted. Please try again.';
        }

        if (!response.ok || errorText) {
          throw new Error(errorText || 'Message could not be submitted. Please try again.');
        }

        form.reset();
        if (updateCounter) updateCounter();
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
