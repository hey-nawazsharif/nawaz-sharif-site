-- CMS publication versions, safe to apply more than once.
-- Apply before deploying the matching Admin Worker code.
CREATE TABLE IF NOT EXISTS site_page_versions(
 page_path TEXT PRIMARY KEY,
 version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO site_page_versions(page_path,version)
 VALUES('/index.html',0),('/about.html',0),('/faq.html',0),('/contact.html',0),('/articles.html',0),('/privacy-policy.html',0),('/terms.html',0),('settings',0);
