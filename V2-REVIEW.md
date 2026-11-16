# NawazSharif.in — editorial V2 review branch

**Status:** Development only. Not approved for production deployment.
**Repository:** hey-nawazsharif/nawaz-sharif-site
**Branch:** website-v2-editorial
**Production:** main / nawazsharif.in must remain unchanged until explicit owner approval.

## Content and design
- Editorial homepage, About, FAQ, article archive, contact, privacy and terms.
- Existing 14 article HTML files, filenames, original URLs and CNAME remain unchanged.
- `privacy.html` is a compatibility redirect for one existing article link.
- No experience-duration, overseas-history, confidential-project or unverified specialist claims added.
- Shared CSS retains legacy article styling plus new responsive page styles.

## Forms: account-side verification is mandatory
- Homepage uses native POST to https://formspree.io/f/xqpergwz with original public reCAPTCHA site key.
- Separate contact page retains the original Formspree AJAX library and form ID (no new CAPTCHA dependency on this page).
- Real server-side reCAPTCHA configuration, spam protection, endpoint acceptance, success/error UI and delivery to the intended inbox **have not been verified**.
- Do not merge until one unique test message from **each** page reaches both the Formspree dashboard and the destination inbox. Check CAPTCHA failure, invalid email, duplicate click, and fallback when scripts fail.

## Privacy and monetization
- The original `cookies_accepted` localStorage preference is preserved on the homepage.
- Notice dismissal is not a consent-management platform.
- Previous privacy and terms pages loaded AdSense scripts. Those scripts are not included in redesigned legal pages. Verify live monetization/consent requirements before deploying and revise policy accordingly.
- Proposed security monitoring is NOT implemented; no IP logging is added.

## Required before merge
1. Review the V2 website at a **separate staging preview** (do not enable GitHub Pages on the primary domain from this branch).
2. Inspect desktop, mobile Safari and browser console; verify horizontal layout and keyboard navigation.
3. Verify every article URL / archive link, robots.txt, sitemap.xml, HTTPS and canonical tags.
4. Test both Formspree flows end-to-end with account owner; confirm inbox delivery.
5. Verify cookie acceptance after reload and after clearing site data.
6. Check actual AdSense usage, legal-policy language and privacy notice.
7. Review branch diff and record `main` SHA before deployment.
8. Obtain explicit owner approval before merging or deploying.
