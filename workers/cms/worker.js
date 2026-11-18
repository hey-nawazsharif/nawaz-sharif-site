import {renderSections,builderCSS} from './builder-render.js';
/*
 * Nawaz CMS — public read-only preview Worker.
 * Preserves the existing GitHub Pages HTML, scripts, forms, and URL structure.
 * Published content is substituted server-side via HTMLRewriter.
 * Production www/root DNS is not touched; this Worker serves only a test hostname.
 */
const ORIGIN='https://nawazsharif.in';
const PAGES=new Set(['/index.html','/about.html','/faq.html','/contact.html','/articles.html','/privacy-policy.html','/terms.html']);
const SAFE_ASSET=/^\/[a-zA-Z0-9_./-]+\.(?:css|js|jpg|jpeg|png|webp|svg|ico|mp4|woff2?|webm|gif|txt)$/;
function escapeHTML(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function safeMenu(raw){
 let arr;
 try{arr=JSON.parse(raw)}catch(e){return null}
 if(!Array.isArray(arr)||arr.length>12)return null;
 const out=[];
 for(const item of arr){
  if(!item||typeof item.label!=='string'||typeof item.href!=='string'||item.label.length<1||item.label.length>48)return null;
  if(!/^\/(?!\/)[a-zA-Z0-9_.\/#?=&%-]*$/.test(item.href)||item.href.length>190)return null;
  out.push('<a href="'+escapeHTML(item.href)+'">'+escapeHTML(item.label)+'</a>');
 }
 return out.join('');
}
function selectorRewrite(value,kind){
 return {element(e){
  if(kind==='title'||kind==='text')e.setInnerContent(value);
  else if(kind==='answer')e.setInnerContent('<p>'+escapeHTML(value).replace(/\n{2,}/g,'</p><p>').replace(/\n/g,'<br>')+'</p>',{html:true});
  else if(kind==='meta')e.setAttribute('content',value);
 }};
}
function originAsset(request,url){
 return Response.redirect(ORIGIN+url.pathname+url.search,302);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  if(url.pathname==='/robots.txt')return new Response('User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain','Cache-Control':'public, max-age=300'}});
  let path=url.pathname==='/'?'/index.html':url.pathname;
  if(!PAGES.has(path)){
   if(SAFE_ASSET.test(path)&&!path.includes('..'))return originAsset(request,url);
   if(/^\/[a-zA-Z0-9_-]+\.html$/.test(path))return Response.redirect(ORIGIN+path,302);
   return new Response('Not found',{status:404,headers:{'X-Robots-Tag':'noindex'}});
  }
  let origin;
  try{
   origin=await fetch(ORIGIN+path,{method:request.method,redirect:'manual',cf:{cacheTtl:120}});
  }catch(e){
   console.error('CMS preview origin fetch failed');
   return new Response('Original website is temporarily unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
  }
  if(origin.status!==200||!String(origin.headers.get('Content-Type')||'').includes('text/html')){
    return new Response('Page unavailable',{status:503,headers:{'Cache-Control':'no-store'}});
  }
  const headers=new Headers(origin.headers);
  for(const h of ['content-length','content-encoding','transfer-encoding','etag','last-modified','set-cookie','cache-control'])headers.delete(h);
  headers.set('Content-Type','text/html; charset=utf-8');
  headers.set('Cache-Control','public, max-age=30');
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('X-Robots-Tag','noindex,nofollow');
  const wrapper=new Response(origin.body,{status:200,headers});
  if(request.method==='HEAD')return new Response(null,{status:200,headers});
  let rows=[],settings=[],sections=[],palette={};
  try{
   const results=await env.DB.batch([
    env.DB.prepare('SELECT block_key,label,selector,kind,published_text FROM site_blocks WHERE page_path=? AND published_override=1').bind(path),
    env.DB.prepare('SELECT key,published_json FROM site_settings WHERE published_override=1'),
    env.DB.prepare('SELECT published_json FROM site_documents WHERE page_path=?').bind(path),
    env.DB.prepare("SELECT published_json FROM site_design WHERE key='main'")
   ]);
   rows=results[0]?.results||[];
   settings=results[1]?.results||[];
   const doc=results[2]?.results?.[0];const design=results[3]?.results?.[0];
   if(doc){
    try { sections=JSON.parse(doc.published_json||'[]'); }catch(e){sections=[];}
   }
   if(design){
    try { palette=JSON.parse(design.published_json||'{}'); }catch(e){palette={};}
   }
  }catch(e){
   console.error('CMS database temporarily unavailable, returning original');
   // Fail open for public rendering: original GitHub Pages HTML still works.
  }
  const injected=renderSections(sections,palette);
  let rw=new HTMLRewriter().on('head',{element(e){e.prepend('<meta name="robots" content="noindex,nofollow">',{html:true});e.append('<style id="nawaz-cms-builder">'+builderCSS()+'</style>',{html:true});}});
  if(injected&&injected.top)rw=rw.on('main#main',{element(e){e.prepend(injected.top,{html:true});}});
  if(injected&&injected.bottom)rw=rw.on('main#main',{element(e){e.append(injected.bottom,{html:true});}});
  for(const row of rows){
   if(!row.selector||!['text','title','meta','answer'].includes(row.kind))continue;
   const v=String(row.published_text||'').slice(0,row.kind==='answer'?8000:1200);
   rw=rw.on(row.selector,selectorRewrite(v,row.kind));
   if(row.block_key==='seo_title')rw=rw.on('meta[property="og:title"]',{element(e){e.setAttribute('content',v);}});
   if(row.block_key==='seo_description')rw=rw.on('meta[property="og:description"]',{element(e){e.setAttribute('content',v);}});
  }
  for(const entry of settings){
   if(entry.key==='primary_nav'){
    const menu=safeMenu(entry.published_json);
    if(menu!==null)rw=rw.on('header nav[aria-label="Main navigation"]',{element(e){e.setInnerContent(menu,{html:true});}});
   }
   if(entry.key==='footer_nav'){
    const menu=safeMenu(entry.published_json);
    if(menu!==null)rw=rw.on('footer nav.footer-links',{element(e){e.setInnerContent(menu,{html:true});}});
   }
   if(entry.key==='footer_tagline'){
    try{const value=JSON.parse(entry.published_json);if(typeof value==='string')rw=rw.on('footer .footer-bottom span:nth-of-type(2)',{element(e){e.setInnerContent(value.slice(0,240));}});}catch(e){}
   }
  }
  return rw.transform(wrapper);
 }
};