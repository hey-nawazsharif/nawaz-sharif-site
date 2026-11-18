# CMS Publishing Safety and Backup (November 2026)

Scope: private CMS only. Production homepage design, static HTML, original article URLs, Cloudflare DNS, GitHub Pages and visitor logging remain unchanged.

## Migration and Deployment
1. Apply 0003_site_page_versions.sql to the existing nawaz_site_content D1 database before deploying the Admin Worker.
2. Deploy the Admin Worker, including site-api.js, site-client.txt, backup-api.js and matching HTML.
3. Keep the existing Cloudflare Access owner identity check in the main Worker. Never expose backup-api.js in a public Worker.

## Changes
- Optimistic versions protect each of seven editable pages and global navigation/footer settings from stale-tab overwrites.
- Each Save Draft or Publish request sends the last fetched version. A stale version receives HTTP 409 with no published content change.
- Page updates and revision snapshots are guarded in one D1 transaction.
- Navigation and tab-close prompts warn about unsaved edits.
- Save Draft does not overwrite published content.
- An owner-only GET at /admin/api/backup generates a private, noncacheable JSON download with articles, article revisions, page blocks, settings, builder documents, visual design and media metadata plus revision history. The export is never added to public GitHub or Cloudflare R2.
- Export excludes Cloudflare secrets, visitor logs, GitHub Pages original source, media binaries and external services.
- The JSON is recovery data, NOT a one-click restore; importing requires schema migrations, verification and careful testing.
- Cloudflare D1 built-in point-in-time recovery is separate; account availability and retention should be checked before relying on it.

## Tests
In-memory SQLite tests cover draft/public separation, stale writes, revision counts, origin rules and backup completeness/headers. GitHub Actions also checks unauthenticated access and public CMS preview smoke tests.

## Remaining browser checks
A logged-in owner should verify the dashboard download, Save Draft, Publish, revision loading, contact form, real reCAPTCHA and mobile usability. CI cannot validate real email delivery or genuine CAPTCHA submissions.
