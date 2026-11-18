# Private CMS backup verification (offline)

The original public HTML site remains unchanged. This process is for the owner-only Cloudflare D1 content backup; it is **not** a database restore.

1. Sign in through Cloudflare Access at the existing private admin dashboard.
2. Download the JSON backup using the **Download backup** button. Save it outside your public website and GitHub repository.
3. On your own computer, run:

   `node tools/verify-cms-backup.mjs /private/path/nawaz-cms-backup-YYYY-MM-DD.json`

4. A PASS confirms the recognized format, timestamp, all ten expected table exports, row counts, row structure and duplicate primary-key absence. If it fails, do not attempt recovery with that file; download a fresh backup and investigate.

## Limits and recovery rules

- Never upload a real backup to GitHub, CI, a public URL, or this chat.
- This verifier intentionally does **not** run imports or touch production D1. It also cannot prove the file is authentic, that linked files/media are present, that the database is internally consistent, or that a restore will succeed.
- A complete recovery also needs the original GitHub Pages files, Cloudflare Worker code, D1 migrations and environment settings. Secrets and visitor logs are **not** in this backup.
- Before any production restore, use a separate isolated D1 database to rehearse schema migration, import, article rendering, revisions and counts. Never overwrite a live D1 database just to test a backup.
- The private admin is still restricted to the owner through Cloudflare Access. Public users must not be able to download or import backups.
- CI uses synthetic sample data only and never downloads or stores an owner's backup.
