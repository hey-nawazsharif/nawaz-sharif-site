#!/usr/bin/env python3
"""Validate the published HTML article and execute each embedded Python example."""
from html.parser import HTMLParser
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SLUG = "leetcode-dsa-practice-python-beginners"
article = (ROOT / f"{SLUG}.html").read_text(encoding="utf8")
home = (ROOT / "index.html").read_text(encoding="utf8")
archive = (ROOT / "articles.html").read_text(encoding="utf8")
sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf8")

class Snippets(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_code = False
        self.current = []
        self.codes = []

    def handle_starttag(self, tag, attrs):
        if tag == "code" and dict(attrs).get("class") == "language-python":
            self.in_code = True
            self.current = []

    def handle_data(self, data):
        if self.in_code:
            self.current.append(data)

    def handle_endtag(self, tag):
        if tag == "code" and self.in_code:
            self.codes.append("".join(self.current))
            self.in_code = False

parser = Snippets()
parser.feed(article)
assert len(parser.codes) == 3, "Expected three tested standalone Python examples"

functions = {}
for snippet in parser.codes:
    exec(compile(snippet, "<article-exercise>", "exec"), functions)

assert functions["find_pair"]([3, 8, 2, 7], 10) == [1, 2]
assert functions["find_pair"]([5, 5], 10) == [0, 1]
assert functions["find_pair"]([], 3) == []
assert functions["binary_search"]([1, 4, 7, 9, 12], 9) == 3
assert functions["binary_search"]([1, 4, 7, 9, 12], 3) == -1
assert functions["binary_search"]([], 3) == -1
assert functions["valid_brackets"]("([])") is True
assert functions["valid_brackets"]("([)]") is False
assert functions["valid_brackets"]("") is True
assert functions["valid_brackets"]("a") is False

assert f'<link rel="canonical" href="https://nawazsharif.in/{SLUG}">' in article
assert f"https://nawazsharif.in/{SLUG}</loc>" in sitemap
assert re.search(rf'<a[^>]+href="/{SLUG}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"', archive)
assert re.search(rf'<a[^>]+href="/{SLUG}"[^>]*target="_blank"[^>]*rel="noopener noreferrer"', home)
assert 'href="/articles"' in article
assert "article:published_time" in article
assert "application/ld+json" in article
assert "30-day" in article.lower()
assert "LeetCode" in article
assert "Unrelated test" not in article
print("PASS: DSA article has valid canonical SEO, archive links, and 3 executable Python examples.")
