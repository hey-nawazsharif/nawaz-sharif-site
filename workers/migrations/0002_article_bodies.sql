-- Migration 0002 — dynamic Markdown bodies and SEO fields.
-- Only apply missing columns: production already has these columns (2026-11-18).
ALTER TABLE articles ADD COLUMN body_md TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN content_type TEXT NOT NULL DEFAULT 'legacy' CHECK(content_type IN ('legacy','dynamic'));
ALTER TABLE articles ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN seo_description TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN cover_url TEXT NOT NULL DEFAULT '';
ALTER TABLE articles ADD COLUMN content_override INTEGER NOT NULL DEFAULT 0 CHECK(content_override IN (0,1));
CREATE TABLE IF NOT EXISTS article_revisions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 slug TEXT NOT NULL,
 snapshot TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_article_revisions_slug ON article_revisions(slug,created_at DESC,id DESC);
