(() => {
  const authForm = document.querySelector('#diary-auth-form');
  const authStatus = document.querySelector('#diary-auth-status');
  const authEmail = document.querySelector('#diary-email');
  const authPanel = document.querySelector('.diary-auth');
  const archiveStatus = document.querySelector('#archive-status');
  const archiveContent = document.querySelector('#archive-content');
  const openButton = document.querySelector('#open-diary');
  const book = document.querySelector('#diary-book');
  const grid = document.querySelector('#memory-grid');
  const viewer = document.querySelector('#memory-viewer');
  const stage = document.querySelector('#memory-viewer-stage');
  const counts = [...document.querySelectorAll('[data-count]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const signOutButton = document.querySelector('#diary-signout');
  const uploaderLink = document.querySelector('#archive-upload-link');
  const labels = { photo: 'PHOTO KEEPSAKE', video: 'A LITTLE FILM', voice: 'VOICE NOTE', 'little-things': 'A LITTLE THING' };
  let memories = [];
  let visible = [];
  let currentIndex = 0;
  let activeFilter = 'all';
  let session = null;

  const say = (node, message, isError = false) => {
    node.textContent = message;
    node.classList.toggle('is-error', isError);
  };
  const prettyDate = (value) => {
    if (!value) return 'A day to keep';
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date);
  };
  const kindOf = (item) => item.media_type === 'little-things' ? 'little-things' : item.media_type;
  const setCounts = () => {
    const byKind = memories.reduce((acc, memory) => { acc[memory.media_type] = (acc[memory.media_type] || 0) + 1; return acc; }, {});
    counts.forEach((node) => { node.textContent = String(node.dataset.count === 'all' ? memories.length : byKind[node.dataset.count] || 0).padStart(2, '0'); });
  };
  const applyFilter = () => {
    visible = memories.filter((item) => activeFilter === 'all' || item.media_type === activeFilter);
    [...grid.children].forEach((card) => { card.hidden = activeFilter !== 'all' && card.dataset.category !== activeFilter; });
    filters.forEach((button) => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };
  const createCard = (memory) => {
    const type = kindOf(memory);
    const card = document.createElement('article');
    card.className = `memory-card memory-card--${type === 'little-things' ? 'note' : type}`;
    card.dataset.category = type;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = type === 'photo' ? 'memory-card__image' : type === 'video' ? 'memory-card__video' : type === 'voice' ? 'memory-card__art' : 'memory-card__note-art';
    open.dataset.memoryId = memory.id;
    open.setAttribute('aria-label', `Open ${type === 'little-things' ? 'keepsake' : type}: ${memory.title}`);
    if (type === 'photo' && memory.signed_url) {
      const image = document.createElement('img'); image.src = memory.signed_url; image.alt = memory.title; image.loading = 'lazy'; open.append(image);
      const mark = document.createElement('span'); mark.textContent = '✧'; open.append(mark);
    } else if (type === 'video') {
      const video = document.createElement('video'); video.src = memory.signed_url || ''; video.muted = true; video.preload = 'metadata'; video.playsInline = true; open.append(video);
      const play = document.createElement('span'); play.textContent = '▶'; play.setAttribute('aria-hidden', 'true'); open.append(play);
    } else {
      const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = type === 'voice' ? '♫' : '✦'; open.append(icon);
      if (type === 'little-things') {
        const note = document.createElement('p'); note.textContent = memory.caption || memory.title; open.append(note);
      }
      const category = document.createElement('small'); category.textContent = type === 'voice' ? 'A VOICE TO KEEP' : 'A LITTLE KEEPSAKE'; open.append(category);
    }
    const details = document.createElement('div'); details.className = 'memory-card__details';
    const kicker = document.createElement('p'); kicker.className = 'memory-card__type'; kicker.textContent = `${type.replace('-', ' ').toUpperCase()} · KEPT CLOSE`;
    const title = document.createElement('h3'); title.textContent = memory.title;
    const date = document.createElement('time'); date.dateTime = memory.memory_date || memory.created_at; date.textContent = prettyDate(memory.memory_date || memory.created_at);
    details.append(kicker, title, date);
    card.append(open, details);
    return card;
  };
  const renderCards = (items) => {
    memories = items;
    grid.replaceChildren(...items.map(createCard));
    setCounts(); applyFilter();
    if (!items.length) say(archiveStatus, 'Our pages are still waiting for their first little memory. Add one whenever you like.');
    else say(archiveStatus, `${items.length} ${items.length === 1 ? 'memory' : 'memories'} tucked into our diary.`);
  };
  const formatTime = (seconds) => `${Math.floor((seconds || 0) / 60)}:${Math.floor((seconds || 0) % 60).toString().padStart(2, '0')}`;
  const showMemory = (index) => {
    if (!visible.length) return;
    currentIndex = (index + visible.length) % visible.length;
    const memory = visible[currentIndex];
    document.querySelector('#memory-viewer-type').textContent = labels[memory.media_type] || 'KEPT CLOSE';
    document.querySelector('#memory-viewer-title').textContent = memory.title;
    document.querySelector('#memory-viewer-date').textContent = prettyDate(memory.memory_date || memory.created_at);
    document.querySelector('#memory-viewer-description').textContent = memory.caption || '';
    document.querySelector('#memory-viewer-count').textContent = `${currentIndex + 1} / ${visible.length}`;
    viewer.dataset.kind = memory.media_type;
    stage.replaceChildren();
    if (!memory.signed_url) {
      const message = document.createElement('p'); message.className = 'diary-live-status is-error'; message.textContent = 'This keepsake could not be opened. Please refresh the diary and try again.'; stage.append(message);
    } else if (memory.media_type === 'photo') {
      const frame = document.createElement('figure'); frame.className = 'memory-viewer__photo-frame';
      const image = document.createElement('img'); image.src = memory.signed_url; image.alt = memory.title;
      const caption = document.createElement('figcaption'); caption.textContent = memory.caption || memory.title;
      frame.append(image, caption); stage.append(frame);
    } else if (memory.media_type === 'video') {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__video-frame';
      const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = memory.signed_url;
      frame.append(video); stage.append(frame);
    } else if (memory.media_type === 'voice') {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
      const icon = document.createElement('span'); icon.textContent = '♫'; icon.setAttribute('aria-hidden', 'true');
      const label = document.createElement('p'); label.textContent = 'A VOICE TO KEEP CLOSE';
      const player = document.createElement('div'); player.className = 'voice-viewer';
      const audio = document.createElement('audio'); audio.src = memory.signed_url; audio.preload = 'metadata';
      const play = document.createElement('button'); play.className = 'voice-viewer__play'; play.type = 'button'; play.textContent = '▶'; play.setAttribute('aria-label', 'Play voice note');
      const body = document.createElement('div'); body.className = 'voice-viewer__body';
      const wave = document.createElement('div'); wave.className = 'voice-viewer__wave'; wave.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 25; i += 1) wave.append(document.createElement('i'));
      const progress = document.createElement('input'); progress.className = 'voice-viewer__progress'; progress.type = 'range'; progress.min = '0'; progress.max = '1000'; progress.value = '0'; progress.setAttribute('aria-label', 'Seek through voice note');
      const times = document.createElement('div'); times.className = 'voice-viewer__time'; const elapsed = document.createElement('span'); const duration = document.createElement('span'); elapsed.textContent = '0:00'; duration.textContent = '0:00'; times.append(elapsed, duration);
      body.append(wave, progress, times); player.append(play, body); frame.append(icon, label, player, audio); stage.append(frame);
      const update = () => { progress.value = String(Math.round(audio.duration ? audio.currentTime / audio.duration * 1000 : 0)); elapsed.textContent = formatTime(audio.currentTime); duration.textContent = formatTime(audio.duration); };
      play.addEventListener('click', async () => { if (audio.paused) { try { await audio.play(); } catch {} } else audio.pause(); });
      audio.addEventListener('play', () => { play.textContent = 'Ⅱ'; play.setAttribute('aria-label', 'Pause voice note'); wave.classList.add('is-playing'); });
      audio.addEventListener('pause', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Play voice note'); wave.classList.remove('is-playing'); });
      audio.addEventListener('loadedmetadata', update); audio.addEventListener('timeupdate', update);
      progress.addEventListener('input', () => { if (audio.duration) audio.currentTime = Number(progress.value) / 1000 * audio.duration; });
    } else if (memory.content_type === 'application/pdf') {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__photo-frame';
      const documentView = document.createElement('iframe'); documentView.src = memory.signed_url; documentView.title = memory.title;
      frame.append(documentView); stage.append(frame);
    } else if (memory.content_type === 'text/plain') {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
      const note = document.createElement('pre'); note.textContent = 'Opening this little note…'; frame.append(note); stage.append(frame);
      fetch(memory.signed_url).then((response) => { if (!response.ok) throw new Error('Could not open note'); return response.text(); }).then((text) => { note.textContent = text.slice(0, 20000); }).catch(() => { note.textContent = memory.caption || memory.title; });
    } else {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
      const star = document.createElement('span'); star.textContent = '✦'; star.setAttribute('aria-hidden', 'true');
      const note = document.createElement('p'); note.className = 'memory-viewer__note-copy'; note.textContent = memory.caption || memory.title;
      frame.append(star, note); stage.append(frame);
    }
    if (!viewer.open) viewer.showModal();
  };
  const openArchive = async () => {
    try {
      session = await window.DiaryClient.getMemberSession();
      if (!session) { authPanel.classList.add('is-visible'); say(authStatus, 'Sign in first, and then the diary will open for you.'); authEmail.focus(); return; }
      authPanel.hidden = true; signOutButton.hidden = false;
      book.classList.add('is-opening'); openButton.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => { archiveContent.hidden = false; archiveContent.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 650);
      say(archiveStatus, 'Opening our diary…');
      const items = await window.DiaryClient.listMemories(); renderCards(items || []);
    } catch (error) { say(authStatus, error.message || 'Could not open the diary. Please try again.', true); }
  };
  if (!window.DiaryClient.configured) say(authStatus, 'Add the Supabase project URL and publishable key to diary-config.js to connect the private diary.', true);
  openButton.addEventListener('click', openArchive);
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.DiaryClient.configured) return say(authStatus, 'Connect Supabase using backend/SETUP.md before signing in.', true);
    try { await window.DiaryClient.signInWithEmail(authEmail.value, '/archive.html'); say(authStatus, 'Check your inbox for the private sign-in link. Open it in this browser.'); }
    catch (error) { say(authStatus, error.message || 'Could not send the sign-in link.', true); }
  });
  filters.forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; applyFilter(); }));
  grid.addEventListener('click', (event) => { const opener = event.target.closest('[data-memory-id]'); if (opener) showMemory(visible.findIndex((item) => item.id === opener.dataset.memoryId)); });
  viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => stage.querySelectorAll('audio,video').forEach((media) => media.pause()));
  viewer.querySelectorAll('[data-viewer-step]').forEach((button) => button.addEventListener('click', () => showMemory(currentIndex + Number(button.dataset.viewerStep))));
  signOutButton.addEventListener('click', async () => { await window.DiaryClient.signOut(); location.reload(); });
  if (!window.DiaryClient.configured) say(archiveStatus, 'Connect the private archive to Supabase using the steps in backend/SETUP.md.', true);
  const uploaderUrl = window.DIARY_CONFIG?.uploaderUrl?.trim();
  if (uploaderUrl) {
    uploaderLink.href = uploaderUrl;
    uploaderLink.target = '_blank';
    uploaderLink.rel = 'noopener noreferrer';
  } else {
    uploaderLink.addEventListener('click', (event) => {
      event.preventDefault();
      say(archiveStatus, 'The separate uploader site is not connected yet. Add its deployed URL to diary-config.js.', true);
    });
  }
  if (location.hash === '#archive-content' && window.DiaryClient.configured) openArchive();
})();
