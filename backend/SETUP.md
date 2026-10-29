# Connect the private diary backend

The site stays on Vercel. Supabase supplies the invite-only sign-in, private media bucket, and memory table. This first version uses the Supabase Free plan and enforces its 50 MB per-file upload limit in both the page and the bucket.

Think of Vercel as the place that serves the pages, and Supabase as the locked room behind them: it checks which two people may enter and stores the photos, videos, voice notes, and diary details.

## Create the free project

1. Create a Supabase project on the Free plan and save the database password somewhere private.
2. In **Authentication → Users**, invite your email and Ammu’s email. The site only accepts existing users; it cannot create new accounts from the public sign-in page. In **Authentication → Sign In / Providers** (wording can vary), turn off public sign-ups if that setting is available.
3. In **SQL Editor**, run [`diary-schema.sql`](diary-schema.sql). It creates the private `diary-media` bucket, the memory table, and access policies.
4. In the SQL Editor, also run [`migrations/20261029_memories_diary_order.sql`](migrations/20261029_memories_diary_order.sql). This adds the ordering index used to keep the chapter and spread queries efficient as the diary grows. It is safe to run again.
5. Still in the SQL Editor, add the two invited accounts to the diary. Replace the example addresses with the addresses you invited; keep them in the Supabase dashboard rather than sharing them in chat:

   ```sql
   insert into public.diary_members (user_id)
   select id from auth.users
   where email in ('your-email@example.com', 'ammus-email@example.com')
   on conflict (user_id) do nothing;
   ```

6. In **Project Settings → API**, copy the Project URL and **publishable** key (or legacy `anon` key) into [`../diary-config.js`](../diary-config.js) and [`diary-config.js` in the separate uploader repository](https://github.com/AyushGour-crack-it/Our-Memories-Uploader/blob/main/diary-config.js). The publishable key is okay in browser code when these RLS policies are applied.
7. Deploy the main website from this repository's root, then deploy the uploader from its separate GitHub repository as a second Vercel project.
8. Set the main site's `archive.html` URL as `archiveUrl` in the uploader repo's config and the uploader's deployed URL as `uploaderUrl` in the main [`../diary-config.js`](../diary-config.js).
9. Set the main site's deployed URL as the Supabase **Site URL**, and add both the main-site and uploader-site URLs to **Authentication → URL Configuration → Redirect URLs**. Add `http://localhost:8000/**` too for local preview.
10. Open `archive.html`, request a sign-in link, and open the email link in the same browser. Sign in separately on the uploader site with an invited account; both sites use the same private bucket and memory table.

## Keep the archive private

- Never put a Supabase secret or `service_role` key in the website. Only the publishable key belongs in `diary-config.js`.
- Keep the bucket private and keep row-level security enabled. The SQL sets both up.
- The app checks membership before it reads the diary or starts an upload. It loads a lightweight index for chapter counts, fetches only the current spread's media, and refreshes a file's signed URL when you open it. URLs expire after one hour.
- The free plan allows files up to 50 MB and up to 1 GB of stored files. Free projects can pause after a week of low activity; Supabase emails the owner before pausing. The account owner can resume a paused project in Supabase Studio.

## What an upload does

The uploader sends a file to the private bucket, then creates a row containing its category, title, date, caption, filename, and storage path. If the row cannot be saved, the page removes the just-uploaded file so it does not leave an orphan. The diary reads those rows, obtains short-lived private URLs, and renders the files in the designed cards and large-view frames.
