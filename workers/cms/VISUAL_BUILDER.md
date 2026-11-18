# Nawaz CMS Visual Builder — Phase 2

## Supported now
- Owner-only interface: /admin/builder on the existing Cloudflare Access-protected \`nawaz-site-admin\` Worker
- Sections on Homepage, About, FAQ, Contact, Articles (in addition to preserved original HTML)
- Types: Text/Markdown, Image + text, CTA, Quote, Two-column, Divider
- Drag-and-drop reorder on desktop, up/down reorder controls on mobile
- Placement before or after original page body (top/bottom)
- Isolated Save Draft and Publish; server-rendered draft preview accessible only in admin
- Public preview uses only \`site_documents.published_json\` and \`site_design.published_json\`
- Theme presets (Forest, Slate, Sand), spacing presets
- Existing media URLs from nawazsharif.in and registered HTTPS external image links
- D1 revision history and restore-to-editor; input validation and raw HTML escaping
- Mobile-first responsive builder; Cloudflare Access identity owner-only
- No new paid services, WordPress/PHP runtime or VPS

## Safety
- Public production \`nawazsharif.in\` remains on GitHub Pages, **unchanged**.
- Builder sections only render on \`cms-preview.nawazsharif.in\`, which is noindex.
- Cloudflare Worker uses HTMLRewriter with escaped Markdown, safe URL validation, and no user-provided JavaScript or raw HTML.
- The public preview fetches existing website HTML, retains contact Formspree/CAPTCHA and cookies, appends/prepends published sections to main.
- Admin writes require Worker-level Cloudflare Access identity match and same-origin JSON requests; fail closed without identity.
- Direct media file uploads, arbitrary Elementor-like layouts, plugin system and multi-user roles are **not implemented**.
- Media library URLs point to external sources; an external image host may see visitor IP addresses. Prefer images already hosted on the website.
- Do not enable R2 subscriptions or expose draft content publicly.

## Migration
Do not reroute root DNS until real form submission, CAPTCHA, cookie consent, asset load, all URLs, mobile layout, and SEO are visually verified. Rollback is leaving GitHub Pages root unchanged and disabling preview if needed. The feature is an early custom page builder, not WordPress itself.
