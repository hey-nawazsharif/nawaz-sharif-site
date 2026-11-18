/* Owner-only full article publishing. Never trusts browser-supplied identity. */
import adminHTML from './index.html';
import adminJS from './client.txt';
import adminCSS from './admin-css.txt';
import {renderMarkdown} from './markdown.js';
const OWNER='contact@nawazsharif.in';
const BLOG='https://blog.nawazsharif.in';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});}
function asset(body,type){return new Response(body,{headers:{...headers,'Content-Type':type,'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src https: data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});}
async function owner(ctx){
 if(!ctx?.access||typeof ctx.access.getIdentity!=='function')return false;
 try {const identity=await ctx.access.getIdentity();return identity?.email?.toLowerCase()===OWNER;}catch(e){return false;}
}
async function inputJSON(request){
 const ct=request.headers.get('Content-Type')||'';
 if(!ct.toLowerCase().startsWith('application/json'))throw Error('JSON content type required');
 const length=parseInt(request.headers.get('Content-Length')||'0',10);
 if(length>145000)throw Error('Request is too large');
 const text=await request.text();
 if(text.length>145000)throw Error('Request is too large');
 try{return JSON.parse(text);}catch(e){throw Error('Invalid JSON');}
}
function clean(data,kind){
 if(!data||typeof data!=='object'||Array.isArray(data))return {error:'Missing article data'};
 const out={};
 for(const key of ['slug','title','summary','category','body_md','seo_title','seo_description','cover_url']){
  out[key]=typeof data[key]==='string'?data[key].trim():'';
 }
 if(!/^[a-zA-Z0-9_-]{1,110}$/.test(out.slug))return {error:'Invalid slug'};
 if(kind==='dynamic'&&!/^[a-z0-9](?:[a-z0-9-]{1,98})[a-z0-9]$/.test(out.slug))return {error:'Slug needs 3-100 lowercase letters, digits or hyphens'};
 if(['api','health','admin','sitemap','robots'].includes(out.slug))return {error:'Reserved slug'};
 if(out.title.length<3||out.title.length>180)return {error:'Title must be 3-180 characters'};
 if(out.summary.length>500||out.category.length>48||out.seo_title.length>180||out.seo_description.length>320)return {error:'Summary or SEO field is too long'};
 if(out.body_md.length>100000)return {error:'Article body is too long'};
 if(out.cover_url){
  try{const u=new URL(out.cover_url);if(u.protocol!=='https:'||u.username||u.password||out.cover_url.length>1500)throw Error();}catch(e){return {error:'Cover must be an HTTPS image URL'};}
 }
 out.category=out.category||'Technology';
 out.is_published=data.is_published===true?1:0;
 out.content_override=kind==='legacy'&&data.content_override===true?1:0;
 if(kind==='dynamic'&&out.is_published&&out.body_md.length<160)return {error:'Write at least 160 characters before publishing'};
 if(kind==='legacy'&&out.content_override&&out.body_md.length<160)return {error:'Write at least 160 characters to replace the original article'};
 if(kind==='legacy'&&out.content_override&&!out.is_published)return {error:'Publish the article before activating replacement content'};
 return out;
}
async function saveRevision(db,old) {
 await db.prepare('INSERT INTO article_revisions(slug,snapshot) VALUES(?,?)').bind(old.slug,JSON.stringify(old)).run();
}
function validOrigin(request,u){return request.headers.get('Origin')===u.origin && (request.headers.get('Sec-Fetch-Site')||'same-origin')==='same-origin';}
export default {
 async fetch(request,env,ctx){
  if(!(await owner(ctx)))return json({error:'Access required'},403);
  const u=new URL(request.url),path=u.pathname;
  if(request.method==='GET'&&(path==='/admin'||path==='/admin/'))return asset(adminHTML,'text/html; charset=utf-8');
  if(request.method==='GET'&&path==='/admin/client.js')return asset(adminJS,'text/javascript; charset=utf-8');
  if(request.method==='GET'&&path==='/admin/style.css')return asset(adminCSS,'text/css; charset=utf-8');
  try{
   if(request.method==='GET'&&path==='/admin/api/articles'){
    const result=await env.DB.prepare('SELECT slug,title,summary,category,url,is_published,content_type,body_md,seo_title,seo_description,cover_url,content_override,published_at,created_at,updated_at FROM articles ORDER BY id DESC LIMIT 400').all();
    return json({articles:result.results||[]});
   }
   const rev=path.match(/^\/admin\/api\/articles\/([a-zA-Z0-9_-]{1,110})\/revisions$/);
   if(request.method==='GET'&&rev){
    const r=await env.DB.prepare('SELECT id,created_at FROM article_revisions WHERE slug=? ORDER BY id DESC LIMIT 15').bind(rev[1]).all();
    return json({revisions:r.results||[]});
   }
   const revItem=path.match(/^\/admin\/api\/articles\/([a-zA-Z0-9_-]{1,110})\/revisions\/(\d{1,15})$/);
   if(request.method==='GET'&&revItem){
    const r=await env.DB.prepare('SELECT snapshot FROM article_revisions WHERE slug=? AND id=?').bind(revItem[1],Number(revItem[2])).first();
    return r?json({article:JSON.parse(r.snapshot)}):json({error:'Revision not found'},404);
   }
   if(request.method==='POST'&&path==='/admin/api/preview'){
    if(!validOrigin(request,u))return json({error:'Origin rejected'},403);
    const payload=await inputJSON(request);
    if(typeof payload.body_md!=='string'||payload.body_md.length>100000)return json({error:'Invalid body'},400);
    return json({html:renderMarkdown(payload.body_md)});
   }
   if(request.method!=='POST'&&request.method!=='PUT')return json({error:'Not found'},404);
   if(!validOrigin(request,u))return json({error:'Origin rejected'},403);
   const payload=await inputJSON(request);
   if(request.method==='POST'&&path==='/admin/api/articles'){
    const cleanValue=clean(payload,'dynamic');
    if(cleanValue.error)return json({error:cleanValue.error},400);
    const x=cleanValue;
    const existing=await env.DB.prepare('SELECT 1 FROM articles WHERE slug=? OR url=? LIMIT 1').bind(x.slug,BLOG+'/'+x.slug).first();
    if(existing)return json({error:'Slug already exists'},409);
    await env.DB.prepare('INSERT INTO articles(slug,title,summary,category,url,is_published,body_md,content_type,seo_title,seo_description,cover_url,content_override) VALUES(?,?,?,?,?,?,?, ?,?,?,?,0)')
      .bind(x.slug,x.title,x.summary,x.category,BLOG+'/'+x.slug,x.is_published,x.body_md,'dynamic',x.seo_title,x.seo_description,x.cover_url).run();
    return json({saved:true,slug:x.slug,url:BLOG+'/'+x.slug},201);
   }
   const match=path.match(/^\/admin\/api\/articles\/([a-zA-Z0-9_-]{1,110})$/);
   if(request.method==='PUT'&&match){
    const old=await env.DB.prepare('SELECT slug,title,summary,category,url,is_published,content_type,body_md,seo_title,seo_description,cover_url,content_override,published_at FROM articles WHERE slug=?').bind(match[1]).first();
    if(!old)return json({error:'Article not found'},404);
    const x=clean(payload,old.content_type);
    if(x.error)return json({error:x.error},400);
    if(x.slug!==match[1])return json({error:'Existing article slug cannot change'},400);
    // Legacy original URLs and HTML stay untouched. Dynamic URLs use the blog subdomain.
    await env.DB.batch([
      env.DB.prepare('INSERT INTO article_revisions(slug,snapshot) VALUES(?,?)').bind(old.slug,JSON.stringify(old)),
      env.DB.prepare('UPDATE articles SET title=?,summary=?,category=?,is_published=?,body_md=?,seo_title=?,seo_description=?,cover_url=?,content_override=?,updated_at=CURRENT_TIMESTAMP WHERE slug=?')
        .bind(x.title,x.summary,x.category,x.is_published,x.body_md,x.seo_title,x.seo_description,x.cover_url,x.content_override,x.slug)
    ]);
    return json({saved:true,slug:x.slug,url:old.url});
   }
   return json({error:'Not found'},404);
  }catch(e){
   const msg=e instanceof Error?e.message:'Unexpected error';
   if(['JSON content type required','Request is too large','Invalid JSON'].includes(msg))return json({error:msg},400);
   console.error('Admin editor error',e?.name||'unknown');
   return json({error:'Database or service unavailable'},503);
  }
 }
};