# Publishing Studio (Phase 2)

Cloudflare Workers + D1 Free allowances, with no paid storage subscription or third-party CMS.

## Public routes
- https://blog.nawazsharif.in/slug — dynamic articles, SEO meta, canonical link and BlogPosting JSON-LD, generated server-side.
- https://blog.nawazsharif.in/sitemap.xml — dynamic article sitemap.
- https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/articles — article metadata for original archive.
- https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/overrides/slug — optional sanitized Markdown body for original GitHub Pages articles.

## Secure editing
- https://nawaz-site-admin.nawaz-site-observer.workers.dev/admin
- Cloudflare Access policy: exact owner email contact@nawazsharif.in
- Identity checked server-side through ctx.access.getIdentity(). No passwords in JavaScript.
- CSRF protection: same-origin JSON writes. Inputs validated on Worker.
- Markdown content with formatting toolbar and live server-rendered preview, not arbitrary HTML.
- New articles can be saved as drafts and published; publishing requires at least 160 characters.
- The original 23 HTML articles remain intact and their URLs unchanged. Optional body replacement occurs only when explicitly enabled. This is a client-side override; for full server-rendered SEO on the original URLs, hosting migration would be required.
- Previous article versions are retained before updates and can be loaded into editor for a controlled restore.
- Images are supported via existing HTTPS URLs; uploads unavailable until storage is separately approved (Cloudflare R2 not enabled).

## Deploy
- Public Worker: workers/api/worker.js and workers/shared/markdown.js
- Admin Worker: workers/admin/worker.js, workers/admin/index.html, workers/admin/client.txt, workers/admin/admin-css.txt, and shared renderer
- Both Workers bind D1 name DB to nawaz_site_content; private visitor logs remain separate.
- No paid upgrades or changes to root DNS or email DNS. Keep within Free plan quotas.
