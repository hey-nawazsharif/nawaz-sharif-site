-- Add an illustrated legacy GitHub Pages technical article to the public D1 archive.
-- Safe repeated execution: insert only, no changes to previous or private records.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'ai-data-center-ram-hbm-nvme-ssd-explained',
'AI Data Center Hardware Explained: DDR5 ECC RAM, HBM GPU Memory & NVMe SSDs | Nawaz Sharif',
'Visual guide to AI data center hardware: DDR5 ECC RAM, HBM3e GPU memory, enterprise NVMe SSDs, real NVIDIA DGX B200/B300 specs and memory sizing maths.',
'AI / Infrastructure / RAM / SSD',
'/ai-data-center-ram-hbm-nvme-ssd-explained.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'AI Data Center Hardware Explained: DDR5 ECC RAM, HBM GPU Memory & NVMe SSDs',
'Visual guide to AI data center hardware: DDR5 ECC RAM, HBM3e GPU memory, enterprise NVMe SSDs, real NVIDIA DGX B200/B300 specs and memory sizing maths.',
'',0,''
);
