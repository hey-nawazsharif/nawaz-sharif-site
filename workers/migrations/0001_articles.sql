-- Article metadata database, separate from visitor access logs.
CREATE TABLE IF NOT EXISTS articles (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 slug TEXT NOT NULL UNIQUE,
 title TEXT NOT NULL,
 summary TEXT NOT NULL DEFAULT '',
 category TEXT NOT NULL DEFAULT 'Technology',
 url TEXT NOT NULL,
 is_published INTEGER NOT NULL DEFAULT 0 CHECK(is_published IN (0,1)),
 published_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published,published_at DESC,id DESC);
