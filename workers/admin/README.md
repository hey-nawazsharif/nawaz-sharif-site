# Admin Worker (locked by default)

The admin Worker source is in workers/admin/worker.js and is not intended to run without Cloudflare Zero Trust Access.

Cloudflare Access is currently disabled on the account. The Worker code denies every request unless the Workers runtime provides ctx.access.getIdentity() and the identity email exactly matches the site owner. No password or shared secret is embedded in the client.

Required next steps:
1. Enable the Cloudflare Zero Trust Free plan in the owner's Cloudflare dashboard.
2. Create an owner-only Cloudflare Access policy and attach it directly to the admin Worker. Do not apply Access to the public read-only API Worker.
3. Deploy the admin Worker with the same content D1 binding named DB, then enable only its protected workers.dev hostname.
4. Verify unauthenticated requests always return 403; verify the authenticated owner can read/update article metadata.
5. The form edits article metadata and publishing flags only. HTML article bodies remain in GitHub Pages until the later content migration.

Keep production root DNS, existing private visitor-log Worker and its D1 database unchanged. Costs are subject to Free plan limits.
