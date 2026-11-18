/* Owner-only visual page builder. This handler runs after ctx.access owner check. */
import {validateSections,renderSections,builderCSS} from './builder-render.js';
const PAGES=new Set(['/index.html','/about.html','/faq.html','/contact.html','/articles.html']);
const MEDIA_URL_MAX=1500;
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'};
const json=(x,status=200)=>new Response(JSON.stringify(x),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}});
function checkOrigin(r,u){return r.headers.get('Origin')===u.origin&&(r.headers.get('Sec-Fetch-Site')||'same-origin')==='same-origin'}
async function readBody(r){
 if(!String(r.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))throw Error('JSON required');
 const s=await r.text();
 if(s.length>145000)throw Error('Request too large');
 try{return JSON.parse(s)}catch(e){throw Error('Invalid JSON')}
}
function httpsURL(url){
 if(typeof url!=='string'||url.length<8||url.length>MEDIA_URL_MAX)return false;
 try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!/[\x00-\x20<>"']/.test(url);}catch(e){return false;}
}
function designJSON(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||!['forest','slate','sand'].includes(value.theme)||!['comfortable','compact'].includes(value.spacing))throw Error('Invalid appearance settings');
 return JSON.stringify({theme:value.theme,spacing:value.spacing});
}
export async function handleBuilder(request,env) {
 const u=new URL(request.url),path=u.pathname,method=request.method;
 try{
  if(method==='GET'&&path==='/admin/api/builder/document'){
   const page=u.searchParams.get('page')||'';
   if(!PAGES.has(page))return json({error:'Invalid page'},400);
   const row=await env.DB.prepare('SELECT draft_json,published_json,draft_version,published_version FROM site_documents WHERE page_path=?').bind(page).first();
   if(!row)return json({error:'Page unavailable'},404);
   return json({page_path:page,sections:JSON.parse(row.draft_json),draft_version:row.draft_version,published_version:row.published_version,published_count:JSON.parse(row.published_json).length});
  }
  if(method==='GET'&&path==='/admin/api/builder/history'){
   const page=u.searchParams.get('page')||'';
   if(!PAGES.has(page))return json({error:'Invalid page'},400);
   const r=await env.DB.prepare('SELECT id,created_at FROM site_builder_revisions WHERE page_path=? ORDER BY id DESC LIMIT 15').bind(page).all();
   return json({revisions:r.results||[]});
  }
  const revision=path.match(/^\/admin\/api\/builder\/history\/(\d{1,14})$/);
  if(method==='GET'&&revision){
   const page=u.searchParams.get('page')||'';
   if(!PAGES.has(page))return json({error:'Invalid page'},400);
   const row=await env.DB.prepare('SELECT snapshot FROM site_builder_revisions WHERE page_path=? AND id=?').bind(page,Number(revision[1])).first();
   return row?json({sections:JSON.parse(row.snapshot)}):json({error:'Revision not found'},404);
  }
  if(method==='GET'&&path==='/admin/api/builder/media'){
   const r=await env.DB.prepare('SELECT id,url,label FROM site_media ORDER BY id DESC LIMIT 100').all();
   return json({media:r.results||[]});
  }
  if(method==='GET'&&path==='/admin/api/builder/appearance'){
   const row=await env.DB.prepare("SELECT draft_json,published_json FROM site_design WHERE key='main'").first();
   if(!row)return json({error:'Design settings unavailable'},404);
   return json({draft:JSON.parse(row.draft_json),published:JSON.parse(row.published_json)});
  }
  if(method!=='POST')return json({error:'Not found'},404);
  if(!checkOrigin(request,u))return json({error:'Origin rejected'},403);
  const data=await readBody(request);
  if(!data||typeof data!=='object'||Array.isArray(data))return json({error:'Invalid input'},400);
  if(path==='/admin/api/builder/preview'){
   const parsed=validateSections(data.sections);
   if(parsed.error)return json({error:parsed.error},400);
   const design=data.design||{theme:'forest',spacing:'comfortable'};
   const result=renderSections(parsed.sections,design);
   return json({html:(result?.top||'')+(result?.bottom||''),css:builderCSS()});
  }
  if(path==='/admin/api/builder/document'){
   const page=data.page_path;
   if(!PAGES.has(page)||!['draft','publish'].includes(data.intent))return json({error:'Invalid page or action'},400);
   if(!Number.isInteger(data.expected_version)||data.expected_version<0)return json({error:'Invalid version'},400);
   const parsed=validateSections(data.sections);
   if(parsed.error)return json({error:parsed.error},400);
   const old=await env.DB.prepare('SELECT draft_json,published_json,draft_version FROM site_documents WHERE page_path=?').bind(page).first();
   if(!old)return json({error:'Page not found'},404);
   if(old.draft_version!==data.expected_version)return json({error:'This page was edited elsewhere. Refresh to avoid overwriting changes.'},409);
   const latest=JSON.stringify(parsed.sections),publish=data.intent==='publish'?1:0;
   await env.DB.batch([
    env.DB.prepare('INSERT INTO site_builder_revisions(page_path,snapshot) VALUES(?,?)').bind(page,old.draft_json),
    env.DB.prepare('UPDATE site_documents SET draft_json=?,draft_version=draft_version+1,published_json=CASE WHEN ?=1 THEN ? ELSE published_json END,published_version=published_version+?,updated_at=CURRENT_TIMESTAMP WHERE page_path=? AND draft_version=?')
      .bind(latest,publish,latest,publish,page,data.expected_version)
   ]);
   return json({saved:true,page_path:page,draft_version:data.expected_version+1,published:!!publish});
  }
  if(path==='/admin/api/builder/media'){
   const url=String(data.url||'').trim(),label=String(data.label||'').trim();
   if(!httpsURL(url)||!label||label.length>100)return json({error:'Use a valid HTTPS image URL and label'},400);
   await env.DB.prepare('INSERT OR IGNORE INTO site_media(url,label) VALUES(?,?)').bind(url,label).run();
   return json({saved:true},201);
  }
  if(path==='/admin/api/builder/appearance'){
   if(!['draft','publish'].includes(data.intent))return json({error:'Invalid action'},400);
   const value=designJSON(data.design);
   const publish=data.intent==='publish'?1:0;
   await env.DB.prepare("UPDATE site_design SET draft_json=?,published_json=CASE WHEN ?=1 THEN ? ELSE published_json END,updated_at=CURRENT_TIMESTAMP WHERE key='main'").bind(value,publish,value).run();
   return json({saved:true,published:!!publish});
  }
  return json({error:'Not found'},404);
 }catch(e){
  if(e?.message&&(/Invalid|too large|JSON required|Maximum|requires|long|HTTPS|links|sections|identifier|duplicate|version/i.test(e.message)))return json({error:e.message},400);
  console.error('Builder API failure',e?.name||'unknown');
  return json({error:'Builder temporarily unavailable'},503);
 }
}