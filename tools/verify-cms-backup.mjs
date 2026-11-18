/**
 * Offline verification for the private /admin/api/backup JSON export.
 * It never connects to Cloudflare and never writes or restores a database.
 * Keep this schema in sync with workers/admin/backup-api.js.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const BACKUP_TABLES = Object.freeze([
  'articles', 'article_revisions', 'site_blocks', 'site_settings',
  'site_page_versions', 'site_revisions', 'site_documents',
  'site_builder_revisions', 'site_design', 'site_media'
]);

// Duplicate primary keys are unsafe to restore. Empty tables are permitted.
const PRIMARY_KEYS = Object.freeze({
  articles: ['id'], article_revisions: ['id'],
  site_blocks: ['page_path', 'block_key'], site_settings: ['key'],
  site_page_versions: ['page_path'], site_revisions: ['id'],
  site_documents: ['page_path'], site_builder_revisions: ['id'],
  site_design: ['key'], site_media: ['id']
});

const isObject = value => value !== null && typeof value === 'object' &&
  !Array.isArray(value);

export function verifyCmsBackup(document) {
  const errors = [];
  const summary = { tableCount: 0, rowCount: 0, counts: {} };
  if (!isObject(document)) return { ok: false, errors: ['Backup must be a JSON object'], summary };

  if (document.format !== 'nawaz-cms-owner-export') errors.push('Unrecognized backup format');
  if (document.schema_version !== 1) errors.push('Unsupported backup schema version');
  if (document.source !== 'nawaz_site_content') errors.push('Unexpected database source');
  const date = document.exported_at;
  if (typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(date) ||
      !Number.isFinite(Date.parse(date))) errors.push('Invalid export timestamp');
  if (!isObject(document.tables)) errors.push('Missing tables object');
  if (!isObject(document.counts)) errors.push('Missing counts object');
  if (errors.includes('Missing tables object') || errors.includes('Missing counts object')) {
    return { ok: false, errors, summary };
  }

  for (const key of Object.keys(document.tables)) {
    if (!BACKUP_TABLES.includes(key)) errors.push('Unexpected table: ' + key);
  }
  for (const key of Object.keys(document.counts)) {
    if (!BACKUP_TABLES.includes(key)) errors.push('Unexpected count: ' + key);
  }
  for (const name of BACKUP_TABLES) {
    const rows = document.tables[name];
    const count = document.counts[name];
    if (!Array.isArray(rows)) { errors.push('Missing or invalid table: ' + name); continue; }
    if (!Number.isSafeInteger(count) || count < 0) {
      errors.push('Missing or invalid row count: ' + name);
    } else if (rows.length !== count) {
      errors.push('Row count mismatch: ' + name);
    }
    summary.tableCount++;
    summary.rowCount += rows.length;
    summary.counts[name] = rows.length;
    const seen = new Set();
    const fields = PRIMARY_KEYS[name];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!isObject(row)) { errors.push('Invalid row object: ' + name + '[' + i + ']'); continue; }
      if (fields.some(field => row[field] === null || row[field] === undefined ||
          (typeof row[field] !== 'number' && typeof row[field] !== 'string'))) {
        errors.push('Invalid primary key: ' + name + '[' + i + ']');
        continue;
      }
      const primaryKey = JSON.stringify(fields.map(field => row[field]));
      if (seen.has(primaryKey)) errors.push('Duplicate primary key: ' + name + '[' + i + ']');
      seen.add(primaryKey);
    }
  }
  return { ok: errors.length === 0, errors, summary };
}

// Local-only CLI. Do not commit private exports to GitHub or share them publicly.
const calledDirectly = process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (calledDirectly) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node tools/verify-cms-backup.mjs /private/path/backup.json');
    process.exitCode = 2;
  } else {
    try {
      const json = JSON.parse(await readFile(file, 'utf8'));
      const result = verifyCmsBackup(json);
      if (!result.ok) {
        console.error('FAIL: CMS backup verification');
        for (const error of result.errors) console.error('- ' + error);
        process.exitCode = 1;
      } else {
        console.log('PASS: ' + result.summary.tableCount + ' tables, ' + result.summary.rowCount + ' rows verified offline');
        console.log('This checks structure, counts and duplicate keys; it does not restore data or verify Cloudflare configuration.');
      }
    } catch (error) {
      console.error('FAIL: Backup could not be read or parsed (' + (error?.name || 'Error') + ')');
      process.exitCode = 1;
    }
  }
}
