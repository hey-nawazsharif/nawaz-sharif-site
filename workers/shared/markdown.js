/* Conservative Markdown subset. Raw HTML is always escaped, links are protocol checked. */
export function escapeHTML(v) {
 return String(v===undefined||v===null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;')
 .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
export function safeURL(input,image) {
 const s=String(input||'').trim();
 if(s.length>1500||/[\x00-\x20\x7F<>"]/g.test(s))return '';
 if(!image&&/^\/(?!\/)[a-zA-Z0-9_./?#=&%+-]*$/.test(s))return s;
 try {
  const u=new URL(s);
  if(u.protocol==='https:' || (!image && (u.protocol==='http:' || u.protocol==='mailto:')))return u.href;
 } catch(e){}
 return '';
}
export function inline(text) {
 const tokens=[];
 function token(html) {const i=tokens.push(html)-1;return '\uE000'+i+'\uE001';}
 let s=String(text||'');
 s=s.replace(/!\[([^\]\n]{0,180})\]\(([^)\s]{1,1500})\)/g,function(all,alt,src){
  const url=safeURL(src,true);
  return url?token('<img loading="lazy" decoding="async" alt="'+escapeHTML(alt)+'" src="'+escapeHTML(url)+'">'):all;
 });
 s=s.replace(/\[([^\]\n]{1,180})\]\(([^)\s]{1,1500})\)/g,function(all,label,src){
  const url=safeURL(src,false);
  return url?token('<a href="'+escapeHTML(url)+'" rel="noopener noreferrer">'+escapeHTML(label)+'</a>'):all;
 });
 s=s.replace(/\x60([^\x60\n]{1,300})\x60/g,function(all,code){return token('<code>'+escapeHTML(code)+'</code>');});
 s=escapeHTML(s);
 s=s.replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
 s=s.replace(/__([^_\n]+)__/g,'<strong>$1</strong>');
 s=s.replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
 return s.replace(/\uE000(\d+)\uE001/g,function(all,n){return tokens[Number(n)]||'';});
}
export function renderMarkdown(markdown) {
 const lines=String(markdown||'').slice(0,100000).replace(/\r\n?/g,'\n').split('\n');
 const blocks=[];let para=[],list=[],listKind='',code=[],fenced=false;
 function flushPara(){if(para.length){blocks.push('<p>'+inline(para.join(' '))+'</p>');para=[];}}
 function flushList(){if(list.length){blocks.push('<'+listKind+'>'+list.map(x=>'<li>'+inline(x)+'</li>').join('')+'</'+listKind+'>');list=[];listKind='';}}
 function flushCode(){blocks.push('<pre><code>'+escapeHTML(code.join('\n'))+'</code></pre>');code=[];}
 for(const raw of lines){
  const line=raw.replace(/\t/g,'    ');
  if(/^\s*\x60\x60\x60/.test(line)){flushPara();flushList();if(fenced)flushCode();fenced=!fenced;continue;}
  if(fenced){code.push(raw);continue;}
  if(!line.trim()){flushPara();flushList();continue;}
  const heading=line.match(/^(#{1,4})\s+(.+)$/);
  if(heading){flushPara();flushList();const level=Math.min(5,heading[1].length+1);blocks.push('<h'+level+'>'+inline(heading[2])+'</h'+level+'>');continue;}
  if(/^\s*(?:---|\*\*\*)\s*$/.test(line)){flushPara();flushList();blocks.push('<hr>');continue;}
  const quote=line.match(/^>\s?(.*)$/);
  if(quote){flushPara();flushList();blocks.push('<blockquote><p>'+inline(quote[1])+'</p></blockquote>');continue;}
  const bullet=line.match(/^\s*[-*+]\s+(.+)$/),ordered=line.match(/^\s*\d+[.)]\s+(.+)$/);
  if(bullet||ordered){flushPara();const kind=bullet?'ul':'ol';if(list.length&&listKind!==kind)flushList();listKind=kind;list.push((bullet||ordered)[1]);continue;}
  flushList();para.push(line.trim());
 }
 if(fenced)flushCode();flushPara();flushList();
 return blocks.join('\n');
}
