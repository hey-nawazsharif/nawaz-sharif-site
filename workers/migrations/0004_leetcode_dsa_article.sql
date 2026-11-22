-- New independently authored legacy HTML article; serves from GitHub Pages.
-- This metadata makes it visible in the existing public dynamic archive.
-- Safe to run multiple times; it does not modify any existing articles.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'leetcode-dsa-practice-python-beginners',
'LeetCode & DSA Practice in Python: 30-Day Beginner Roadmap | Nawaz Sharif',
'Learn DSA in Python with hash maps, binary search, stacks, tested code examples, Big O, and a practical 30-day LeetCode practice plan.',
'Python / DSA / LeetCode',
'/leetcode-dsa-practice-python-beginners.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'LeetCode & DSA Practice in Python: 30-Day Beginner Roadmap',
'Learn DSA in Python with hash maps, binary search, stacks, tested code examples, Big O, and a practical 30-day LeetCode practice plan.',
'',0,''
);
