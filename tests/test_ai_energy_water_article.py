#!/usr/bin/env python3
"""Check AI chips electricity and water guide against source labels and maths."""
from pathlib import Path
from html.parser import HTMLParser
import json
import re

root = Path(__file__).resolve().parents[1]
slug = "ai-chips-electricity-water-consumption-guide"
article = (root / (slug + ".html")).read_text(encoding="utf-8")
home = (root / "index.html").read_text(encoding="utf-8")
archive = (root / "articles.html").read_text(encoding="utf-8")
sitemap = (root / "sitemap.xml").read_text(encoding="utf-8")
migration = (root / "workers/migrations/0006_ai_chips_energy_water.sql").read_text(encoding="utf-8")

class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.schema = ""
        self.ld = False
        self.headings = []
        self.h2 = False
        self.h2_content = []
    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        if tag == "script" and props.get("type") == "application/ld+json":
            self.ld = True
        if tag == "h2":
            self.h2 = True
            self.h2_content = []
    def handle_data(self, data):
        if self.ld:
            self.schema += data
        if self.h2:
            self.h2_content.append(data)
    def handle_endtag(self, tag):
        if tag == "script":
            self.ld = False
        if tag == "h2" and self.h2:
            self.headings.append("".join(self.h2_content))
            self.h2 = False

parser = ArticleParser()
parser.feed(article)
data = json.loads(parser.schema)
assert data["@type"] == "BlogPosting"
assert data["datePublished"] == "2026-11-22"
assert data["mainEntityOfPage"] == "https://nawazsharif.in/" + slug
assert '<link rel="canonical" href="https://nawazsharif.in/' + slug + '">' in article
assert 'src="/consent.js"' in article and 'href="/style.css"' in article
assert len(parser.headings) >= 11

# The global electricity figures cover *all* data centres, not only AI.
assert "485 TWh" in article and "950 TWh" in article
assert "2025" in article and "2030" in article
assert "not AI alone" in article and "projected" in article.lower()
assert "www.iea.org/reports/key-questions-on-energy-and-ai/executive-summary" in article

# Explicit water boundaries: LBNL US 2023 data for all data centres.
assert "66 billion litres" in article and "800 billion litres" in article
assert "2023" in article and "US data centres" in article
assert "direct" in article and "indirect" in article
assert "eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report" in article
assert "www.energy.gov/cmei/femp/cooling-water-efficiency-opportunities-federal-data-centers" in article

# Manufacturer source labels prevent misleading chip-level vs system-level mixing.
for name in ("NVIDIA H100", "NVIDIA H200", "NVIDIA B200", "NVIDIA B300",
             "MI300X", "MI355X", "Ironwood", "Trainium2", "Trainium3",
             "Inferentia2", "Gaudi 3", "NPUs"):
    assert name in article, "Chip missing: " + name
assert "up to 700 W" in article and "1,400 W" in article
assert "14.3 kW" in article and "whole eight-GPU DGX B200 system" in article
for url in ("www.nvidia.com/en-us/data-center/h200/",
            "www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html",
            "docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html",
            "aws.amazon.com/ec2/instance-types/trn3/"):
    assert url in article, "Missing technical source " + url

# Check independent numerical examples rather than trusting authored captions.
from math import isclose
assert isclose(0.7 * 24, 16.8, abs_tol=1e-9)
assert isclose(1.4 * 24, 33.6, abs_tol=1e-9)
assert round(8 * 0.7 * 24, 1) == 134.4
assert round(14.3 * 24, 1) == 343.2
assert 100 * 1.3 * 24 == 3120
assert 100 * 24 * 0.40 == 960
for expected in ("16.8 kWh", "33.6 kWh", "134.4 kWh", "343.2 kWh",
                 "3,120 kWh", "960 litres"):
    assert expected in article, "Incorrect or missing worked example: " + expected

for anchor in ("types", "models", "power", "pue", "global", "water", "water-data",
               "wue", "comparison", "choices", "conclusion", "faq"):
    assert 'id="' + anchor + '"' in article
assert 'how much water does one ai prompt use?' in article.lower()
for source,kind in ((home,"featured"),(archive,"archive")):
    assert re.search(r'<a\b[^>]*href="/' + slug + r'"[^>]*target="_blank"[^>]*rel="noopener noreferrer"', source), \
        "New tab link missing in " + kind
assert "https://nawazsharif.in/" + slug + "</loc>" in sitemap
assert migration.count("INSERT OR IGNORE") == 1 and "DROP " not in migration
assert "is_published" in migration and "content_type" in migration
print("PASS: AI electricity/water article source scopes, arithmetic, chip specifications, SEO, site links and D1 metadata.")
