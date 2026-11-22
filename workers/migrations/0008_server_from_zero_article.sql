-- Public read-only legacy article metadata for the independent server guide.
-- Safe to apply more than once; no modification of existing or private records.
INSERT OR IGNORE INTO articles
(slug,title,summary,category,url,is_published,published_at,body_md,content_type,seo_title,seo_description,cover_url,content_override,published_snapshot)
VALUES (
'what-is-server-types-hardware-installation-from-scratch',
'What Is a Server? Types, Hardware, Setup From Scratch and How AI Uses Servers | Nawaz Sharif',
'A complete beginner-to-enterprise server guide: tower, rack, cloud and AI servers, hardware parts, equipment checklist, safe assembly, Ubuntu setup, SSH, firewall, backups and real-world use cases.',
'IT Infrastructure / Servers / Linux',
'/what-is-server-types-hardware-installation-from-scratch.html',
1,
'2026-11-22 00:00:00',
'',
'legacy',
'What Is a Server? Types, Hardware, Setup From Scratch and How AI Uses Servers',
'A complete beginner-to-enterprise server guide: tower, rack, cloud and AI servers, hardware parts, equipment checklist, safe assembly, Ubuntu setup, SSH, firewall, backups and real-world use cases.',
'',0,''
);
