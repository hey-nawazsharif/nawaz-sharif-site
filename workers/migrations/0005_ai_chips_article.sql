-- Read-only public article metadata for GitHub Pages; safe to reapply.
-- Adds one new legacy article; no edits to existing articles or admin data.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'how-ai-works-chips-gpu-tpu-training',
'Is AI Made from Chips? How CPUs, GPUs and TPUs Power Artificial Intelligence | Nawaz Sharif',
'Understand how silicon chips power artificial intelligence: CPUs, GPUs, TPUs, NPUs, model training vs inference, chip manufacturing, and a CPU-only Python learning example.',
'AI / Hardware / Semiconductors',
'/how-ai-works-chips-gpu-tpu-training.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'Is AI Made from Chips? How CPUs, GPUs and TPUs Power Artificial Intelligence',
'Understand how silicon chips power artificial intelligence: CPUs, GPUs, TPUs, NPUs, model training vs inference, chip manufacturing, and a CPU-only Python learning example.',
'',0,''
);
