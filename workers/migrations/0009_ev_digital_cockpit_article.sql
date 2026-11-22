-- Public archive metadata only. The article itself is GitHub Pages legacy HTML.
-- Idempotent insert; protects all existing articles and private CMS data.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'ev-car-touchscreen-digital-cockpit-ai-chips-software-explained',
'Inside an Electric Car: How Touchscreens, AI, Chips and Software Work | Nawaz Sharif',
'Explore EV digital cockpits: instrument clusters, Qualcomm chips, RAM, storage, Android Automotive vs Android Auto, BMS data, CAN bus, range maths, OTA cybersecurity and original diagrams.',
'Electric Vehicles / Automotive Software / AI',
'/ev-car-touchscreen-digital-cockpit-ai-chips-software-explained.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'Inside an Electric Car: How Touchscreens, AI, Chips and Software Work',
'Explore EV digital cockpits: instrument clusters, Qualcomm chips, RAM, storage, Android Automotive vs Android Auto, BMS data, CAN bus, range maths, OTA cybersecurity and original diagrams.',
'',0,''
);
