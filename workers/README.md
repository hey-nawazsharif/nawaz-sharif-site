# Dynamic Site — Phase 1 (No Paid Hosting)

- Public Cloudflare Worker: nawaz-site-api (read-only).
- D1 database: nawaz_site_content, binding DB.
- Public API: https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/articles
- Health: https://nawaz-site-api.nawaz-site-observer.workers.dev/health
- Data currently contains article metadata, not article bodies.
- Original HTML article links, GitHub Pages hosting, Formspree and cookie choices remain unchanged.
- The archive uses database-backed cards only when the API responds successfully; static HTML cards are retained for SEO and offline fallback.

Admin editing remains locked until Cloudflare Zero Trust Access Free is enabled and an owner-only policy is configured. No public write API, passwords, tokens or paid components are included. The next phase implements authenticated authoring and renders full article bodies from D1.
