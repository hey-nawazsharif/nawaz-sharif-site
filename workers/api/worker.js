/* Public read-only API + server-rendered dynamic articles. No draft or private log access. */
import { renderMarkdown, escapeHTML, safeURL } from './markdown.js';
const MAIN='https://nawazsharif.in';
const BLOG='https://blog.nawazsharif.in';
const allowed=new Set([MAIN,'https://www.nawazsharif.in']);
const select='slug,title,summary,category,url,published_at,updated_at,content_type,seo_title,seo_description,cover_url';
const allFields=select+',published_snapshot';
function publicRow(row) {
 if(!row)return null;
 let published={};
 try {published=row.published_snapshot?JSON.parse(row.published_snapshot):{};}catch(e){published={};}
 if(row.content_type==='dynamic'&&!published.body_md)return null;
 const allowed=['slug','title','summary','category','url','published_at','updated_at','content_type','seo_title','seo_description','cover_url'];
 const result={};
 allowed.forEach(key=>{result[key]=(key in published&&typeof published[key]==='string')?published[key]:row[key]});
 return result;
}
function json(value,status=200,origin='',cache=0){
 const headers=new Headers({'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':cache?'public, max-age='+cache:'no-store','Vary':'Origin'});
 if(allowed.has(origin)){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','GET, OPTIONS');headers.set('Access-Control-Allow-Headers','Accept');}
 return new Response(JSON.stringify(value),{status,headers});
}
function textResponse(value,mime='text/html; charset=utf-8',status=200){
 return new Response(value,{status,headers:{'Content-Type':mime,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Cache-Control':status===200?'public, max-age=60':'no-store','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; style-src 'self' 'unsafe-inline' https://nawazsharif.in; img-src https: data:; font-src https:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'; connect-src 'none'"}});
}
function iso(str){return /^\d{4}-\d{2}-\d{2}/.test(str||'')?str.slice(0,10):'2026-11-18';}
function blogPage(row){
 const t=escapeHTML(row.seo_title||row.title),name=escapeHTML(row.title);
 const d=escapeHTML(row.seo_description||row.summary||'Independent technology articles and practical guides.');
 const url=BLOG+'/'+encodeURIComponent(row.slug);
 const cover=safeURL(row.cover_url||'',true);
 const coverHtml=cover?'<figure class="story-cover"><img alt="" loading="eager" src="'+escapeHTML(cover)+'"></figure>':'';
 const jsonLD=JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting',headline:row.title,description:row.seo_description||row.summary||'',url,datePublished:iso(row.published_at),dateModified:iso(row.updated_at),author:{'@type':'Person',name:'Nawaz Sharif',url:MAIN+'/about.html'}}).replace(/</g,'\\u003c');
 const style='body{margin:0;background:#fafbf9;color:#1b3229;font:16px/1.8 system-ui,-apple-system,sans-serif}a{color:#176949;text-underline-offset:3px}.blog-header{background:#12241e;color:#f5fcf7}.blog-header .wrap,.blog-footer .wrap{max-width:1050px;margin:auto;padding:18px 23px;display:flex;align-items:center;justify-content:space-between;gap:18px}.blog-header a{color:#f6fcf7;text-decoration:none}.blog-header strong{font-size:15px;letter-spacing:.08em}.blog-header nav{display:flex;gap:18px;font-size:13px}.blog-main{max-width:790px;padding:45px 20px 76px;margin:auto}.blog-eyebrow{font-size:12px;font-weight:700;letter-spacing:.08em;color:#54796a;text-transform:uppercase}.blog-main h1{font-size:clamp(29px,4.7vw,49px);letter-spacing:-.04em;line-height:1.17;margin:15px 0}.blog-meta{font-size:13px;color:#65796e}.blog-lead{font-size:18px;line-height:1.7;color:#4a6456}.story-cover{margin:25px 0}.story-cover img,.article-content img{display:block;width:auto;max-width:100%;height:auto;border-radius:3px}.article-content{margin:33px 0 50px}.article-content h2{font-size:clamp(23px,3vw,31px);margin:35px 0 11px;line-height:1.25}.article-content h3{font-size:21px;margin:27px 0 11px}.article-content h4{font-size:18px;margin:22px 0 11px}.article-content p{margin:13px 0}.article-content pre{overflow-x:auto;background:#0e1e1a;color:#e0f1e7;padding:17px;border-radius:4px;font:13px/1.65 ui-monospace,monospace}.article-content :not(pre)>code{font-size:.88em;color:#1d6344;background:#e6efea;padding:2px 5px}.article-content blockquote{margin:24px 0;border-left:3px solid #3b8464;padding:3px 18px;color:#49685b;background:#f0f5f1}.article-content li{padding-left:4px;margin:7px 0}.article-content hr{border:0;border-top:1px solid #ced9d2;margin:33px 0}.blog-footer{border-top:1px solid #dce5df;color:#60766a;font-size:12px}.blog-footer a{color:#456d59}@media(max-width:550px){.blog-header .wrap{flex-direction:column;align-items:flex-start;gap:8px}.blog-main{padding-top:29px}.blog-lead{font-size:16px}}';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+t+' | Nawaz Sharif</title><meta name="description" content="'+d+'"><meta name="author" content="Nawaz Sharif">'+
 '<link rel="canonical" href="'+url+'"><meta property="og:type" content="article"><meta property="og:title" content="'+t+'">'+
 '<meta property="og:description" content="'+d+'"><meta property="og:url" content="'+url+'">'+
 (cover?'<meta property="og:image" content="'+escapeHTML(cover)+'">':'')+
 '<meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">'+jsonLD+'</script>'+
 '<style>'+style+'</style></head><body>'+
 '<header class="blog-header"><div class="wrap"><a href="'+MAIN+'/"><strong>NAWAZ SHARIF.</strong></a><nav aria-label="Main navigation"><a href="'+MAIN+'/about.html">About</a><a href="'+MAIN+'/articles.html">Articles</a><a href="'+MAIN+'/contact.html">Contact</a></nav></div></header>'+
 '<main class="blog-main" id="main"><p class="blog-eyebrow">'+escapeHTML(row.category||'Technology')+' / Technical articles</p>'+
 '<h1>'+name+'</h1><p class="blog-meta">By Nawaz Sharif · '+iso(row.published_at)+'</p>'+
 (row.summary?'<p class="blog-lead">'+escapeHTML(row.summary)+'</p>':'')+
 coverHtml+'<div class="article-content">'+renderMarkdown(row.body_md)+'</div>'+
 '<p><a href="'+MAIN+'/articles.html">← All technical articles</a></p></main>'+
 '<footer class="blog-footer"><div class="wrap"><span>© 2026 Nawaz Sharif. All rights reserved.</span>'+
 '<span><a href="'+MAIN+'/privacy-policy.html">Privacy</a> · <a href="'+MAIN+'/contact.html">Contact</a></span></div></footer></body></html>';
}
async function published(env,slug){
 const row=await env.DB.prepare('SELECT '+allFields+' FROM articles WHERE slug=? AND content_type=? AND is_published=1 AND LENGTH(published_snapshot)>160').bind(slug,'dynamic').first();
 if(!row)return null;
 try {
  const snapshot=JSON.parse(row.published_snapshot);
  if(typeof snapshot.body_md!=='string'||snapshot.body_md.length<160)return null;
  return {...row,...snapshot};
 } catch(e){return null;}
}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin')||'',u=new URL(request.url),path=u.pathname;
  if(request.method==='OPTIONS')return allowed.has(origin)?new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Accept','Access-Control-Max-Age':'86400','Vary':'Origin'}}):json({error:'Forbidden'},403,origin);
  if(request.method!=='GET')return json({error:'Method not allowed'},405,origin);
  try{
   if(path==='/health'){
    const count=await env.DB.prepare("SELECT COUNT(*) total FROM articles WHERE is_published=1").first();
    return json({status:'ok',service:'nawaz-site-api',publishedArticles:count?.total||0},200,origin);
   }
   if(path==='/api/v1/articles'){
    const q=(u.searchParams.get('q')||'').trim().slice(0,70).toLowerCase();
    const limit=Math.max(1,Math.min(parseInt(u.searchParams.get('limit')||'50',10)||50,50));
    const rows=await env.DB.prepare('SELECT '+allFields+" FROM articles WHERE is_published=1 AND (content_type='legacy' OR LENGTH(published_snapshot)>160) ORDER BY id DESC LIMIT 500").all();
    const items=(rows.results||[]).map(publicRow).filter(Boolean).filter(x=>!q||(x.title+' '+x.summary+' '+x.category).toLowerCase().includes(q)).slice(0,limit);
    return json({articles:items,count:items.length},200,origin,30);
   }
   const one=path.match(/^\/api\/v1\/articles\/([a-zA-Z0-9_-]{1,110})$/);
   if(one){
    const row=await env.DB.prepare('SELECT '+allFields+' FROM articles WHERE slug=? AND is_published=1').bind(one[1]).first();
    const item=publicRow(row);
    return item?json({article:item},200,origin,30):json({error:'Not found'},404,origin);
   }
   const override=path.match(/^\/api\/v1\/overrides\/([a-zA-Z0-9_-]{1,110})$/);
   if(override){
    const row=await env.DB.prepare("SELECT published_snapshot FROM articles WHERE slug=? AND is_published=1 AND content_type='legacy' AND content_override=1 AND LENGTH(published_snapshot)>160").bind(override[1]).first();
    if(!row)return json({active:false},200,origin,30);
    try {
     const data=JSON.parse(row.published_snapshot);
     if(typeof data.body_md!=='string'||data.body_md.length<160)return json({active:false},200,origin,30);
     return json({active:true,title:data.title||'',summary:data.summary||'',seo_title:data.seo_title||'',seo_description:data.seo_description||'',cover_url:data.cover_url||'',html:renderMarkdown(data.body_md)},200,origin,30);
    }catch(e){return json({active:false},200,origin,30);}
   }
   if(path==='/robots.txt')return textResponse('User-agent: *\nAllow: /\nSitemap: '+BLOG+'/sitemap.xml\n','text/plain; charset=utf-8');
   if(path==='/sitemap.xml'){
    const rows=await env.DB.prepare("SELECT slug,updated_at FROM articles WHERE content_type='dynamic' AND is_published=1 AND LENGTH(published_snapshot)>160 ORDER BY id DESC LIMIT 500").all();
    const urls=(rows.results||[]).map(row=>'<url><loc>'+BLOG+'/'+encodeURIComponent(row.slug)+'</loc><lastmod>'+iso(row.updated_at)+'</lastmod></url>').join('');
    return textResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls+'</urlset>','application/xml; charset=utf-8');
   }
   if(path==='/')return Response.redirect(MAIN+'/articles.html',302);
   const slug=path.match(/^\/([a-zA-Z0-9_-]{1,110})\/?$/);
   if(slug){
    const row=await published(env,slug[1]);
    return row?textResponse(blogPage(row)):textResponse('<!doctype html><title>Not found</title><p>Article not found. <a href="'+MAIN+'/articles.html">Back to articles</a></p>','text/html; charset=utf-8',404);
   }
   return json({error:'Not found'},404,origin);
  }catch(e){console.error('blog backend failure',e?.name||'unknown');return json({error:'Service temporarily unavailable'},503,origin);}
 }
};