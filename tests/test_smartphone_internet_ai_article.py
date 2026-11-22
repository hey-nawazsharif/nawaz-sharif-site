#!/usr/bin/env python3
"""Quality gate for smartphone chips, 4G/5G, and AI article with original SVGs."""
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
import math
import json
import re

ROOT = Path(__file__).resolve().parents[1]
SLUG = "how-smartphone-chips-5g-internet-ai-apps-work"
article = (ROOT / (SLUG + ".html")).read_text(encoding="utf8")
home = (ROOT / "index.html").read_text(encoding="utf8")
archive = (ROOT / "articles.html").read_text(encoding="utf8")
sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf8")
sql = (ROOT / "workers/migrations/0010_smartphone_chips_5g_ai_article.sql").read_text(encoding="utf8")

class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []
        self.figures = 0
        self.captions = 0
        self.in_schema = False
        self.ld = ""
        self.headings = []
        self.in_heading = False
        self.heading_text = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "img":
            self.images.append(a)
        if tag == "figure":
            self.figures += 1
        if tag == "figcaption":
            self.captions += 1
        if tag == "script" and a.get("type") == "application/ld+json":
            self.in_schema = True
        if tag == "h2":
            self.in_heading = True
            self.heading_text = []
    def handle_data(self, data):
        if self.in_schema:
            self.ld += data
        if self.in_heading:
            self.heading_text.append(data)
    def handle_endtag(self, tag):
        if tag == "script":
            self.in_schema = False
        if tag == "h2" and self.in_heading:
            self.headings.append("".join(self.heading_text))
            self.in_heading = False

p = ArticleParser()
p.feed(article)
assets = {
    "assets/smartphone-chip-hardware-anatomy.svg",
    "assets/smartphone-5g-internet-data-path.svg",
    "assets/smartphone-on-device-vs-cloud-ai.svg",
    "assets/smartphone-wifi-vs-cellular-network.svg",
}
assert len(p.images) == len(assets) == p.figures == p.captions == 4, "4 original illustrations required"
assert {im["src"].lstrip("/") for im in p.images} == assets
for im in p.images:
    assert len(im.get("alt", "")) >= 70
    assert im.get("loading") == "lazy" and im.get("decoding") == "async"
    assert im.get("width") == "1200"
    assert int(im.get("height", 0)) >= 500
for path in assets:
    image = ROOT / path
    assert image.exists(), path
    doc = ET.parse(image).getroot()
    assert doc.tag == "{http://www.w3.org/2000/svg}svg"
    assert "viewBox" in doc.attrib
    ns = {"svg": "http://www.w3.org/2000/svg"}
    assert doc.find("svg:title", ns) is not None
    assert doc.find("svg:desc", ns) is not None
    assert len(image.read_text(encoding="utf8")) > 2000

data = json.loads(p.ld)
assert data["@type"] == "BlogPosting"
assert data["mainEntityOfPage"] == "https://nawazsharif.in/" + SLUG
assert data["datePublished"] == "2026-11-22"
assert f'<link rel="canonical" href="https://nawazsharif.in/{SLUG}">' in article
assert 'href="/style.css"' in article and 'src="/consent.js"' in article
assert len(p.headings) >= 14

for item in ("CPU", "GPU", "NPU", "SIM", "eSIM", "UFS", "LPDDR", "SoC", "modem",
             "4G", "5G", "Wi-Fi", "DNS", "HTTPS", "5G Non-Standalone",
             "Standalone", "LiteRT", "NNAPI", "Apple Intelligence",
             "Private Cloud Compute", "cloud inference", "on-device",
             "100 Mbps", "25 MB", "12.5 MB", "2 seconds",
             "3 billion parameters", "1.5 GB", "offline"):
    assert item.lower() in article.lower(), "Missing concept: " + item
for url in (
    "www.qualcomm.com/snapdragon/what-is-snapdragon",
    "source.android.com/docs/core/connect/esim-overview",
    "www.gsma.com/solutions-and-impact/technologies/networks/5g-network-technologies-and-solutions/5g-standalone-networks/",
    "www.gsma.com/solutions-and-impact/technologies/networks/gsma_resources/5g-implementation-guidelines-nsa-option-3/",
    "www.cloudflare.com/learning/dns/what-is-dns/",
    "www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/",
    "developer.android.com/ai/overview",
    "developer.android.com/ndk/guides/neuralnetworks/migration-guide",
    "security.apple.com/documentation/private-cloud-compute/",
):
    assert url in article, "Missing first-party technical source: " + url

# Independent arithmetic checks against the authored guide.
assert math.isclose(100 / 8, 12.5)
assert math.isclose(25 / (100 / 8), 2)
assert math.isclose(3e9 * 1 / 1e9, 3)
assert math.isclose(3e9 * 0.5 / 1e9, 1.5)
assert "lower-bound arithmetic illustration" in article.lower()
assert "protocol overhead" in article.lower()
assert "not a download guarantee" in article.lower()
assert "SIM is not the modem" in article
assert "not necessarily" in article.lower()
assert "not a universal guarantee" in article.lower()

for content in (home, archive):
    assert re.search(
        r'<a\b[^>]*href="/' + SLUG + r'"[^>]*target="_blank"[^>]*rel="noopener noreferrer"',
        content
    ), "Missing safe new-tab website link"
assert f"https://nawazsharif.in/{SLUG}</loc>" in sitemap
assert sql.count("INSERT OR IGNORE INTO articles") == 1
assert SLUG in sql
assert "DELETE FROM articles" not in sql and "UPDATE articles" not in sql

print("PASS: Smartphone article 4 accessible SVGs, primary sources, maths, privacy caveats, SEO, archive and safe metadata.")
