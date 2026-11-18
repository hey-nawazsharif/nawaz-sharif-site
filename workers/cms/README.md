# Nawaz CMS — WordPress-style content editing (Phase 1)

Deployment target: `cms-preview.nawazsharif.in` (read-only public preview with noindex), built with Cloudflare Workers and the existing D1 database. **The public root `nawazsharif.in` remains on GitHub Pages until browser and form tests pass.** No DNS change to the apex.

Private owner-only dashboard: `https://nawaz-site-admin.nawaz-site-observer.workers.dev/admin/site` (Cloudflare Access, owner email configured in existing admin Worker). The existing article publishing studio is untouched and now links to the Site pages editor.

## Pages and content
- Server-side HTML rewriting via Cloudflare HTMLRewriter, using the existing live GitHub HTML as the origin, so styles, navigation layouts, Formspree contact handling, CAPTCHA markup, article URLs, cookies and media stay intact.
- D1 `site_blocks`: 100 editable fields across homepage, About, FAQ (22 questions and 22 answers), Contact introduction, Articles archive, Privacy, Terms and SEO metadata. Drafts are private, and publishing is explicit.
- D1 `site_settings`: primary navigation, footer navigation, footer tagline. Menu links are validated same-origin paths (no javascript: URLs or external injection).
- D1 `site_revisions`: stores previous draft values for owner recovery.
- Public preview HTML headers `X-Robots-Tag: noindex,nofollow` and robots.txt Disallow to avoid duplicate indexing; existing canonical tags point to `nawazsharif.in`.
- No anonymous write API. All writes use Cloudflare Access runtime identities in the owner-only admin Worker, then same-origin and JSON validation.
- On D1 read errors, the public preview shows original website HTML instead of blank page.
- Existing 23 articles and publication API preserved; no extra software server, Cloudflare R2, subscription or billing changes.

## Boundaries
- This phase provides block/field editing, menus, page titles and descriptions; it is **not yet a full WordPress replacement** (no arbitrary block creation, media uploads, user roles/themes/plugins).
- Dynamic root cutover is intentionally deferred pending browser-based checks including form submission and reCAPTCHA, menu links, CSS/JS/media, caching and SEO.
- Existing pages are fetched as public HTML from GitHub Pages. A later full migration could move page templates to Workers Static Assets, but should not happen without validation.
- Do not use admin edit fields to claim unverified professional roles or reveal confidential work.

## Rollback
- Main site is unchanged and can stay on GitHub Pages.
- Remove or disable the `cms-preview.nawazsharif.in` custom domain without affecting root or `blog.nawazsharif.in`.
- Revert `nawaz-site-admin` to the previous git-committed version of `workers/admin/worker.js` (plus modules) if the CMS extension fails; preserve its Cloudflare Access policy.
