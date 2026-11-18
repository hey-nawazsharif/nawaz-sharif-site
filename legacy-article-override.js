/* Optional content replacement for original HTML guides.
 * Original GitHub Pages markup remains the fallback until approved override is enabled.
 */
(function(){
 'use strict';
 var path=decodeURIComponent(window.location.pathname);
 var slug=path.replace(/^\/|\/$/g,'').replace(/\.html$/i,'');
 if(!/^[a-zA-Z0-9_-]{1,110}$/.test(slug))return;
 var main=document.getElementById('main');
 if(!main)return;
 var controller=new AbortController();
 var timeout=setTimeout(function(){controller.abort();},5500);
 fetch('https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/overrides/'+encodeURIComponent(slug),{
  mode:'cors',credentials:'omit',headers:{'Accept':'application/json'},signal:controller.signal
 }).then(function(r){if(!r.ok)throw Error('Override unavailable');return r.json();}).then(function(data){
  if(!data||data.active!==true||typeof data.html!=='string'||data.html.length<180)return;
  // API HTML is escaped Markdown. Do not accept script or arbitrary HTML in the editor.
  var article=document.createElement('article');
  article.className='post';
  var header=document.createElement('header');header.className='post-header';
  var eyebrow=document.createElement('p');eyebrow.className='meta';
  eyebrow.textContent='Technical article · Nawaz Sharif';
  var heading=document.createElement('h1');
  heading.textContent=typeof data.title==='string'?data.title:'Technical article';
  header.appendChild(eyebrow);header.appendChild(heading);
  article.appendChild(header);
  if(typeof data.summary==='string'&&data.summary){
   var lead=document.createElement('p');lead.className='lead';lead.textContent=data.summary;article.appendChild(lead);
  }
  if(typeof data.cover_url==='string'&&/^https:\/\//.test(data.cover_url)){
   var image=document.createElement('img');image.src=data.cover_url;image.alt='';image.loading='lazy';image.className='legacy-cover';article.appendChild(image);
  }
  var content=document.createElement('div');
  content.className='legacy-replacement';
  content.innerHTML=data.html;
  article.appendChild(content);
  var returnLink=document.createElement('p');
  var a=document.createElement('a');a.href='/articles.html';a.textContent='← All technical articles';
  returnLink.appendChild(a);article.appendChild(returnLink);
  main.className='wrap doc';
  main.replaceChildren(article);
  if(data.seo_title||data.title)document.title=(data.seo_title||data.title)+' | Nawaz Sharif';
  var meta=document.querySelector('meta[name="description"]');
  if(meta&&typeof(data.seo_description||data.summary)==='string')meta.content=data.seo_description||data.summary;
 }).catch(function(){/* Original HTML remains fully available without API. */})
 .finally(function(){clearTimeout(timeout);});
})();