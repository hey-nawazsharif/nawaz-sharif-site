/* Searchable article archive with no-JavaScript / offline fallback. */
(function () {
 'use strict';
 var input=document.getElementById('archive-search-input');
 var status=document.getElementById('archive-search-status');
 var liveGrid=document.getElementById('dynamic-article-grid');
 var staticGrid=document.getElementById('static-article-grid');
 if(!input||!status||!liveGrid||!staticGrid)return;
 var list=null;
 var archivedCards=Array.prototype.slice.call(staticGrid.querySelectorAll('.card'));
 function matches(text){return text.toLocaleLowerCase().includes(input.value.trim().toLocaleLowerCase());}
 function element(tag,className,content){var e=document.createElement(tag);if(className)e.className=className;if(content!==undefined)e.textContent=content;return e;}
 function draw(){
  if(list){
   var shown=0,fragment=document.createDocumentFragment();
   list.forEach(function(article){
    if(!matches(article.title+' '+article.summary+' '+article.category))return;
    shown++;
    var card=element('div','card'),link=element('a');
    link.href=article.url;
    link.appendChild(element('span','category',article.category||'Technology'));
    link.appendChild(element('h3','',article.title.replace(/\s*\|\s*Nawaz Sharif\s*$/i,'')));
    link.appendChild(element('p','',article.summary||'Read the full guide.'));
    card.appendChild(link);fragment.appendChild(card);
   });
   liveGrid.replaceChildren(fragment);
   status.textContent=shown+' article'+(shown===1?'':'s')+' found';
   return;
  }
  var count=0;archivedCards.forEach(function(card){var visible=matches(card.textContent);card.hidden=!visible;if(visible)count++;});
  status.textContent=count+' article'+(count===1?'':'s')+' found';
 }
 input.addEventListener('input',draw);
 var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},7000);
 fetch('https://nawaz-site-api.nawaz-site-observer.workers.dev/api/v1/articles?limit=50',{
  mode:'cors',credentials:'omit',signal:controller.signal,headers:{'Accept':'application/json'}
 }).then(function(r){if(!r.ok)throw Error('API unavailable');return r.json();}).then(function(body){
  if(!body||!Array.isArray(body.articles)||!body.articles.length)throw Error('No articles');
  list=body.articles.filter(function(a){return a&&typeof a.title==='string'&&typeof a.url==='string'&&(/^\/[a-zA-Z0-9/_-]+\.html$/.test(a.url)||/^https:\/\/blog\.nawazsharif\.in\/[a-z0-9-]{3,100}$/.test(a.url));});
  if(!list.length)throw Error('No valid articles');
  staticGrid.hidden=true;liveGrid.hidden=false;draw();
 }).catch(function(){list=null;liveGrid.hidden=true;staticGrid.hidden=false;draw();})
 .finally(function(){clearTimeout(timer);});
})();