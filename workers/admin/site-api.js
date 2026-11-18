/* Owner-only CMS endpoints — invoked AFTER the main Admin Worker's ctx.access check. */
const PAGES=new Set(['/index.html','/about.html','/faq.html','/contact.html','/articles.html','/privacy-policy.html','/terms.html']);
const baseHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...baseHeaders,'Content-Type':'application/json; charset=utf-8'}});}
function validOrigin(r){const u=new URL(r.url);return r.headers.get('Origin')===u.origin&&(r.headers.get('Sec-Fetch-Site')||'same-origin')==='same-origin';}
async function payload(r){
 if(!String(r.headers.get('Content-Type')||'').toLowerCase().startsWith('application/json'))throw Error('JSON content type required');
 const text=await r.text();
 if(text.length>175000)throw Error('Request too large');
 try{return JSON.parse(text);}catch(e){throw Error('Invalid JSON');}
}
function validLink(item){
 return item&&typeof item.label==='string'&&typeof item.href==='string'&&item.label.length>0&&item.label.length<=48&&/^\/(?!\/)[a-zA-Z0-9_./#?=&%-]*$/.test(item.href)&&item.href.length<=190;
}
function stringifySettings(key,value){
 if(key.endsWith('_nav')){
  if(!Array.isArray(value)||value.length>12||!value.every(validLink))throw Error('Invalid navigation entries');
  return JSON.stringify(value.map(x=>({label:x.label.trim(),href:x.href.trim()})));
 }
 if(key==='footer_tagline'){
  if(typeof value!=='string'||value.length>240)throw Error('Invalid footer tagline');
  return JSON.stringify(value.trim());
 }
 throw Error('Unrecognized setting');
}
function settingsForEditor(row){
 let value;
 try{value=JSON.parse(row.draft_json)}catch(e){value='';}
 if(row.key.endsWith('_nav'))return Array.isArray(value)?value.map(x=>x.label+' | '+x.href).join('\n'):'';
 return String(value);
}
export async function handleSiteAPI(request,env){
 const u=new URL(request.url),path=u.pathname,method=request.method;
 try{
  if(method==='GET'&&path==='/admin/api/site/pages'){
   const page=u.searchParams.get('page')||'';
   if(!PAGES.has(page))return json({error:'Invalid page'},400);
   const rows=await env.DB.prepare('SELECT block_key,label,kind,original_text,draft_text,published_override,updated_at FROM site_blocks WHERE page_path=? ORDER BY CASE block_key WHEN ? THEN 0 WHEN ? THEN 1 WHEN ? THEN 2 ELSE 3 END,block_key').bind(page,'main_headline','seo_title','seo_description').all();
   return json({page,fields:rows.results||[]});
  }
  if(method==='GET'&&path==='/admin/api/site/settings'){
   const r=await env.DB.prepare('SELECT key,label,original_json,draft_json,published_override FROM site_settings ORDER BY key').all();
   return json({settings:r.results||[]});
  }
  if(method==='GET'&&path==='/admin/api/site/revisions'){
   const page=u.searchParams.get('page')||'';
   if(!PAGES.has(page)&&page!=='settings')return json({error:'Invalid page'},400);
   const r=await env.DB.prepare('SELECT id,created_at FROM site_revisions WHERE page_path=? ORDER BY id DESC LIMIT 15').bind(page).all();
   return json({revisions:r.results||[]});
  }
  const revision=path.match(/^\/admin\/api\/site\/revisions\/(\d{1,15})$/);
  if(method==='GET'&&revision){
   const page=u.searchParams.get('page')||'';
   if(!PAGES.has(page)&&page!=='settings')return json({error:'Invalid page'},400);
   const row=await env.DB.prepare('SELECT snapshot FROM site_revisions WHERE page_path=? AND id=?').bind(page,Number(revision[1])).first();
   if(!row)return json({error:'Revision not found'},404);
   return json({values:JSON.parse(row.snapshot)});
  }
  if(method!=='POST'||!['/admin/api/site/pages','/admin/api/site/settings'].includes(path))return json({error:'Not found'},404);
  if(!validOrigin(request))return json({error:'Origin rejected'},403);
  const data=await payload(request);
  if(!data||typeof data!=='object'||Array.isArray(data)||!['draft','publish'].includes(data.intent)||!data.values||typeof data.values!=='object'||Array.isArray(data.values))return json({error:'Invalid request data'},400);
  const publish=data.intent==='publish';
  if(path==='/admin/api/site/pages'){
   const page=data.page_path;
   if(!PAGES.has(page))return json({error:'Invalid page'},400);
   const rows=(await env.DB.prepare('SELECT block_key,kind,original_text,draft_text FROM site_blocks WHERE page_path=? ORDER BY block_key').bind(page).all()).results||[];
   if(!rows.length)return json({error:'Page fields unavailable'},404);
   const keys=Object.keys(data.values);
   if(keys.length!==rows.length||keys.some(k=>!rows.some(r=>r.block_key===k)))return json({error:'Field list changed. Refresh the editor and try again.'},409);
   const updates=[],before={};
   for(const row of rows){
    const val=data.values[row.block_key];
    if(typeof val!=='string')return json({error:'Invalid field '+row.block_key},400);
    const clean=val.trim();
    const max=row.kind==='answer'?8000:row.kind==='meta'?320:row.kind==='title'?180:2400;
    if(clean.length>max)return json({error:'Field too long: '+row.label},400);
    if(publish&&(row.kind==='title'||row.block_key==='main_headline')&&clean.length<3)return json({error:'Heading or SEO title cannot be blank'},400);
    before[row.block_key]=row.draft_text;
    updates.push(env.DB.prepare('UPDATE site_blocks SET draft_text=?,published_text=CASE WHEN ?=1 THEN ? ELSE published_text END,published_override=CASE WHEN ?=1 THEN ? ELSE published_override END,updated_at=CURRENT_TIMESTAMP WHERE page_path=? AND block_key=?').bind(clean,publish?1:0,clean,publish?1:0,clean===row.original_text?0:1,page,row.block_key));
   }
   await env.DB.batch([
    env.DB.prepare('INSERT INTO site_revisions(page_path,snapshot) VALUES(?,?)').bind(page,JSON.stringify(before)),
    ...updates
   ]);
   return json({saved:true,published:publish,page});
  }
  if(data.page_path!=='settings')return json({error:'Invalid settings page'},400);
  const rows=(await env.DB.prepare('SELECT key,original_json,draft_json FROM site_settings ORDER BY key').all()).results||[];
  const keys=Object.keys(data.values);
  if(keys.length!==rows.length||keys.some(k=>!rows.some(r=>r.key===k)))return json({error:'Settings list changed. Refresh and try again.'},409);
  const updates=[],before={};
  for(const row of rows){
   const fresh=stringifySettings(row.key,data.values[row.key]);
   before[row.key]=settingsForEditor(row);
   updates.push(env.DB.prepare('UPDATE site_settings SET draft_json=?,published_json=CASE WHEN ?=1 THEN ? ELSE published_json END,published_override=CASE WHEN ?=1 THEN ? ELSE published_override END,updated_at=CURRENT_TIMESTAMP WHERE key=?')
    .bind(fresh,publish?1:0,fresh,publish?1:0,fresh===row.original_json?0:1,row.key));
  }
  await env.DB.batch([
   env.DB.prepare('INSERT INTO site_revisions(page_path,snapshot) VALUES(?,?)').bind('settings',JSON.stringify(before)),
   ...updates
  ]);
  return json({saved:true,published:publish,page:'settings'});
 }catch(e){
  if(e.message&&/Invalid|too large|Unrecognized|content type/i.test(e.message))return json({error:e.message},400);
  console.error('CMS backend failed',e?.name||'unknown');
  return json({error:'CMS service unavailable'},503);
 }
}