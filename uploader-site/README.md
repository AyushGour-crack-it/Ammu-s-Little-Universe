# Our Little Diary Uploader

This folder is a standalone, self-contained website dedicated to adding memories to the private diary. It can be deployed as its own Vercel project with this folder as the project root, or copied into its own GitHub repository.

## Connect it to the diary

1. Follow the parent project's [`backend/SETUP.md`](../backend/SETUP.md) to create the shared Supabase project and apply its SQL schema.
2. Put the same Supabase project URL and publishable key used by the main diary in this folder's `diary-config.js`.
3. Set `archiveUrl` to the main site's `archive.html` URL.
4. Add this site's Vercel URL to the Supabase Auth redirect allowlist.

Only use the Supabase publishable key here. Never add a secret or `service_role` key. Members sign in separately on each site because their browser sessions are kept per-site.
