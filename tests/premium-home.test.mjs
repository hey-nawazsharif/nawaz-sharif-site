import assert from 'node:assert/strict';
import fs from 'node:fs';
import {premiumHome} from '../workers/cms/premium-home.js';
const rows=[];
const articles=[
 {title:'Linux commands for beginners',summary:'Practical commands for troubleshooting.',category:'Linux',url:'/essential-linux-commands.html'},
 {title:'Malicious <script>alert(1)</script>',summary:'<img src=x onerror=alert(1)>',category:'Security',url:'/what-is-linux.html'},
 {title:'Bad link',summary:'Must not appear',category:'Other',url:'javascript:alert(1)'}
];
const rendered=premiumHome(rows,articles);
assert.ok(rendered.hero.includes('id="hero-title"'),'visible hero');
assert.ok(rendered.hero.includes('Practical technology.'),'premium original identity');
assert.ok(rendered.hero.includes('Linux / IT Operations'),'accurate focus');
assert.equal((rendered.services.match(/class="px-service"/g)||[]).length,4,'four service cards');
assert.ok(rendered.articles.includes('essential-linux-commands.html'),'article link');
assert.ok(!rendered.articles.includes('javascript:alert(1)'),'reject bad article links');
assert.ok(rendered.articles.includes('&lt;script&gt;'),'HTML-escape article titles');
assert.ok(!rendered.articles.includes('<img src=x'),'escape article excerpt');
assert.ok(rendered.about.includes('continuous learning')||rendered.about.includes('learning'),'learning framing');
assert.ok(!/6\+ years|UAE|Fortune 500|clients served/i.test(Object.values(rendered).join(' ')),'no fabricated experience or clients');
const modified=premiumHome([{block_key:'main_headline',published_override:1,published_text:'Safe <script>alert(1)</script>'}],[]);
assert.ok(modified.hero.includes('Safe &lt;script&gt;'),'CMS headline must be escaped');
assert.ok(!modified.hero.includes('<script>alert(1)</script>'),'never inject unescaped CMS markup');
const css=fs.readFileSync(new URL('../workers/cms/premium-home-css.txt',import.meta.url),'utf8');
assert.ok(css.includes('body.ns-premium'),'strict CSS isolation');
assert.ok(css.includes('prefers-reduced-motion'),'reduced motion');
assert.ok(css.includes('max-width:600px'),'mobile breakpoints');
console.log('PASS: premium homepage, safe CMS data, article links, accuracy and responsive CSS');
