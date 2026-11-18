import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import {handleSiteAPI} from '../workers/admin/site-api.js';
import {handleBackup} from '../workers/admin/backup-api.js';
const db=new DatabaseSync(':memory:');
db.exec("CREATE TABLE site_page_versions(page_path TEXT PRIMARY KEY,version INTEGER NOT NULL DEFAULT 0,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);"+
"CREATE TABLE site_blocks(page_path TEXT NOT NULL,block_key TEXT NOT NULL,label TEXT NOT NULL,kind TEXT NOT NULL,original_text TEXT NOT NULL,draft_text TEXT NOT NULL,published_text TEXT NOT NULL DEFAULT '',published_override INTEGER NOT NULL DEFAULT 0,updated_at TEXT DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(page_path,block_key));"+
"CREATE TABLE site_settings(key TEXT PRIMARY KEY,label TEXT NOT NULL,original_json TEXT NOT NULL,draft_json TEXT NOT NULL,published_json TEXT NOT NULL,published_override INTEGER NOT NULL DEFAULT 0,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);"+
"CREATE TABLE site_revisions(id INTEGER PRIMARY KEY AUTOINCREMENT,page_path TEXT NOT NULL,snapshot TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP);"+
"CREATE TABLE articles(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT);"+
"CREATE TABLE article_revisions(id INTEGER PRIMARY KEY AUTOINCREMENT,snapshot TEXT);"+
"CREATE TABLE site_documents(page_path TEXT PRIMARY KEY,draft_json TEXT,published_json TEXT);"+
"CREATE TABLE site_builder_revisions(id INTEGER PRIMARY KEY AUTOINCREMENT,snapshot TEXT);"+
"CREATE TABLE site_design(key TEXT PRIMARY KEY,draft_json TEXT,published_json TEXT);"+
"CREATE TABLE site_media(id INTEGER PRIMARY KEY AUTOINCREMENT,url TEXT,label TEXT);"+
"INSERT INTO site_page_versions(page_path,version) VALUES('/index.html',0),('settings',0);"+
"INSERT INTO site_blocks(page_path,block_key,label,kind,original_text,draft_text,published_text,published_override) VALUES('/index.html','main_headline','Main heading','title','Original headline','Original headline','',0);"+
"INSERT INTO site_blocks(page_path,block_key,label,kind,original_text,draft_text,published_text,published_override) VALUES('/index.html','hero_intro','Intro','text','Original introduction','Original introduction','',0);"+
'INSERT INTO site_settings(key,label,original_json,draft_json,published_json,published_override) VALUES('+"'footer_tagline','Footer tagline','\"Original\"','\"Original\"','\"Original\"',0);"+
"INSERT INTO articles(title) VALUES('Original educational guide');");
function prepared(sql){
 return {sql,args:[],
  bind(...args){this.args=args;return this;},
  async all(){return {results:db.prepare(sql).all(...this.args)};},
  async first(){return db.prepare(sql).get(...this.args)||null;},
  async run(){return db.prepare(sql).run(...this.args);}
 };
}
const env={DB:{
 prepare:prepared,
 async batch(queries){
  const out=[];db.exec('BEGIN IMMEDIATE');
  try{
   for(const {sql,args} of queries){
    const statement=db.prepare(sql);
    if(/^\s*SELECT\b/i.test(sql)){out.push({results:statement.all(...args),meta:{changes:0}});}
    else {const status=statement.run(...args);out.push({results:[],meta:{changes:Number(status.changes)}});}
   }
   db.exec('COMMIT');return out;
  }catch(e){db.exec('ROLLBACK');throw e;}
 }
}};
const base='https://cms-private.example';
function get(path){return new Request(base+path,{method:'GET'});}
function post(path,value,origin=base){
 return new Request(base+path,{method:'POST',headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','Content-Type':'application/json'},body:JSON.stringify(value)});
}
async function parse(r){return r.json();}
let r=await handleSiteAPI(get('/admin/api/site/pages?page=%2Findex.html'),env);
assert.equal(r.status,200);assert.equal((await parse(r)).version,0,'initial editor version');
const draft={page_path:'/index.html',intent:'draft',expected_version:0,values:{main_headline:'New draft headline',hero_intro:'New draft intro'}};
r=await handleSiteAPI(post('/admin/api/site/pages',draft),env);
assert.equal(r.status,200);assert.equal((await parse(r)).version,1);
let title=db.prepare("SELECT draft_text,published_text,published_override FROM site_blocks WHERE block_key='main_headline'").get();
assert.equal(title.draft_text,'New draft headline');
assert.equal(title.published_text,'');assert.equal(title.published_override,0,'draft is private');
r=await handleSiteAPI(post('/admin/api/site/pages',{...draft,intent:'publish'}),env);
assert.equal(r.status,409,'stale tab blocked');
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM site_revisions').get().n,1,'rejected save does not create revision');
assert.equal(db.prepare("SELECT published_override FROM site_blocks WHERE block_key='main_headline'").get().published_override,0,'stale publish does not alter public content');
r=await handleSiteAPI(post('/admin/api/site/pages',{...draft,intent:'publish',expected_version:1}),env);
assert.equal(r.status,200);assert.equal((await parse(r)).version,2);
title=db.prepare("SELECT draft_text,published_text,published_override FROM site_blocks WHERE block_key='main_headline'").get();
assert.equal(title.published_text,'New draft headline');assert.equal(title.published_override,1);
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM site_revisions').get().n,2);
r=await handleSiteAPI(post('/admin/api/site/pages',{...draft,expected_version:2,values:{main_headline:'More private changes',hero_intro:'Private second draft'}}),env);
assert.equal(r.status,200);assert.equal((await parse(r)).version,3);
assert.equal(db.prepare("SELECT published_text FROM site_blocks WHERE block_key='main_headline'").get().published_text,'New draft headline','draft after publish does not alter live snapshot');
r=await handleSiteAPI(post('/admin/api/site/pages',{...draft,expected_version:3},'https://attacker.example'),env);
assert.equal(r.status,403);
r=await handleSiteAPI(get('/admin/api/site/settings'),env);
assert.equal((await parse(r)).version,0);
const setting={page_path:'settings',intent:'draft',expected_version:0,values:{footer_tagline:'Private footer draft'}};
r=await handleSiteAPI(post('/admin/api/site/settings',setting),env);
assert.equal(r.status,200);assert.equal((await parse(r)).version,1);
assert.equal(db.prepare("SELECT published_json FROM site_settings WHERE key='footer_tagline'").get().published_json,'"Original"');
r=await handleSiteAPI(post('/admin/api/site/settings',{...setting,intent:'publish'}),env);
assert.equal(r.status,409,'stale settings blocked');
r=await handleSiteAPI(post('/admin/api/site/settings',{...setting,intent:'publish',expected_version:1}),env);
assert.equal(r.status,200);
assert.equal(db.prepare("SELECT published_json FROM site_settings WHERE key='footer_tagline'").get().published_json,'"Private footer draft"');
const b=await handleBackup(get('/admin/api/backup'),env);
assert.equal(b.status,200,'owner backup exported');
assert.ok(b.headers.get('content-disposition').includes('attachment; filename="nawaz-cms-backup-'));
assert.equal(b.headers.get('cache-control'),'private, no-store, max-age=0');
const backup=await parse(b);
assert.equal(backup.tables.articles.length,1);
assert.equal(backup.tables.site_blocks.length,2);
assert.equal(backup.tables.site_revisions.length,5);
assert.equal(backup.counts.site_page_versions,2);
assert.ok(!Object.hasOwn(backup.tables,'visitor_logs'));
assert.ok(!Object.hasOwn(backup.tables,'secrets'));
const main=fs.readFileSync(new URL('../workers/admin/worker.js',import.meta.url),'utf8');
assert.ok(main.indexOf('if(!(await owner(ctx)))')<main.indexOf("path==='/admin/api/backup'"),'Cloudflare Access must guard backup route');
console.log('PASS: draft isolation, publish snapshots, version conflicts, revisions, same-origin security and private backups');
