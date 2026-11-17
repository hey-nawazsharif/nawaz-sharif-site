# NawazSharif.in — Website V2 launch-readiness record

**Status:** V2 preview branch; **not deployed**. Publication requires the owner's explicit approval.
**Repository:** hey-nawazsharif/nawaz-sharif-site
**Development branch:** website-v2-editorial
**Production:** main / https://nawazsharif.in/
**Production backup:** backup-main-before-v2-2026-11-17 (created from main SHA `8a7c40e22c9a9d44451b51917fa892da159812fe`).

## Reviewed in November 2026

- Editorial homepage, About, FAQ, technical archive, contact, privacy and terms pages were reviewed on Mac and/or mobile with the owner.
- All 23 HTML pages on V2 were checked for their internal file references, duplicate HTML IDs, consistent article footer components and prohibited experience/confidential-project terms; no missing internal file target was identified in that static review.
- Sitemap includes the existing `what-is-linux.html` article; `robots.txt` and `CNAME` are preserved.
- Both V2 forms use the same Formspree endpoint `xqpergwz` and the same Google reCAPTCHA v2 site key; mobile CAPTCHA widgets were reported working by the owner after allowed-domain and preview updates.
- Formspree dashboard displayed CAPTCHA Enabled / Custom reCAPTCHA, and the owner's token-free test received a JSON `{"error":"Please complete the reCAPTCHA"}`. A previous token-free request had appeared in the Inbox before secret-key changes.
- `form-home.js` now parses JSON error responses even if HTTP status is 200; browser success/error regression testing after that code update remains a launch check.
- The cookie notice is informational only; dismissing it is not consent management. Privacy disclosures should be checked against actual third-party service configuration.

## Still requiring confirmation before publishing

1. **Production Formspree / reCAPTCHA compatibility.** Production `main` and V2 currently use *different* public site keys with the **same** Formspree endpoint. Confirm a production-safe matching site/secret pair and validate the live form; do not assume preview success guarantees the live form works. Prefer distinct development and production forms/keys where feasible.
2. **Final valid submission:** Complete reCAPTCHA and send one genuine test message from each V2 page after the response-handling update; ensure the success message corresponds to a message in Formspree Inbox and intended email inbox. Avoid repeating tests once verified.
3. **Professional claim approval:** Homepage and About use `Principal Systems & Cybersecurity Architect`, `Senior Linux Engineer` and advanced production-scale system statements. Obtain owner confirmation that public-facing titles, roles, and described production implementations accurately reflect professional history, or revise to defensible skills/focus statements.
4. **Browser/production smoke test:** Check mobile Safari, all articles, site notice behavior, HTTPS, canonical links and final forms on the real domain once published. A static source review cannot validate live behavior or full legal compliance.
5. **Final permission:** Record current production `main` SHA, review changes, obtain owner's explicit approval, and only then merge or deploy. Preserve the backup and keep confidential projects, UAE history and duration claims out of public copy.

## Safety constraints

- Never edit or merge `main` before explicit owner authorization.
- Do not include confidential AegisOps content, UAE history or "6+ years" statements.
- Preserve existing article URLs, form behavior, and `CNAME`.
- No visitor-IP tracking system has been added. Google Fonts and reCAPTCHA are external providers.
