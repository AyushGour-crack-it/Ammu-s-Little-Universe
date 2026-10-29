# Connect the private diary backend

The site stays on Vercel. Supabase supplies the invite-only sign-in, private media bucket, and memory table. This first version uses the Supabase Free plan and enforces its 50 MB per-file upload limit in both the page and the bucket.

Think of Vercel as the place that serves the pages, and Supabase as the locked room behind them: it checks which two people may enter and stores the photos, videos, voice notes, and diary details.

## Create the free project

1. Create a Supabase project on the Free plan and save the database password somewhere private.
2. In **Authentication → Users**, invite your email and Ammu’s email. The site only accepts existing users; it cannot create new accounts from the public sign-in page. In **Authentication → Sign In / Providers** (wording can vary), turn off public sign-ups if that setting is available.
3. In **SQL Editor**, run [`diary-schema.sql`](diary-schema.sql). It creates the private `diary-media` bucket, the memory table, and access policies.
4. Still in the SQL Editor, add the two invited accounts to the diary. Replace the example addresses with the addresses you invited; keep them in the Supabase dashboard rather than sharing them in chat:

   ```sql
   insert into public.diary_members (user_id)
   select id from auth.users
   where email in ('your-email@example.com', 'ammus-email@example.com')
   on conflict (user_id) do nothing;
   ```

5. In **Project Settings → API**, copy the Project URL and the **publishable** key (or legacy `anon` key) into [`../diary-config.js`](../diary-config.js).
6. Set the deployed Vercel URL as the **Site URL**, and add it to **Authentication → URL Configuration → Redirect URLs**. Add `http://localhost:8000/**` too if you preview it with a local static server.
7. Deploy the folder to Vercel. Open `archive.html`, request a sign-in link, then open the email link in the same browser.

## Keep the archive private

- Never put a Supabase secret or `service_role` key in the website. Only the publishable key belongs in `diary-config.js`.
- Keep the bucket private and keep row-level security enabled. The SQL sets both up.
- The app checks membership before it reads the diary or starts an upload. Signed file URLs expire after one hour.
- The free plan allows files up to 50 MB and up to 1 GB of stored files. Free projects can pause after a week of low activity; Supabase emails the owner before pausing. The account owner can resume a paused project in Supabase Studio.

## What an upload does

The uploader sends a file to the private bucket, then creates a row containing its category, title, date, caption, filename, and storage path. If the row cannot be saved, the page removes the just-uploaded file so it does not leave an orphan. The diary reads those rows, obtains short-lived private URLs, and renders the files in the designed cards and large-view frames.
