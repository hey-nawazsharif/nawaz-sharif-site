#!/usr/bin/env python3
"""QA for illustrated AI-data-center RAM/SSD article and source diagrams."""
import json
import math
import re
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
SLUG = "ai-data-center-ram-hbm-nvme-ssd-explained"
html = (ROOT / f"{SLUG}.html").read_text(encoding="utf8")
home = (ROOT / "index.html").read_text(encoding="utf8")
archive = (ROOT / "articles.html").read_text(encoding="utf8")
sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf8")
sql = (ROOT / "workers/migrations/0007_ai_datacenter_memory_ssd_article.sql").read_text(encoding="utf8")

class ArticleHTML(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []
        self.script = False
        self.schema = ""
        self.figures = 0
        self.captions = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "script" and a.get("type") == "application/ld+json":
            self.script = True
        if tag == "img":
            self.images.append(a)
        if tag == "figure":
            self.figures += 1
        if tag == "figcaption":
            self.captions += 1
    def handle_data(self, data):
        if self.script:
            self.schema += data
    def handle_endtag(self, tag):
        if tag == "script":
            self.script = False

p = ArticleHTML()
p.feed(html)
assert len(p.images) == 4 and p.figures == 4 and p.captions == 4, "Expected exactly four original visuals with captions"
expected = {
    "assets/ai-datacenter-request-path.svg",
    "assets/ai-memory-tiers-comparison.svg",
    "assets/ai-server-system-layout.svg",
    "assets/ai-model-memory-math.svg"
}
found = {x["src"].lstrip("/") for x in p.images}
assert found == expected
for img in p.images:
    assert img.get("alt") and len(img["alt"]) > 55
    assert img.get("loading") == "lazy"
    assert img.get("decoding") == "async"
    assert img.get("width") == "1200" and img.get("height")

for asset in expected:
    path = ROOT / asset
    assert path.exists(), asset
    svg = ET.parse(path).getroot()
    assert svg.tag == "{http://www.w3.org/2000/svg}svg"
    assert "viewBox" in svg.attrib
    ns = {"s": "http://www.w3.org/2000/svg"}
    assert svg.find("s:title", ns) is not None and svg.find("s:desc", ns) is not None
    assert len(path.read_text(encoding="utf8")) > 1500

ld = json.loads(p.schema)
assert ld["@type"] == "BlogPosting"
assert ld["datePublished"] == "2026-11-22"
assert ld["mainEntityOfPage"] == "https://nawazsharif.in/" + SLUG
assert f'<link rel="canonical" href="https://nawazsharif.in/{SLUG}">' in html
assert "src=\"/consent.js\"" in html
assert 'href="/style.css"' in html
for concept in ("DDR5", "ECC", "RDIMM", "HBM3e", "NVMe", "M.2", "U.2", "E1.S",
                "DGX B200", "DGX B300", "KV cache", "RAID 0", "RAID 1"):
    assert concept.lower() in html.lower(), f"Missing essential technology {concept}"

for source in ("docs.nvidia.com/dgx/dgxb200-user-guide/introduction-to-dgxb200.html",
               "docs.nvidia.com/dgx/dgxb300-user-guide/introduction-to-dgxb300.html",
               "www.micron.com/products/memory/data-center-memory",
               "semiconductor.samsung.com/ssd/enterprise-ssd/"):
    assert source in html, f"Missing manufacturer source {source}"

# Verify the full maths; never mistake aggregate HBM for a single GPU.
assert 8 * 180 == 1440
assert 8 * 288 == 2304
assert math.isclose(70e9 * 2 / 1e9, 140)
assert math.isclose(70e9 * 0.5 / 1e9, 35)
assert math.isclose(140e9 / (2 ** 30), 130.385162, rel_tol=1e-5)
assert math.isclose(35e9 / (2 ** 30), 32.596291, rel_tol=1e-5)
assert "140 GB" in html and "35 GB" in html
assert "130.4 GiB" in html and "32.6 GiB" in html
assert "1,440 GB" in html and "2,304 GB" in html
assert "30.72 TB" in html and "RAID 0" in html
assert "not a single pool" in html or "not automatically" in html

for body in (home, archive):
    assert re.search(r'<a\b[^>]*href="/' + SLUG + r'"[^>]*target="_blank"[^>]*rel="noopener noreferrer"', body), "Missing safe site navigation"

assert f"https://nawazsharif.in/{SLUG}</loc>" in sitemap
assert sql.count("INSERT OR IGNORE") == 1
assert re.search(r"\bUPDATE\b|\bDELETE\b|\bDROP\b", sql.replace("-- Safe repeated execution: insert only, no changes to previous or private records.", ""), re.I) is None
assert SLUG in sql

print("PASS: 4 readable original SVG figures, official citations, B200/B300 data, weight-memory maths, SEO and legacy archive migration.")
