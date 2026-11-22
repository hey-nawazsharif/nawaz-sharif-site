#!/usr/bin/env python3
"""Validate server installation guide, original diagrams, scope, maths and safety."""
from pathlib import Path
from html.parser import HTMLParser
from xml.etree import ElementTree as ET
import re, json, math

ROOT = Path(__file__).resolve().parents[1]
slug = "what-is-server-types-hardware-installation-from-scratch"
html = (ROOT / f"{slug}.html").read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")
archive = (ROOT / "articles.html").read_text(encoding="utf-8")
sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
migration = (ROOT / "workers/migrations/0008_server_from_zero_article.sql").read_text(encoding="utf-8")

class ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.images = []
        self.figures = self.captions = 0
        self.in_schema = False
        self.schema = ""
        self.headings = []
        self.in_h2 = False
        self.text = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "img": self.images.append(a)
        if tag == "figure": self.figures += 1
        if tag == "figcaption": self.captions += 1
        if tag == "script" and a.get("type") == "application/ld+json": self.in_schema = True
        if tag == "h2": self.in_h2 = True; self.text = []
    def handle_data(self, data):
        if self.in_schema: self.schema += data
        if self.in_h2: self.text.append(data)
    def handle_endtag(self, tag):
        if tag == "script": self.in_schema = False
        if tag == "h2" and self.in_h2:
            self.headings.append("".join(self.text))
            self.in_h2 = False

parser = ArticleParser()
parser.feed(html)
assert len(parser.images) == 3 and parser.figures == 3 and parser.captions == 3
assets = {
    "assets/server-hardware-anatomy.svg",
    "assets/server-types-and-use-cases.svg",
    "assets/server-zero-to-first-service.svg",
}
assert {x["src"].lstrip("/") for x in parser.images} == assets
for img in parser.images:
    assert len(img.get("alt", "")) > 65
    assert img.get("loading") == "lazy"
    assert img.get("decoding") == "async"
    assert img.get("width") == "1200"
    assert int(img.get("height", 0)) >= 560
for asset in assets:
    root = ET.parse(ROOT / asset).getroot()
    ns = {"svg": "http://www.w3.org/2000/svg"}
    assert root.tag == "{http://www.w3.org/2000/svg}svg"
    assert root.find("svg:title", ns) is not None
    assert root.find("svg:desc", ns) is not None
    assert root.get("viewBox")
    assert len((ROOT / asset).read_text(encoding="utf-8")) > 1800

data = json.loads(parser.schema)
assert data["@type"] == "BlogPosting"
assert data["mainEntityOfPage"] == "https://nawazsharif.in/" + slug
assert data["datePublished"] == "2026-11-22"
assert f'<link rel="canonical" href="https://nawazsharif.in/{slug}">' in html
assert 'src="/consent.js"' in html and 'href="/style.css"' in html
assert len(parser.headings) >= 15

for category in ("Home / homelab", "Real-estate office", "Mini office",
                 "Commercial / growing company", "MNC / global enterprise",
                 "Government / public sector"):
    assert category.lower() in html.lower(), f"Missing use case: {category}"
for topic in ("Mini PC", "Tower server", "Rack server", "Blade / modular",
              "GPU / accelerated", "Virtual machine", "Cloud server", "Edge / rugged",
              "ECC RAM", "NVMe", "BMC", "UPS", "RAID is not a backup",
              "OpenSSH", "Ubuntu Server", "NGINX", "Proxmox", "Windows Server"):
    assert topic.lower() in html.lower(), f"Missing topic: {topic}"
for cmd in ("sudo apt install nginx", "sudo systemctl enable --now nginx",
            "curl -I http://127.0.0.1", "sudo ufw default deny incoming",
            "sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp",
            "sudo ufw enable", "sudo ufw status numbered",
            "ip -br address", "lsblk -f", "ssh-keygen -t ed25519"):
    assert cmd in html, f"Missing safe installation command: {cmd}"
assert "erases selected partitions" in html
assert "do not open" in html.lower() and "power supply" in html.lower()
assert "remote-lockout warning" in html.lower()
assert "do not open the web or ssh ports" in html.lower()
assert "no universal" in html.lower()
assert "not every server runs ai" in html.lower()
assert "RAID 0" not in html or "RAID 1" in html

for source in ("ubuntu.com/tutorials/install-ubuntu-server",
               "ubuntu.com/server/docs/security-firewall/",
               "proxmox.com/en/products/proxmox-virtual-environment/get-started",
               "www.dell.com/support/kbdoc/en-in/000203859/",
               "www.cisa.gov/sites/default/files/2025-03/StopRansomware-Guide",
               "docs.nvidia.com/dgx/dgxb200-user-guide/"):
    assert source in html, f"Missing primary reference: {source}"
assert math.isclose(120/1000 * 24*30, 86.4)
assert "86.4 kWh" in html
assert "1 TB" in html and "RAID 1" in html
assert "8 GB" in html
for page in (home, archive):
    assert re.search(r'<a\b[^>]*href="/' + slug + r'"[^>]*target="_blank"[^>]*rel="noopener noreferrer"', page), "Missing safe new-tab link"
assert f"https://nawazsharif.in/{slug}</loc>" in sitemap
assert migration.count("INSERT OR IGNORE") == 1
assert slug in migration
print("PASS: 3 original accessible SVGs, 15+ sections, 6 business contexts, safe OS installation, mathematics, citations, SEO and public archive.")
