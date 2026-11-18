/* Owner-only read-only content backup. Caller MUST enforce Cloudflare Access owner identity. */
const BACKUP_TABLES=[
 'articles','article_revisions',
 'site_blocks','site_settings','site_page_versions','site_revisions',
 'site_documents','site_builder_revisions','site_design','site_media'
];
function reply(data,status=200,download=false){
 const h=new Headers({
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store, max-age=0',
  'Pragma':'no-cache',
  'X-Content-Type-Options':'nosniff',
  'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'"
 });
 if(download)h.set('Content-Disposition','attachment; filename="nawaz-cms-backup-'+new Date().toISOString().slice(0,10)+'.json"');
 return new Response(JSON.stringify(data,null,download?2:0),{status,headers:h});
}
export async function handleBackup(request,env){
 if(request.method!=='GET')return reply({error:'Method not allowed'},405);
 try{
  // Read table rows and counts together. D1 batch guarantees the queries are
  // executed sequentially in a transaction; reject a truncated export.
  const queries=BACKUP_TABLES.flatMap(name=>[
   env.DB.prepare('SELECT * FROM '+name+' ORDER BY rowid ASC'),
   env.DB.prepare('SELECT COUNT(*) AS total FROM '+name)
  ]);
  const results=await env.DB.batch(queries);
  if(!Array.isArray(results)||results.length!==queries.length)throw Error('Backup query incomplete');
  const tables={},counts={};
  for(let i=0;i<BACKUP_TABLES.length;i++){
   const name=BACKUP_TABLES[i],rows=results[i*2]?.results||[];
   const total=Number(results[i*2+1]?.results?.[0]?.total);
   if(!Number.isSafeInteger(total)||rows.length!==total)throw Error('Backup verification failed: '+name);
   tables[name]=rows;counts[name]=total;
  }
  return reply({
   format:'nawaz-cms-owner-export',
   schema_version:1,
   exported_at:new Date().toISOString(),
   source:'nawaz_site_content',
   note:'Private content export for recovery. Does not include visitor logs, Cloudflare account secrets, or the live GitHub Pages HTML files. Restore requires migration and verification; importing this JSON directly is not supported.',
   counts,
   tables
  },200,true);
 }catch(e){
  console.error('CMS backup export failed',e?.name||'unknown');
  return reply({error:'Backup could not be verified. No incomplete file was exported.'},503);
 }
}