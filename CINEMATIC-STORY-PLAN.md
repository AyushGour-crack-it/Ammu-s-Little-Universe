# Dear Ammu cinematic story — audit and preview plan

## Existing-site audit

- The production homepage is a static HTML/CSS/JavaScript PWA (`index.html`, `styles.css`, `script.js`). It already has the story timeline, the July 30 first-message date/time, the original first-message wording, the first-sky chart, personal portraits, photobooth strips, voice notes, a song-cover video, and the lily bouquet illustration.
- The private diary is a separate route (`archive.html`) and its Supabase sign-in, uploads, and media playback are implemented in the diary client files. The cinematic preview does not load those clients or touch diary data.
- The service worker caches the home shell and selected static artwork. It deliberately does not cache audio/video or private diary media. Keep that boundary in the finished PWA; any new public chapter artwork can be added explicitly after its size and offline behavior are reviewed.
- There are no existing GSAP, Rive, or Lottie integrations. `assets/media/ammus-song-cover.mp4` is part of the song card, not an ambient story environment. There is no generated cinematic background video in the current assets.
- The current home page is a long sequence of ordinary sections with reveal effects. The prototype experiments with one sticky, scroll-scrubbed chapter while preserving ordinary page scroll and a static-content fallback.

## Storyboard — six chapters

1. **The Beginning** — A quiet night-sky opening, then the verified July 30, 2026 · 12:48 PM first hello. A paper-plane line travels across the scene; tapping the message card reveals the existing first-message wording.
2. **How We Met** — Use only the existing timeline facts and approved first-message content. Stage them as a sequence of dated keepsakes; do not invent chat bubbles, dates, or dialogue.
3. **Two Cities, One Moon** — Ghaziabad and Chennai as two illustrated night horizons joined by a slow moving light. Use the existing first-sky chart and its current date/time/location metadata only where relevant.
4. **The Little Things** — Bring existing photos, photobooth strips, voice notes, and videos into framed keepsakes. Selecting an item opens its existing viewer/player; media ratios remain content-led and captions stay readable.
5. **Our Little Universe** — Rive character interaction is a later, approval-gated asset task. First agree on character designs using the user's chosen reference images; do not infer or fabricate character appearances.
6. **A Thousand More Moments** — Reuse the existing lily bouquet and birthday letter/copy. Let the bouquet bloom gently and end with a link into the existing diary.

### Existing homepage content mapped into the chapters

- The current hero, birthday countdown, and site navigation become the opening/wayfinding layer, with the same routes to the diary and PWA install flow.
- The relationship timeline and existing first-message recreation belong in **How We Met**; their current dates and wording remain the source of truth.
- The first-sky image, its metadata, and the existing Potato Queen secret-star interaction belong in **Two Cities, One Moon** as optional sky keepsakes.
- All six existing portrait photos, the three online photobooth strips, the soundtrack/song cover, Ammu’s voice-note playlist, and Ayush’s voice-note playlist belong in **The Little Things**. Existing audio/video controls and private diary media stay functional.
- The interactive couple illustration is a new **Our Little Universe** layer; existing media and the real story remain the focus around it.
- The existing envelope letter, birthday closing, lily bouquet, and diary doorway belong in **A Thousand More Moments**.
- The diary’s authentication, storage, upload, favorites, and viewing flows remain their own feature set; the homepage should link into them rather than clone or replace them.

## Animation architecture

- Keep the existing static-site routes and core scripts. Put the cinematic prototype in separate `cinematic-preview.*` files; no production route, auth, upload, or service-worker behavior changes in this milestone.
- Use GSAP + ScrollTrigger for chapter timelines, reveal timing, parallax, route drawing, and restrained camera scale. Scope each chapter animation so it can be torn down when the scene is not active; provide a `prefers-reduced-motion` path and a no-GSAP static fallback.
- Use ordinary browser scroll with a sticky scene stage for the prototype. Avoid replacing native scrolling globally or forcing snap/pin behavior across the whole site. Mobile uses the same chapter beat with shorter travel distances and larger tap targets.
- Load Rive only for the approved character chapter and Lottie only for small decorative loops. Keep both lazy, pause them off-screen, and provide static SVG/poster fallbacks. Avoid loading both runtimes on the initial hero.
- For future environment video, use a short, silent, compressed loop with `preload="none"`, `muted`, `playsinline`, an intersection-based play/pause lifecycle, and a matching poster. Pause when hidden/off-screen; never autoplay audio. Retain still art for reduced-motion, low-power, and offline use.
- Keep all user-facing story text in semantic HTML. Animation decorates content; it does not contain essential text or gate access to the diary.

## Asset inventory and needs

**Available now:** six Ammu portraits in `assets/photos/`; three photobooth strips in `assets/photobooth/`; `assets/stars/first-hello-sky.png`; voice notes in `assets/audio/`; the song cover at `assets/media/ammus-song-cover.mp4`; and the inline lily bouquet in `index.html`.

**Need before later chapters:** approved environment illustrations or short video loops for the opening and city scene; a light/dark mobile poster pair if the video crop needs it; explicit photo selections for each chapter; approved Rive couple character designs based on reference images; and small Lottie decor chosen to match the scrapbook line-art style. These assets should be optimized and checked at both portrait and desktop ratios before integration.

## First working prototype

`cinematic-preview.html` now contains a connected prototype of all six storyboard chapters. It reuses the existing first-message wording and date, existing relationship timeline and message snippets, the first-sky chart and Potato Queen secret, all six portrait photos, all three photo-booth strips, the existing voice-note recordings and song-cover video, the approved illustrated night scene, the existing birthday letter, and the same lily bouquet illustration extracted as a separate prototype asset. New interactivity includes the envelope opening, photo lightbox, user-started audio/video controls, the city-to-city light route, three simple sky interactions, and the letter reveal.

The prototype stays in separate `cinematic-preview.*` files plus `assets/cinematic-lily-bouquet.svg`; it does not change production routes, authentication, diary storage, or PWA behavior. The interactive universe scene uses the existing approved couple artwork as a background. Lifelike or Rive-rigged characters are still pending approved designs; the scene does not pretend to animate the people in that illustration. The chapter panels use restrained ScrollTrigger reveals and parallax, with a static fallback for reduced motion or unavailable animation libraries.

**Still needed before production integration:** real desktop, Android browser, and installed-PWA visual checks; a short, silent, optimized ambient night-sky loop and poster if moving footage is desired; and approval of reusable couple character designs before adding Rive. The current vector and still-image scenes avoid video decode and battery costs until a video asset is approved.

## Approval gates

1. Review the prototype's visual direction, the chapter-one pacing, and whether the paper-plane/message interaction feels right.
2. After approval, create the next chapter prototype and source the specific environment/character assets with Ayush before expanding the system.
3. Only after chapter reviews, integrate the accepted scenes into the production homepage and update the PWA shell/cache deliberately.
