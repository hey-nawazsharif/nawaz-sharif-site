/* nawazsharif.in: D1-backed, public read-only article metadata API.
 * This Worker never edits content and never exposes drafts or private logs.
 */
const allowed = new Set(['https://nawazsharif.in','https://www.nawazsharif.in']);
function reply(body, status, origin, cacheSeconds = 0) {
  const headers = new Headers({
    'Content-Type':'application/json; charset=utf-8',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'Cache-Control':cacheSeconds ? 'public, max-age='+cacheSeconds : 'no-store',
    'Vary':'Origin'
  });
  if (allowed.has(origin)) {
    headers.set('Access-Control-Allow-Origin',origin);
    headers.set('Access-Control-Allow-Methods','GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers','Accept');
  }
  return new Response(JSON.stringify(body),{status,headers});
}
export default {
  async fetch(request,env) {
    const origin=request.headers.get('Origin')||'';
    const url=new URL(request.url);
    if(request.method==='OPTIONS'){
      return allowed.has(origin) ? new Response(null,{status:204,headers:{
        'Access-Control-Allow-Origin':origin,
        'Access-Control-Allow-Methods':'GET, OPTIONS',
        'Access-Control-Allow-Headers':'Accept',
        'Access-Control-Max-Age':'86400',
        'Vary':'Origin'
      }}) : reply({error:'Forbidden'},403,origin);
    }
    if(request.method!=='GET')return reply({error:'Method not allowed'},405,origin);
    try {
      if(url.pathname==='/health'){
        const row=await env.DB.prepare('SELECT COUNT(*) AS total FROM articles WHERE is_published = 1').first();
        return reply({status:'ok',service:'nawaz-site-api',publishedArticles:row?.total||0},200,origin,0);
      }
      if(url.pathname==='/api/v1/articles'){
        const search=(url.searchParams.get('q')||'').trim().slice(0,70);
        const limit=Math.min(Math.max(Number.parseInt(url.searchParams.get('limit')||'24',10)||24,1),50);
        const sql='SELECT slug,title,summary,category,url,published_at,updated_at FROM articles WHERE is_published=1'+(search?' AND (title LIKE ? OR summary LIKE ?)':'')+' ORDER BY id DESC LIMIT ?';
        const params=search?['%'+search+'%','%'+search+'%',limit]:[limit];
        const rows=await env.DB.prepare(sql).bind(...params).all();
        return reply({articles:rows.results||[],count:(rows.results||[]).length},200,origin,60);
      }
      const matched=url.pathname.match(/^\/api\/v1\/articles\/([a-zA-Z0-9_-]{1,110})$/);
      if(matched){
        const row=await env.DB.prepare('SELECT slug,title,summary,category,url,published_at,updated_at FROM articles WHERE slug=? AND is_published=1').bind(matched[1]).first();
        return row?reply({article:row},200,origin,60):reply({error:'Article not found'},404,origin);
      }
      return reply({error:'Not found'},404,origin);
    } catch(e) {
      console.error('site API database error',e?.name||'unknown');
      return reply({error:'Service temporarily unavailable'},503,origin);
    }
  }
};