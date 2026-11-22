#!/usr/bin/env python3
"""Validate AI chips article, its static references, and CPU-only learning example."""
from html.parser import HTMLParser
from pathlib import Path
import re
import json

root = Path(__file__).resolve().parents[1]
slug = "how-ai-works-chips-gpu-tpu-training"
html = (root / f"{slug}.html").read_text(encoding="utf-8")
home = (root / "index.html").read_text(encoding="utf-8")
archive = (root / "articles.html").read_text(encoding="utf-8")
sitemap = (root / "sitemap.xml").read_text(encoding="utf-8")

class Extract(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_code = False
        self.code = []
        self.chunks = []
        self.schema = ""
        self.in_schema = False
    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if tag == "code" and attributes.get("class") == "language-python":
            self.in_code = True
            self.chunks = []
        if tag == "script" and attributes.get("type") == "application/ld+json":
            self.in_schema = True
    def handle_data(self, text):
        if self.in_code:
            self.chunks.append(text)
        if self.in_schema:
            self.schema += text
    def handle_endtag(self, tag):
        if tag == "code" and self.in_code:
            self.code.append("".join(self.chunks))
            self.in_code = False
        if tag == "script":
            self.in_schema = False

parser = Extract()
parser.feed(html)
assert len(parser.code) == 1, "Expected one independent Python learning example"
state = {}
exec(compile(parser.code[0], "<ai-chip-learning-example>", "exec"), state)
assert abs(state["weight"] - 2) < 0.01
assert abs(state["prediction_for_4"] - 8) < 0.01

data = json.loads(parser.schema)
assert data["@type"] == "BlogPosting"
assert data["mainEntityOfPage"] == "https://nawazsharif.in/" + slug
assert data["datePublished"] == "2026-11-22"
assert '<link rel="canonical" href="https://nawazsharif.in/' + slug + '">' in html
assert '<meta name="description"' in html
assert '<meta property="article:published_time" content="2026-11-22">' in html

for concept in ("CPU", "GPU", "TPU", "NPU", "Training", "Inference", "silicon", "photolithography"):
    assert concept.lower() in html.lower(), "Missing core technical concept: " + concept
for section in ("what-is-ai","chip","how-built","hardware","gpu","train-infer",
                "silicon","beyond","phone","build-own","myths","conclusion"):
    assert 'id="' + section + '"' in html, "Missing section: " + section
for source in ("www.ibm.com/think/topics/ai-hardware",
               "docs.cloud.google.com/tpu/docs/intro-to-tpu",
               "www.asml.com/en/technology/all-about-microchips/how-microchips-are-made"):
    assert source in html, "Missing authoritative source: " + source

assert 'aria-label="Five stages in a simplified AI model development cycle"' in html
assert f"https://nawazsharif.in/{slug}</loc>" in sitemap
for page, markup in ((home,"feature-story"),(archive,"card")):
    assert re.search(r'<a\b[^>]*href="/' + slug + r'"[^>]*target="_blank"[^>]*rel="noopener noreferrer"', page), \
        "Missing safe new-tab article link in " + markup
assert 'href="/what-is-ai-history-and-evolution"' in html
assert 'href="/ai-vs-machine-learning-vs-deep-learning-guide"' in html
assert '<a class="brand" href="/">' in html
assert 'src="/consent.js"' in html
print("PASS: AI-chip article SEO, sources, diagram, navigation, and executable CPU-only Python example.")
