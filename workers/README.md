# Dynamic publishing — Nawaz Sharif website

Production content consists of two types:
- **Original HTML** (23 existing articles) remains on GitHub Pages at the same URLs. Files are not overwritten by the editor. An optional HTML replacement can be switched on after manually reviewing Markdown; the original page remains the JavaScript-disabled and SEO fallback.
- **New articles** are stored in D1 and rendered by Cloudflare Workers at **https://blog.nawazsharif.in/{slug}**. The static archive lists both types through the read-only article API and falls back to original HTML cards if the API fails.

Cloudflare Workers: `nawaz-site-admin` (Cloudflare Access, owner-only), `nawaz-site-api` (public read-only).
D1: `nawaz_site_content` (separate from private visitor logs).
Admin: https://nawaz-site-admin.nawaz-site-observer.workers.dev/admin
Blog: https://blog.nawazsharif.in/
API: https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/articles

### Safety controls
- No public write endpoints. Admin authenticates via Cloudflare runtime ctx.access and checks the owner email server-side.
- Both Origin and Sec-Fetch-Site checked for writes; JSON payload capped at 145 KB.
- Raw HTML is escaped and Markdown has safe link/image URLs; no arbitrary HTML or JavaScript publishing.
- **Save draft never changes the published snapshot.** Publish explicitly updates the published snapshot.
- Revisions are archived on edits.
- Blog pages use canonical URLs, meta description, JSON-LD BlogPosting, and sitemap.xml.
- Images are linked by HTTPS URLs. R2 is not enabled, and no paid storage added.
- Do not expose drafts publicly, disable Cloudflare Access, commit API tokens, or change original URLs.
- Avoid zero-day external HTML import: manual Markdown migration for complex code examples needs review.

Schema: `workers/migrations/0001_articles.sql` and `0002_article_bodies.sql`, plus `published_snapshot` column. Production migrations already applied. ALTER statements are non-idempotent; inspect PRAGMA table_info before rerunning.
