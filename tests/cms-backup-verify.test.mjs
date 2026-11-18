import assert from 'node:assert/strict';
import { BACKUP_TABLES, verifyCmsBackup } from '../tools/verify-cms-backup.mjs';

function example() {
  const tables = Object.fromEntries(BACKUP_TABLES.map(name => [name, []]));
  tables.articles = [{ id: 1, slug: 'linux-notes', title: 'Linux notes' }];
  tables.site_blocks = [{ page_path: '/index.html', block_key: 'hero-title', draft_text: 'Private draft' }];
  tables.site_page_versions = [{ page_path: '/index.html', version: 2 }];
  return {
    format: 'nawaz-cms-owner-export', schema_version: 1,
    source: 'nawaz_site_content', exported_at: '2026-11-18T15:00:00.000Z',
    counts: Object.fromEntries(BACKUP_TABLES.map(name => [name, tables[name].length])), tables
  };
}
function rejects(mutator, fragment) {
  const backup = example();
  mutator(backup);
  const result = verifyCmsBackup(backup);
  assert.equal(result.ok, false, 'Corrupt backup should fail: ' + fragment);
  assert.ok(result.errors.some(error => error.includes(fragment)), result.errors.join(', '));
}
const good = verifyCmsBackup(example());
assert.equal(good.ok, true, good.errors.join(', '));
assert.equal(good.summary.tableCount, 10);
assert.equal(good.summary.rowCount, 3);
rejects(b => { delete b.tables.site_blocks; }, 'Missing or invalid table: site_blocks');
rejects(b => { b.counts.articles = 5; }, 'Row count mismatch: articles');
rejects(b => { b.tables.visitor_logs = []; }, 'Unexpected table: visitor_logs');
rejects(b => { b.counts.credentials = 0; }, 'Unexpected count: credentials');
rejects(b => { b.tables.articles.push({ id: 1, slug: 'copy' }); b.counts.articles++; }, 'Duplicate primary key');
rejects(b => { b.tables.site_blocks[0].block_key = null; }, 'Invalid primary key');
rejects(b => { b.tables.articles[0] = null; }, 'Invalid row object');
rejects(b => { b.schema_version = 2; }, 'Unsupported backup schema');
rejects(b => { b.exported_at = 'invalid'; }, 'Invalid export timestamp');
rejects(b => { b.source = 'nawaz_site_visitor_logs'; }, 'Unexpected database source');
assert.equal(verifyCmsBackup(null).ok, false);
console.log('PASS: offline CMS backup structure, completeness and corruption checks');
