/* Local/demo-only album fixtures. Activate with ?preview=1; no Supabase or uploads are used. */
(() => {
  const isPreviewPage = location.pathname.toLowerCase().endsWith('/archive-preview.html');
  if (!isPreviewPage && !new URLSearchParams(location.search).has('preview')) return;

  const art = (background, foreground, title, detail) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 720"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${background}"/><stop offset="1" stop-color="#171a2a"/></linearGradient></defs><rect width="900" height="720" fill="url(#g)"/><circle cx="700" cy="170" r="130" fill="${foreground}" opacity=".18"/><circle cx="210" cy="570" r="180" fill="${foreground}" opacity=".12"/><path d="M0 540 Q220 410 450 545 T900 500 V720 H0Z" fill="${foreground}" opacity=".14"/><text x="450" y="320" fill="#f7ead7" text-anchor="middle" font-family="Georgia,serif" font-size="56">${title}</text><text x="450" y="382" fill="#e8c990" text-anchor="middle" font-family="Georgia,serif" font-size="26">${detail}</text><text x="450" y="650" fill="#f2d7ad" text-anchor="middle" font-family="Georgia,serif" font-size="34">♡</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };
  const poster = art('#875d68', '#dcad78', 'a little film', 'movie night together');
  const silentWav = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
  const memories = [
    { id: 'demo-photo-1', media_type: 'photo', title: 'A day in Madurai ♡', memory_date: '2026-10-29', caption: 'A small golden-hour walk, saved for us.', location: 'Madurai', signed_url: art('#a96762', '#f1c997', 'our little walk', 'Madurai · October') },
    { id: 'demo-note-1', media_type: 'little-things', title: 'For a softer day', memory_date: '2026-10-27', caption: 'Hey love, if today feels a little heavy, remember you never have to carry it all alone. I am always one call, one voice note, and one silly story away. I love the brave, kind, wonderful person you are—and I am proud of you on the quiet days too. Keep this letter close until I can say it beside you. ♡', content_type: 'text/plain', location: '' },
    { id: 'demo-voice-1', media_type: 'voice', title: 'Sleepy little goodnight', memory_date: '2026-10-24', caption: 'A tiny voice note before we fell asleep.', location: 'Chennai', signed_url: silentWav, content_type: 'audio/wav' },
    { id: 'demo-video-1', media_type: 'video', title: 'Our movie-night memory', memory_date: '2026-10-18', caption: 'A little film to remember our cozy evening.', location: 'At home', signed_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', preview_poster: poster, content_type: 'video/mp4' },
    { id: 'demo-photo-2', media_type: 'photo', title: 'Same moon, different cities', memory_date: '2026-09-30', caption: 'A little reminder that the distance is only a map.', location: '', signed_url: art('#596b83', '#d4b58b', 'same moon', 'Chennai ↔ Madurai') },
    { id: 'demo-note-2', media_type: 'little-things', title: 'The first little text', memory_date: '2026-09-21', caption: 'One little Instagram text, and somehow my favourite story began. For my Tara, my Ammu. ♡', content_type: 'text/plain', location: 'Madurai → Chennai' },
    { id: 'demo-voice-2', media_type: 'voice', title: 'Tell me that story again', memory_date: '2026-09-12', caption: 'One of those calls that made the whole evening softer.', location: '', signed_url: silentWav, content_type: 'audio/wav' },
  ];

  document.body.classList.add('is-demo-preview');
  const badge = document.createElement('div');
  badge.className = 'diary-preview-badge';
  badge.textContent = 'PREVIEW · SAMPLE MEMORIES';
  document.body.append(badge);
  window.DIARY_CONFIG = { ...window.DIARY_CONFIG, uploaderUrl: '' };
  window.DiaryClient = {
    configured: true,
    getMemberSession: async () => ({ user: { id: 'local-preview-member' } }),
    signInWithEmail: async () => { throw new Error('Sign-in is disabled in this sample preview.'); },
    listMemoryIndex: async () => memories.map(({ signed_url, preview_poster, ...item }) => item),
    getMemoriesByIds: async (ids) => memories.filter((item) => ids.includes(item.id)),
    getMemoryById: async (id) => memories.find((item) => item.id === id) || null,
    signOut: async () => { location.href = location.pathname; },
  };
})();
