/* Private metadata admin Worker. Denies all access unless Worker-level Cloudflare Access is configured. */
const OWNER_EMAIL = 'contact@nawazsharif.in';
const CLIENT = "(function () {\n  'use strict';\n  var form = document.getElementById('article-form');\n  var info = document.getElementById('info');\n  var records = document.getElementById('records');\n  var editSlug = null;\n  var fields = ['slug','title','summary','category','url'];\n  function message(text) { info.textContent = text; }\n  function clear() {\n    form.reset();\n    editSlug = null;\n    form.elements.slug.disabled = false;\n    document.getElementById('save').textContent = 'Create article record';\n  }\n  async function call(path, options) {\n    var res = await fetch(path, Object.assign({ credentials:'same-origin',headers:{'Accept':'application/json'} },options || {}));\n    var data = await res.json();\n    if (!res.ok) throw new Error(data.error || 'Request failed');\n    return data;\n  }\n  async function reload() {\n    var result = await call('/admin/api/articles');\n    records.replaceChildren();\n    result.articles.forEach(function (article) {\n      var item = document.createElement('button');\n      item.type = 'button';\n      item.className = 'article-row';\n      item.textContent = article.title + (article.is_published ? ' · Published' : ' · Draft');\n      item.addEventListener('click', function () {\n        editSlug = article.slug;\n        fields.forEach(function (field) { form.elements[field].value = article[field] || ''; });\n        form.elements.is_published.checked = !!article.is_published;\n        form.elements.slug.disabled = true;\n        document.getElementById('save').textContent = 'Save changes';\n        message('Editing ' + article.slug);\n        form.elements.title.focus();\n      });\n      records.appendChild(item);\n    });\n    if (!result.articles.length) message('No article records yet.');\n  }\n  form.addEventListener('submit', async function (event) {\n    event.preventDefault();\n    var body = {};\n    fields.forEach(function (field) { body[field] = form.elements[field].value.trim(); });\n    body.is_published = form.elements.is_published.checked;\n    message('Saving…');\n    try {\n      await call(editSlug ? '/admin/api/articles/' + encodeURIComponent(editSlug) : '/admin/api/articles', {\n        method: editSlug ? 'PUT' : 'POST',\n        headers:{'Content-Type':'application/json','Accept':'application/json'},\n        body:JSON.stringify(body)\n      });\n      clear();await reload();message('Saved successfully.');\n    } catch (error) { message('Could not save: ' + error.message); }\n  });\n  document.getElementById('reset').addEventListener('click', clear);\n  reload().catch(function (error) { message('Unable to load articles: ' + error.message); });\n})();";
const HTML = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Article Admin | nawazsharif.in</title><style>\n:root{font-family:system-ui,-apple-system,sans-serif;color-scheme:dark}\nbody{max-width:1100px;margin:0 auto;padding:22px;background:#101a1b;color:#eef5f2}\nh1{font-size:1.6rem;letter-spacing:-.03em;margin:0 0 10px}h2{font-size:1.1rem}p{color:#b5c9be;line-height:1.6}\nmain{display:grid;grid-template-columns:1.2fr 1fr;gap:26px;margin-top:23px}\narticle{background:#162523;border:1px solid #355148;border-radius:7px;padding:20px}\nlabel{display:block;font-size:13px;font-weight:650;margin:13px 0 5px}\ninput,textarea{width:100%;box-sizing:border-box;background:#0f1b19;color:#edf3f0;border:1px solid #516d60;padding:11px;border-radius:4px;font:inherit}\ntextarea{min-height:80px;resize:vertical}input[type=checkbox]{width:auto}\n.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:20px}\nbutton{cursor:pointer;border:1px solid #83bfa4;border-radius:4px;background:#82c4a5;color:#102319;padding:11px 14px;font-weight:650}\nbutton.secondary{background:none;color:#d0e9db}\n.article-row{display:block;width:100%;border:0;border-bottom:1px solid #355148;padding:12px 7px;text-align:left;border-radius:0;background:none;color:#eaf3ee;font-weight:450}\n.article-row:hover{background:#263a34}#info{min-height:1.5em}\n@media(max-width:720px){main{grid-template-columns:1fr}article{padding:15px}}\n</style></head><body><header><h1>Article administration</h1><p>Private dashboard · Cloudflare Access required · Metadata only. Publish full HTML articles separately before linking them here.</p></header><main>\n<article><h2>Article record</h2><form id=\"article-form\"><label for=\"slug\">URL slug</label><input id=\"slug\" name=\"slug\" required maxlength=\"110\" pattern=\"[a-zA-Z0-9_-]+\" placeholder=\"your-article-title\">\n<label for=\"title\">Title</label><input id=\"title\" name=\"title\" required maxlength=\"180\">\n<label for=\"summary\">Summary</label><textarea id=\"summary\" name=\"summary\" maxlength=\"500\"></textarea>\n<label for=\"category\">Category</label><input id=\"category\" name=\"category\" maxlength=\"48\" value=\"Technology\">\n<label for=\"url\">Existing HTML article URL</label><input id=\"url\" name=\"url\" required placeholder=\"/your-article-title.html\">\n<label><input name=\"is_published\" type=\"checkbox\"> Published (visible on archive)</label>\n<div class=\"actions\"><button id=\"save\" type=\"submit\">Create article record</button><button id=\"reset\" type=\"button\" class=\"secondary\">Clear</button></div></form>\n<p id=\"info\" role=\"status\" aria-live=\"polite\"></p></article>\n<article><h2>Existing records</h2><div id=\"records\"></div></article></main><script defer src=\"/admin/client.js\"></script></body></html>";
const head = { 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer', 'X-Frame-Options':'DENY' };
function json(body,status=200){return new Response(JSON.stringify(body),{status,headers:{...head,'Content-Type':'application/json; charset=utf-8'}});}
function page(body,type){return new Response(body,{status:200,headers:{...head,'Content-Type':type,'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}});}
function clean(data) {
 if(!data||typeof data!=='object')return null;
 const value={};
 for(const key of ['slug','title','summary','category','url'])value[key]=typeof data[key]==='string'?data[key].trim():'';
 if(!/^[a-zA-Z0-9_-]{1,110}$/.test(value.slug))return null;
 if(value.title.length<3||value.title.length>180||value.summary.length>500||value.category.length>48)return null;
 if(!/^\/[a-zA-Z0-9/_-]+\.html$/.test(value.url))return null;
 value.category=value.category||'Technology';
 value.is_published=data.is_published===true?1:0;
 return value;
}
async function isOwner(ctx) {
 if(!ctx||!ctx.access||typeof ctx.access.getIdentity!=='function')return false;
 try {const person=await ctx.access.getIdentity();return person&&typeof person.email==='string'&&person.email.toLowerCase()===OWNER_EMAIL;} catch(e){return false;}
}
export default {
 async fetch(request,env,ctx){
   // Do not trust spoofable headers. The identity comes exclusively from
   // the Cloudflare Access runtime integration attached to this Worker.
   if(!(await isOwner(ctx)))return json({error:'Access required'},403);
   const u=new URL(request.url),path=u.pathname;
   try{
     if(request.method==='GET'&&path==='/admin')return page(HTML,'text/html; charset=utf-8');
     if(request.method==='GET'&&path==='/admin/client.js')return page(CLIENT,'text/javascript; charset=utf-8');
     if(request.method==='GET'&&path==='/admin/api/articles'){
       const rows=await env.DB.prepare('SELECT slug,title,summary,category,url,is_published,created_at,updated_at FROM articles ORDER BY id DESC LIMIT 300').all();
       return json({articles:rows.results||[]});
     }
     if((request.method==='POST'||request.method==='PUT')&&path.startsWith('/admin/api/articles')){
       // JSON + same-origin requirement to prevent cross-origin form/CSRF requests.
       if(request.headers.get('Origin')!==u.origin)return json({error:'Origin rejected'},403);
       if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'JSON required'},415);
       let payload;
       try{payload=await request.json();}catch(e){return json({error:'Invalid JSON'},400);}
       const value=clean(payload);
       if(!value)return json({error:'Invalid article fields'},400);
       if(request.method==='POST'&&path==='/admin/api/articles'){
         try{
           await env.DB.prepare('INSERT INTO articles(slug,title,summary,category,url,is_published) VALUES(?,?,?,?,?,?)')
             .bind(value.slug,value.title,value.summary,value.category,value.url,value.is_published).run();
           return json({saved:true,slug:value.slug},201);
         }catch(e){return json({error:'Slug already exists or database unavailable'},409);}
       }
       const m=path.match(/^\/admin\/api\/articles\/([a-zA-Z0-9_-]{1,110})$/);
       if(request.method==='PUT'&&m&&m[1]===value.slug){
         const result=await env.DB.prepare('UPDATE articles SET title=?,summary=?,category=?,url=?,is_published=?,updated_at=CURRENT_TIMESTAMP WHERE slug=?')
           .bind(value.title,value.summary,value.category,value.url,value.is_published,value.slug).run();
         return result.meta?.changes?json({saved:true,slug:value.slug}):json({error:'Article not found'},404);
       }
     }
     return json({error:'Not found'},404);
   }catch(e){console.error('Admin backend error',e?.name||'unknown');return json({error:'Service unavailable'},503);}
 }
};