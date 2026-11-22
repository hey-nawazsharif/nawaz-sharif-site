-- Idempotent public article registration for the GitHub Pages smartphone technical guide.
-- INSERT OR IGNORE only; preserves existing articles and draft/admin content.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'how-smartphone-chips-5g-internet-ai-apps-work',
'Inside a Smartphone: How Chips, 4G/5G Internet and AI Apps Really Work | Nawaz Sharif',
'Practical illustrated guide to smartphone CPU/GPU/NPU, modem, SIM/eSIM, RAM, 4G/5G, Wi-Fi, DNS, HTTPS, cloud vs on-device AI and speed and memory calculations.',
'Smartphones / Networking / AI',
'/how-smartphone-chips-5g-internet-ai-apps-work.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'Inside a Smartphone: How Chips, 4G/5G Internet and AI Apps Really Work',
'Practical illustrated guide to smartphone CPU/GPU/NPU, modem, SIM/eSIM, RAM, 4G/5G, Wi-Fi, DNS, HTTPS, cloud vs on-device AI and speed and memory calculations.',
'',0,''
);
