/* Safe, no-dependency visual section renderer. Raw HTML is never accepted. */
import {renderMarkdown, escapeHTML, safeURL} from './markdown.js';
export const SECTION_TYPES = new Set(['text','image','cta','quote','divider','columns']);
export const MAX_SECTIONS=20;
const LINK=/^\/(?!\/)[a-zA-Z0-9_./#?=&%-]*$/;
function url(v,image=false){
 const s=String(v||'').trim();
 if(image)return safeURL(s,true);
 if(LINK.test(s)&&s.length<=240)return s;
 try{const u=new URL(s);if(u.protocol==='https:'&&!u.username&&!u.password&&s.length<=1200)return s;}catch(e){}
 return '';
}
export function validateSections(sections){
 if(!Array.isArray(sections)||sections.length>MAX_SECTIONS)return {error:'Maximum 20 sections per page'};
 const ids=new Set(),out=[];
 for(const x of sections){
  if(!x||typeof x!=='object'||Array.isArray(x)||!SECTION_TYPES.has(x.type))return {error:'Invalid section type'};
  if(typeof x.id!=='string'||!/^[a-z0-9-]{6,50}$/.test(x.id)||ids.has(x.id))return {error:'Invalid or duplicate section identifier'};
  ids.add(x.id);
  const item={id:x.id,type:x.type};
  for(const [key,limit] of Object.entries({title:160,body:6000,image_url:1500,image_alt:180,button_label:70,button_url:1200})){
   if(x[key]!=null&&typeof x[key]!=='string')return {error:'Invalid '+key};
   item[key]=String(x[key]||'').trim();
   if(item[key].length>limit)return {error:key+' is too long'};
  }
  if(item.image_url&&!url(item.image_url,true))return {error:'Images require valid HTTPS URLs'};
  if(item.button_url&&!url(item.button_url))return {error:'Button links must be HTTPS or a website path'};
  if(x.position!=null&&x.position!=='top'&&x.position!=='bottom')return {error:'Invalid section position'};
  item.position=x.position==='top'?'top':'bottom';
  if(item.type==='cta'&&!item.title)return {error:'CTA requires a title'};
  if(item.type==='image'&&!item.image_url)return {error:'Image section requires a picture URL'};
  out.push(item);
 }
 return {sections:out};
}
const css=String.raw`
.cms-builder{--cms-ink:#1b3327;--cms-accent:#28734b;--cms-paper:#f3f7f2;color:var(--cms-ink);padding:38px max(18px,calc((100vw - 1100px)/2));font-family:inherit}
.cms-builder.cms-slate{--cms-accent:#486780;--cms-paper:#f0f4f7;--cms-ink:#263848}
.cms-builder.cms-sand{--cms-accent:#956e41;--cms-paper:#faf5eb;--cms-ink:#44362c}
.cms-builder.cms-compact{padding-top:20px;padding-bottom:20px}
.cms-section{max-width:1070px;margin:24px auto 42px;line-height:1.75;overflow-wrap:anywhere}
.cms-builder.cms-compact .cms-section{margin:18px auto 24px}
.cms-section h2{font-size:clamp(23px,3.3vw,35px);letter-spacing:-.03em;line-height:1.25;margin:0 0 15px;color:var(--cms-ink)}
.cms-section p{margin:13px 0}.cms-section a{color:var(--cms-accent)}
.cms-section .cms-body{max-width:760px}
.cms-section .cms-photo{width:100%;max-height:510px;object-fit:contain;border-radius:5px;display:block;margin:0 auto}
.cms-section.cms-image{display:grid;grid-template-columns:1.1fr 1fr;align-items:center;gap:27px}
.cms-section.cms-image .cms-image-copy{min-width:0}
.cms-section.cms-callout{background:var(--cms-paper);border:1px solid #d4e2d7;padding:clamp(20px,4vw,38px);border-radius:5px}
.cms-section.cms-quote{padding:23px 27px;border-left:4px solid var(--cms-accent);background:var(--cms-paper)}
.cms-section.cms-quote p{font-size:clamp(17px,2vw,21px);line-height:1.7}
.cms-section.cms-cols{display:grid;grid-template-columns:1fr 1fr;gap:32px}
.cms-section .cms-action{display:inline-flex;padding:11px 16px;border-radius:3px;text-decoration:none;background:var(--cms-accent);color:#fff;font-size:13px;font-weight:700;margin-top:10px}
.cms-section.cms-divider{height:1px;background:#b9c9bd;max-width:1070px}
.cms-section pre{overflow:auto;background:#101f19;color:#e7f0ec;padding:16px;border-radius:3px}
.cms-section img{max-width:100%;height:auto}
@media(max-width:760px){.cms-builder{padding:16px 17px}.cms-section.cms-image,.cms-section.cms-cols{grid-template-columns:1fr}.cms-section{margin:22px auto 32px}.cms-section .cms-photo{max-height:360px}}
`;
export function builderCSS(){return css;}
function action(s){
 const href=url(s.button_url);
 return href&&s.button_label?'<a class="cms-action" href="'+escapeHTML(href)+'" rel="noopener noreferrer">'+escapeHTML(s.button_label)+'</a>':'';
}
export function renderSectionHTML(x){
 const s=validateSections([x]);if(s.error)return '';
 const item=s.sections[0];const title=item.title?'<h2>'+escapeHTML(item.title)+'</h2>':'';
 const body=item.body?'<div class="cms-body">'+renderMarkdown(item.body)+'</div>':'';
 const button=action(item),img=item.image_url?'<img loading="lazy" decoding="async" class="cms-photo" alt="'+escapeHTML(item.image_alt||'')+'" src="'+escapeHTML(url(item.image_url,true))+'">':'';
 let inner='',kind='';
 switch(item.type){
  case 'text':inner=title+body+button;break;
  case 'image':inner='<div class="cms-image-copy">'+title+body+button+'</div>'+img;kind=' cms-image';break;
  case 'cta':inner=title+body+button;kind=' cms-callout';break;
  case 'quote':inner=title+'<blockquote>'+body+'</blockquote>';kind=' cms-quote';break;
  case 'divider':kind=' cms-divider';break;
  case 'columns':inner='<div>'+title+body+'</div><div>'+ (img||button)+'</div>';kind=' cms-cols';break;
 }
 return '<section class="cms-section'+kind+'" data-cms-section="'+escapeHTML(item.id)+'">'+inner+'</section>';
}
export function renderSections(items,design={}) {
 const r=validateSections(items);if(r.error)return '';
 const theme=['forest','slate','sand'].includes(design.theme)?design.theme:'forest';
 const spacing=design.spacing==='compact'?' cms-compact':'';
 const classes=theme==='forest'?'':' cms-'+theme;
 const top=r.sections.filter(x=>x.position==='top'),bottom=r.sections.filter(x=>x.position!=='top');
 return {top:top.length?'<div class="cms-builder'+classes+spacing+'" aria-label="Additional page content">'+top.map(renderSectionHTML).join('')+'</div>':'',
 bottom:bottom.length?'<div class="cms-builder'+classes+spacing+'" aria-label="Additional page content">'+bottom.map(renderSectionHTML).join('')+'</div>':''};
}
