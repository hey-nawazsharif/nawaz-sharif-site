/* Original editorial homepage for the CMS preview. No copied external assets or company claims. */
function escapeHTML(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
const MAIN='https://nawazsharif.in';
const defaults={
 main_headline:'Linux. Systems. Practical technology.',
 hero_intro:'Independent technical notes and hands-on perspectives covering Linux, everyday IT operations, troubleshooting, and the evolving world of cybersecurity.',
 home_services_title:'Technology, made understandable.',
 home_articles_title:'Explore the technical archive.',
 home_about_title:'Curiosity backed by practical work.',
 focus_1_title:'Linux & Systems',focus_1_body:'Installation, terminal fundamentals, system configuration, and structured troubleshooting.',
 focus_2_title:'IT Support',focus_2_body:'Practical approaches to support tickets, device setup, diagnostics, and user-facing operations.',
 focus_3_title:'Networking',focus_3_body:'Core networking concepts, connectivity checks, and everyday infrastructure troubleshooting.',
 focus_4_title:'Python & Automation',focus_4_body:'Beginner-friendly scripting, repetitive-task automation, and learning through small projects.'
};
function item(rows,key){
 const row=rows.find(x=>x.block_key===key&&x.published_override===1);
 return row&&typeof row.published_text==='string'&&row.published_text.trim()?row.published_text.trim():defaults[key]||'';
}
function safeArticleURL(input){
 const s=String(input||'');
 if(/^\/[a-zA-Z0-9/_-]+\.html$/.test(s))return s;
 if(/^https:\/\/blog\.nawazsharif\.in\/[a-z0-9-]{3,100}$/.test(s))return s;
 return '';
}
function cards(articles){
 const seen=new Set(),found=[];
 for(const row of articles||[]){
  const href=safeArticleURL(row.url);
  if(!href||seen.has(href)||!row.title)continue;
  seen.add(href);found.push({href,title:String(row.title).slice(0,115),summary:String(row.summary||'').slice(0,170),category:String(row.category||'Technical Guide').slice(0,50)});
  if(found.length===6)break;
 }
 if(!found.length){
  found.push(
   {href:'/what-is-linux.html',title:'What is Linux?',summary:'Understanding the operating system and the tools that power modern infrastructure.',category:'Linux'},
   {href:'/essential-linux-commands.html',title:'Essential Linux commands',summary:'A practical command-line reference for everyday system tasks.',category:'Linux'},
   {href:'/python-automation-it-support-projects.html',title:'Python automation for IT support',summary:'Explore beginner-friendly automation ideas for everyday IT workflows.',category:'Python'}
  );
 }
 return found.map((a)=>'<a class="px-article" href="'+escapeHTML(a.href)+'"><span class="px-cat">'+escapeHTML(a.category)+'</span><h3>'+escapeHTML(a.title)+'</h3><p>'+escapeHTML(a.summary)+'</p><span class="px-article-arrow" aria-hidden="true">↗</span></a>').join('');
}
export function premiumHome(rows,articles){
 const title=item(rows,'main_headline');const custom=rows.some(x=>x.block_key==='main_headline'&&x.published_override===1);
 const hero='<section class="px-hero" id="home" aria-labelledby="hero-title"><div class="px-container">'+
 '<div class="px-hero-copy">'+
 '<p class="px-kicker">Linux / IT Operations / Technical Insights</p>'+
 '<h1 id="hero-title">'+(custom?escapeHTML(title):'Linux. Systems.<br><em>Practical technology.</em>')+'</h1>'+
 '<p class="hero-intro">'+escapeHTML(item(rows,'hero_intro'))+'</p>'+
 '<div class="px-actions"><a class="px-btn" href="/articles.html">Explore technical articles <span aria-hidden="true">↗</span></a>'+
 '<a class="px-btn px-btn-ghost" href="/about.html">About this site <span aria-hidden="true">↗</span></a></div>'+
 '<div class="px-hero-foot"><span>Independent technical publishing</span><span>Hands-on learning</span><span>Clear explanations</span></div></div>'+
 '<div class="px-visual" aria-label="Illustration of Linux learning and diagnostic commands">'+
 '<div class="px-terminal"><div class="px-term-title"><span class="px-dots" aria-hidden="true"><i></i><i></i><i></i></span><span>terminal / example commands</span><span aria-hidden="true">↗</span></div>'+
 '<div class="px-term-body"><div class="px-term-comment"># Linux &amp; IT study notes</div>'+
 '<div><span class="px-term-prompt">learner@linux</span> <span class="px-term-cmd">~ $ pwd</span></div><div class="px-term-output">/home/learner</div>'+
 '<div><span class="px-term-prompt">learner@linux</span> <span class="px-term-cmd">~ $ ls -la</span></div><div class="px-term-output"># explore files and permissions</div>'+
 '<div><span class="px-term-prompt">learner@linux</span> <span class="px-term-cmd">~ $ ip addr</span></div><div class="px-term-output"># inspect network interfaces</div>'+
 '<div><span class="px-term-prompt">learner@linux</span> <span class="px-term-cmd">~ $ _</span></div>'+
 '</div></div><span class="px-term-label">Systems · Support · Learning</span></div>'+
 '</div></section>'+
 '<div class="px-intro-strip" aria-label="Technical focus"><div class="px-container"><div><strong>Built around practical technology knowledge.</strong><p>Independent publishing, useful references, and ideas worth exploring.</p></div>'+
 '<div class="px-intro-tags"><span>Linux</span><span>IT Support</span><span>Networking</span><span>Automation</span></div></div></div>';
 const serviceList=[
  ['01','⌘',1],['02','↗',2],['03','◎',3],['04','{ }',4]
 ];
 const serviceCards=serviceList.map(([num,symbol,n])=>'<article class="px-service"><span class="px-icon" aria-hidden="true">'+escapeHTML(symbol)+'</span><span class="px-index">'+num+' / 04</span>'+
 '<h3>'+escapeHTML(item(rows,'focus_'+n+'_title'))+'</h3><p>'+escapeHTML(item(rows,'focus_'+n+'_body'))+'</p><span class="px-line" aria-hidden="true"></span></article>').join('');
 const services='<section class="px-block px-services" id="services" aria-labelledby="px-services-title"><div class="px-container">'+
 '<p class="px-kicker">01 / Technical focus</p>'+
 '<div class="px-block-head"><h2 id="px-services-title">'+escapeHTML(item(rows,'home_services_title'))+'</h2>'+
 '<p>From operating systems to practical automation, these are the subjects explored through articles, examples, and ongoing learning.</p></div>'+
 '<div class="px-service-grid">'+serviceCards+'</div>'+
 '<div class="px-specialties" aria-label="Additional topics"><span>System troubleshooting</span><span>IT operations</span><span>Cybersecurity learning</span><span>Technical documentation</span></div>'+
 '</div></section>';
 const articleHTML='<section class="px-block px-articles" id="articles" aria-labelledby="px-articles-title"><div class="px-container">'+
 '<div class="px-articles-head"><div class="px-intro"><p class="px-kicker">02 / Writing &amp; resources</p><h2 id="px-articles-title">'+escapeHTML(item(rows,'home_articles_title'))+'</h2>'+
 '<p>Independent guides and learning notes on Linux, technical operations, Python, and the tools people use to understand modern systems.</p></div>'+
 '<a class="px-link" href="/articles.html">Browse all articles <span aria-hidden="true">↗</span></a></div>'+
 '<div class="px-article-grid">'+cards(articles)+'</div></div></section>';
 const about='<section class="px-block px-about" id="about" aria-labelledby="px-about-title"><div class="px-container">'+
 '<div><p class="px-kicker">03 / About this space</p><h2 id="px-about-title">'+escapeHTML(item(rows,'home_about_title'))+'</h2>'+
 '<p>This site brings together practical IT knowledge, Linux learning, technical writing, and thoughtful exploration of emerging technology.</p>'+
 '<p>The focus is straightforward: explain clearly, document carefully, and keep improving through real practice.</p>'+
 '<a class="px-link" href="/about.html">Read the full profile <span aria-hidden="true">↗</span></a></div>'+
 '<div class="px-about-details"><div><strong>Linux &amp; IT fundamentals</strong><span>Commands, installation, configuration, and everyday troubleshooting.</span></div>'+
 '<div><strong>Technical guides</strong><span>Self-contained articles designed to be useful, readable, and accessible.</span></div>'+
 '<div><strong>Security as continuous learning</strong><span>Exploring defensive concepts and responsible system practices.</span></div></div>'+
 '</div></section>';
 const collaborations='<section class="px-collab" id="partnerships" aria-labelledby="partnerships-title"><div class="px-container">'+
 '<div><p class="px-kicker">04 / Connect</p><h2 id="partnerships-title">A conversation starts with a clear idea.</h2>'+
 '<p>Have a question about a technical guide, a practical IT topic, or a potential collaboration? Send a short message and context.</p></div>'+
 '<a class="px-btn px-btn-light" href="/contact.html">Get in touch <span aria-hidden="true">↗</span></a></div></section>';
 return {hero,services,articles:articleHTML,about,collaborations};
}
export const premiumHomeDefaultFields=defaults;
