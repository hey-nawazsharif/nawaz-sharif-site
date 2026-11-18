import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const root = process.cwd();
const pages = readdirSync(root).filter(name => name.endsWith('.html'));
assert.ok(pages.length >= 30, 'Unexpectedly incomplete website checkout');

let changedLinks = 0;
const cleanScript = readFileSync('consent.js','utf8');
assert.ok(cleanScript.includes('window.history.replaceState(window.history.state'), 'Old .html bookmarks must display clean URLs');
for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const hrefs = [...html.matchAll(/\bhref=(["'])(.*?)\1/gi)].map(x => x[2]);
  for (const href of hrefs) {
    if (/^(?:\/(?!\/)|https:\/\/(?:www\.)?nawazsharif\.in\/|[a-zA-Z0-9_-]+\.html(?:[?#]|$))/.test(href)) {
      assert.ok(!/\.html(?:[?#]|$)/i.test(href), page + ' contains a first-party .html navigation URL: ' + href);
      changedLinks++;
    }
  }
  const canonical = html.match(/<link\b[^>]*\brel="canonical"[^>]*\bhref="([^"]+)"/i)?.[1];
  if (canonical) {
    assert.ok(!/\.html(?:[?#]|$)/.test(canonical), page + ' has an old canonical URL');
  }
  // Check only first-party public page references; external documentation is untouched.
  const firstPartyUrls = [...html.matchAll(/https:\/\/nawazsharif\.in\/[a-zA-Z0-9_./-]+\.html/g)];
  assert.equal(firstPartyUrls.length, 0, page + ' contains an old first-party absolute URL');
}

const sitemap = readFileSync('sitemap.xml', 'utf8');
assert.ok(sitemap.includes('https://nawazsharif.in/articles</loc>'));
assert.doesNotMatch(sitemap, /https:\/\/nawazsharif\.in\/[a-zA-Z0-9_./-]+\.html/);

const home = readFileSync('index.html', 'utf8');
const archive = readFileSync('articles.html', 'utf8');
assert.ok(home.includes('href="/articles"'));
assert.ok(archive.includes('href="/what-is-ai-history-and-evolution"'));
assert.ok(archive.includes('target="_blank" rel="noopener noreferrer"'));

const dynamic = readFileSync('articles-dynamic.js', 'utf8');
assert.ok(dynamic.includes("article.url.startsWith('/')?article.url.replace(/\\.html$/i,''):article.url"));
assert.ok(dynamic.includes("link.target='_blank'"));

const worker = readFileSync('workers/cms/worker.js', 'utf8');
assert.ok(worker.includes("const requested=url.pathname==='/'?'/index.html':url.pathname"));
assert.ok(worker.includes("requested+'.html':requested"));

console.log('PASS: ' + pages.length + ' HTML pages, ' + changedLinks + ' first-party links, canonical SEO, sitemap and preview clean-route support.');
