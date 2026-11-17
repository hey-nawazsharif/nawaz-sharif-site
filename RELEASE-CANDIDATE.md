# V2 Release Candidate — not deployed

Development branch: `website-v2-editorial`, using dedicated V2 Formspree endpoint `https://formspree.io/f/xaeoeaab`.
This release candidate uses the existing production Formspree endpoint `https://formspree.io/f/xqpergwz` and public reCAPTCHA v2 site key already present on `main` for `nawazsharif.in`.

## Before publishing
- The owner approved the professional titles and About content in conversation on 17 November 2026.
- **Production form is not yet independently verified after reCAPTCHA secret changes.** Ensure `Contact Form` in Formspree (`https://formspree.io/f/xqpergwz`) is configured for the secret corresponding to the production site key; do not post secret keys to GitHub.
- Verify a successful real-domain form submission after deployment. CAPTCHA enforcement and correct error handling must remain functional. The V2 development form must stay independent.
- The preview branch and production `main` should remain unchanged until explicit launch approval.
- Production backup already exists at `backup-main-before-v2-2026-11-17`.
- No confidential project, overseas work history or experience-duration claims may be introduced.
