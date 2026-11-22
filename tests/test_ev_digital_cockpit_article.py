#!/usr/bin/env python3
"""Validate EV digital cockpit article, SVG assets, links, sources and battery maths."""
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
import json, re, math

ROOT = Path(__file__).resolve().parents[1]
slug = "ev-car-touchscreen-digital-cockpit-ai-chips-software-explained"
article = (ROOT / (slug + ".html")).read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")
archive = (ROOT / "articles.html").read_text(encoding="utf-8")
sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
sql = (ROOT / "workers/migrations/0009_ev_digital_cockpit_article.sql").read_text(encoding="utf-8")

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []
        self.figures = self.captions = 0
        self.script = False
        self.ld = ""
        self.headings = []
        self.heading = False
        self.words = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "img": self.images.append(a)
        if tag == "figure": self.figures += 1
        if tag == "figcaption": self.captions += 1
        if tag == "script" and a.get("type") == "application/ld+json": self.script = True
        if tag == "h2": self.heading = True; self.words = []
    def handle_data(self, data):
        if self.script: self.ld += data
        if self.heading: self.words.append(data)
    def handle_endtag(self, tag):
        if tag == "script": self.script = False
        if tag == "h2" and self.heading:
            self.headings.append("".join(self.words))
            self.heading = False

page = Page()
page.feed(article)
assets = {
 "assets/ev-digital-cockpit-layout.svg",
 "assets/ev-cockpit-software-data-flow.svg",
 "assets/ev-battery-range-calculation.svg",
 "assets/ev-ota-cybersecurity-boundaries.svg"
}
assert len(page.images) == len(assets) == page.figures == page.captions == 4
assert {x["src"].lstrip("/") for x in page.images} == assets
for im in page.images:
    assert im.get("alt") and len(im["alt"]) >= 75, "Accessible alt text required"
    assert im.get("loading") == "lazy"
    assert im.get("decoding") == "async"
    assert im.get("width") == "1200" and int(im.get("height", 0)) >= 500
for asset in assets:
    tree = ET.parse(ROOT / asset)
    el = tree.getroot()
    ns = {"s":"http://www.w3.org/2000/svg"}
    assert el.tag == "{http://www.w3.org/2000/svg}svg"
    assert el.find("s:title", ns) is not None
    assert el.find("s:desc", ns) is not None
    assert el.attrib.get("viewBox")
    assert len((ROOT / asset).read_text(encoding="utf8")) >= 1800

data = json.loads(page.ld)
assert data["@type"] == "BlogPosting"
assert data["mainEntityOfPage"] == "https://nawazsharif.in/" + slug
assert data["datePublished"] == "2026-11-22"
assert f'<link rel="canonical" href="https://nawazsharif.in/{slug}">' in article
assert 'src="/consent.js"' in article
assert 'href="/style.css"' in article
assert len(page.headings) >= 12

for term in ("instrument cluster", "infotainment", "touch controller", "GPU", "NPU",
             "LPDDR", "VHAL", "BMS", "CAN bus", "Android Automotive OS",
             "Android Auto", "Apple CarPlay", "QNX", "OTA", "cybersecurity",
             "Mahindra", "XEV 9e", "BE 6", "Snapdragon 8295", "24 GB RAM",
             "128 GB storage", "regenerative braking", "driver distraction"):
    assert term.lower() in article.lower(), "Missing subject: " + term
for fragment in ("developers.google.com/cars",
                  "source.android.com/docs/automotive/vhal",
                  "qnx.software/en/software/products-and-solutions/qnx-cabin",
                  "www.qualcomm.com/news/releases/2025/01/",
                  "www.mahindra.com/news-room/press-release/en/Mahindra-Democratises",
                  "www.nhtsa.gov/research/vehicle-cybersecurity",
                  "www.vehicle-certification-agency.gov.uk/connected-and-automated-vehicles/"):
    assert fragment in article, "Missing verified primary reference: " + fragment

# Verify example units and warn users it is a hypothetical prediction.
assert math.isclose(60 * 0.75, 45)
assert math.isclose(45 / 15 * 100, 300)
assert "60 kWh" in article and "15 kWh" in article and "300 km" in article
assert "kW</strong>" in article and "kWh</strong>" in article
assert "hypothetical" in article.lower()
assert "not a certified range claim" in article.lower()
assert "Do not assume" in article
assert "do not" in article.lower() and "safety" in article.lower()

for content in (home, archive):
    assert re.search(r'<a[^>]+href="/' + slug + r'"[^>]+target="_blank"[^>]+rel="noopener noreferrer"', content), "Missing new-tab link"
assert f"https://nawazsharif.in/{slug}</loc>" in sitemap
assert sql.count("INSERT OR IGNORE INTO articles") == 1
assert slug in sql
assert "UPDATE articles" not in sql and "DELETE FROM" not in sql
print("PASS: 4 original SVGs, source references, EV vehicle architecture, range maths, safe links, SEO and CMS migration")
