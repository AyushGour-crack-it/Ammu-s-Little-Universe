# Ammu’s Little Universe

A gift for her.

A responsive birthday website and private shared diary for Ammu. The site uses plain HTML, CSS, and JavaScript, so the pages can be served directly by Vercel without a build step.

## Pages

- `index.html` is the main website. Its **Our diary** link opens the separate diary page.
- `archive.html` is the invite-only diary. It shows memories uploaded from `upload.html` in designed cards and custom framed detail views.
- `upload.html` is the separate uploader. Uploaded media and diary details are saved to the same private Supabase project used by the archive.
- `archive-preview.html` and `upload-preview.html` are visual previews with sample content. They do not save or upload files.
- `preview.html` is an earlier visual preview of the main site.

To preview locally, open `index.html`, `archive-preview.html`, or `upload-preview.html` in a browser. The production diary and uploader require the backend setup below.

## Connect private uploads

Follow [`backend/SETUP.md`](backend/SETUP.md) to create the free Supabase project, invite both diary members, apply the private storage policies, and set `diary-config.js`. The 50 MB per-file limit is enforced in the app and the private storage bucket.

Only place the Supabase project URL and publishable key in `diary-config.js`. Never commit a Supabase secret or `service_role` key.

## Personalize it

- The six photos are in `assets/photos/`; swap them or edit captions in `index.html` as you like.
- The three distinct photo booth strips from October 19 are in `assets/photobooth/`.
- The first-message star chart image is in `assets/stars/` and is credited in the page.
- The song cover is in `assets/media/ammus-song-cover.mp4`; Ammu’s five Hindi-lyrics voice notes are in `assets/audio/`.
- Five Hindi-lyrics clips and three personal voice notes are in `assets/audio/` and linked from the listening cards.
- Edit the timeline and letter copy in `index.html` with any more dates or memories.
- Adjust colors, type, and motion in `styles.css`.
- The envelope interaction, mobile menu, and scroll reveals are in `script.js`.

The site contains personal photos, videos, and voice recordings in `assets/`. Keep this GitHub repository private unless you are comfortable making those files public. The diary’s later cloud uploads stay in its private Supabase bucket and are not added to the repository.
