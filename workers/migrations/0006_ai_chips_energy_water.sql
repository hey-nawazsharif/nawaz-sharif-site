-- Adds the new GitHub Pages AI chip energy and water guide to the public archive.
-- Idempotent insert only; cannot update existing articles or private data.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'ai-chips-electricity-water-consumption-guide',
'Which Chips Power AI? GPU, TPU, Electricity and Water Usage Explained (2026) | Nawaz Sharif',
'Compare NVIDIA, AMD, Google TPU, AWS Trainium, Intel AI accelerators and NPUs. See verified chip power ratings, energy calculations, global electricity demand and US data-centre water evidence.',
'AI / Chips / Energy / Water',
'/ai-chips-electricity-water-consumption-guide.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'Which Chips Power AI? GPU, TPU, Electricity and Water Usage Explained (2026)',
'Compare NVIDIA, AMD, Google TPU, AWS Trainium, Intel AI accelerators and NPUs. See verified chip power ratings, energy calculations, global electricity demand and US data-centre water evidence.',
'',0,''
);
