(() => {
  const openDiaryButton = document.querySelector('#open-diary');
  const diaryBook = document.querySelector('#diary-book');
  const archiveContent = document.querySelector('#archive-content');
  const grid = document.querySelector('#memory-grid');
  const chapterList = document.querySelector('#chapter-list');
  const filters = [...document.querySelectorAll('[data-filter]')];
  const counts = [...document.querySelectorAll('[data-filter-count]')];
  const spreadTitle = document.querySelector('#spread-title');
  const spreadCount = document.querySelector('#spread-count');
  const pageNumber = document.querySelector('#spread-page-number');
  const previousButton = document.querySelector('#previous-spread');
  const nextButton = document.querySelector('#next-spread');
  const spreadStage = document.querySelector('#spread-turn-stage');
  const emptyState = document.querySelector('#spread-empty');
  const viewer = document.querySelector('#memory-viewer');
  const viewerStage = document.querySelector('#memory-viewer-stage');
  const viewerType = document.querySelector('#memory-viewer-type');
  const viewerTitle = document.querySelector('#memory-viewer-title');
  const viewerDate = document.querySelector('#memory-viewer-date');
  const viewerDescription = document.querySelector('#memory-viewer-description');
  const viewerCount = document.querySelector('#memory-viewer-count');
  const previewStorageKey = 'little-diary-preview-draft';

  if (!grid || !chapterList || !viewer) return;

  const memories = [
    { id: 'oct-13', kind: 'little-things', month: '2026-10', date: '2026-10-29', title: 'A tiny promise for later', caption: 'One day at a time, still choosing us.', sender: 'A LITTLE THING', icon: '♡' },
    { id: 'oct-12', kind: 'voice', month: '2026-10', date: '2026-10-28', title: 'One more little song', caption: 'A voice note I keep coming back to.', sender: 'MY VOICE', src: 'assets/audio/my-voice-note-03.ogg' },
    { id: 'oct-11', kind: 'photo', month: '2026-10', date: '2026-10-26', title: 'Your softest smile', caption: 'A little picture I always want close.', src: 'assets/photos/ammu-purple-glasses.jpeg' },
    { id: 'oct-10', kind: 'little-things', month: '2026-10', date: '2026-10-24', title: 'The line that stayed', caption: '“You are my half girlfriend.” A tiny line from the start of us.', sender: 'A LITTLE THING', icon: '✦' },
    { id: 'oct-09', kind: 'voice', month: '2026-10', date: '2026-10-22', title: 'One of the funny ones', caption: 'A voice note from the Hindi lyrics game.', sender: 'AMMU’S VOICE', src: 'assets/audio/hindi-lyrics-01.ogg' },
    { id: 'oct-08', kind: 'photo', month: '2026-10', date: '2026-10-19', title: 'The cat stole the show', caption: 'A silly afternoon we got to keep.', src: 'assets/photobooth/oct-19-cat-strip.jpg' },
    { id: 'oct-07', kind: 'video', month: '2026-10', date: '2026-10-18', title: 'Can’t Help Falling in Love', caption: 'The one I keep replaying.', src: 'assets/media/ammus-song-cover.mp4', poster: 'assets/photos/ammu-black-white.jpeg' },
    { id: 'oct-06', kind: 'photo', month: '2026-10', date: '2026-10-16', title: 'A little glow from that day', caption: 'A favorite frame from our silly photo booth.', src: 'assets/photobooth/oct-19-laugh-strip.jpg' },
    { id: 'oct-05', kind: 'voice', month: '2026-10', date: '2026-10-14', title: 'A little hello for you', caption: 'One of the little moments I saved for you.', sender: 'MY VOICE', src: 'assets/audio/my-voice-note-01.ogg' },
    { id: 'oct-04', kind: 'photo', month: '2026-10', date: '2026-10-12', title: 'A quiet night we kept', caption: 'A little glimpse I wanted to remember.', src: 'assets/photos/ammu-night.jpeg' },
    { id: 'oct-03', kind: 'little-things', month: '2026-10', date: '2026-10-09', title: 'A goodnight to keep', caption: 'A small note, saved on an ordinary night.', sender: 'A LITTLE THING', icon: '☾' },
    { id: 'oct-02', kind: 'voice', month: '2026-10', date: '2026-10-05', title: 'Ammu’s lyric-game moment', caption: 'A little voice note from our game.', sender: 'AMMU’S VOICE', src: 'assets/audio/hindi-lyrics-02.ogg' },
    { id: 'oct-01', kind: 'photo', month: '2026-10', date: '2026-10-01', title: 'A saree-day favorite', caption: 'A picture I would tuck into every diary.', src: 'assets/photos/ammu-saree.jpeg' },
    { id: 'sep-05', kind: 'voice', month: '2026-09', date: '2026-09-26', title: 'Your voice after a long day', caption: 'A familiar hello that made the evening softer.', sender: 'AMMU’S VOICE', src: 'assets/audio/hindi-lyrics-03.ogg' },
    { id: 'sep-04', kind: 'photo', month: '2026-09', date: '2026-09-20', title: 'A playful little frame', caption: 'A smile that deserves its own postcard.', src: 'assets/photos/ammu-playful.jpeg' },
    { id: 'sep-03', kind: 'little-things', month: '2026-09', date: '2026-09-15', title: 'A sentence for the hard days', caption: 'Distance is a little smaller when we remember we are on the same team.', sender: 'A LITTLE THING', icon: '♡' },
    { id: 'sep-02', kind: 'video', month: '2026-09', date: '2026-09-09', title: 'Our little song replay', caption: 'A moment in motion, saved for later.', src: 'assets/media/ammus-song-cover.mp4', poster: 'assets/photos/ammu-saree.jpeg' },
    { id: 'sep-01', kind: 'photo', month: '2026-09', date: '2026-09-02', title: 'A favorite from the camera roll', caption: 'A soft little memory from the beginning of September.', src: 'assets/photos/ammu-soft-smile.jpeg' },
    { id: 'aug-04', kind: 'little-things', month: '2025-08', date: '2025-08-01', title: 'One tiny “Mhmmm”', caption: '“You are my half girlfriend.” A tiny line from the start of us.', sender: 'AUGUST 1 · 12:01 AM', icon: '✦' },
    { id: 'aug-03', kind: 'voice', month: '2025-08', date: '2025-08-01', title: 'A tiny laugh after midnight', caption: 'A little audio keepsake from the start of us.', sender: 'MY VOICE', src: 'assets/audio/my-voice-note-02.ogg' },
    { id: 'aug-02', kind: 'photo', month: '2025-08', date: '2025-08-01', title: 'The beginning, in one frame', caption: 'One of the first photos I wanted to keep close.', src: 'assets/photos/ammu-black-white.jpeg' },
    { id: 'aug-01', kind: 'photo', month: '2025-08', date: '2025-08-01', title: 'A small hello from us', caption: 'The first of a thousand little things.', src: 'assets/photobooth/oct-19-spiderman-strip.jpg' },
  ];

  const kindLabels = { photo: 'PHOTO POSTCARD', video: 'A LITTLE FILM', voice: 'VOICE NOTE', 'little-things': 'A LITTLE THING' };
  const mediaKindLabels = { photo: 'PHOTO KEEPSAKE', video: 'A LITTLE FILM', voice: 'VOICE NOTE', 'little-things': 'A LITTLE THING' };
  const filterNames = { photo: 'photos', video: 'videos', voice: 'voice notes', 'little-things': 'little things' };
  const prettyDate = (value) => {
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(parsed);
  };
  const monthTitle = (month) => {
    const parsed = new Date(`${month}-01T12:00:00`);
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(parsed);
  };
  const getPageSize = () => window.matchMedia('(max-width: 540px)').matches ? 4 : 6;
  let activeMonth = [...memories].map((memory) => memory.month).sort().at(-1) || '2026-10';
  let activeFilter = 'all';
  let activePage = 0;
  let pageSize = getPageSize();
  let visibleMemories = [];
  let currentMemory = null;
  let pageTurning = false;

  try {
    const savedPreview = sessionStorage.getItem(previewStorageKey);
    if (savedPreview) {
      const saved = JSON.parse(savedPreview);
      const drafts = Array.isArray(saved) ? saved : [saved];
      const validKinds = ['photo', 'video', 'voice', 'little-things'];
      const now = new Date();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const added = drafts.map((draft, index) => {
        const date = /^\d{4}-\d{2}-\d{2}$/.test(draft.date || '') ? draft.date : today;
        const kind = validKinds.includes(draft.kind) ? draft.kind : 'photo';
        return {
          id: `preview-${Date.now()}-${index}`,
          kind,
          month: date.slice(0, 7),
          date,
          title: String(draft.title || 'A new little memory').slice(0, 80),
          caption: String(draft.caption || 'A keepsake from the uploader preview.').slice(0, 280),
          sender: 'PREVIEW ONLY · NOT SAVED',
          icon: '♡',
          previewOnly: true,
          src: kind === 'photo' ? 'assets/photos/ammu-soft-smile.jpeg' : kind === 'video' ? 'assets/media/ammus-song-cover.mp4' : kind === 'voice' ? 'assets/audio/my-voice-note-01.ogg' : '',
          poster: 'assets/photos/ammu-soft-smile.jpeg',
        };
      });
      memories.push(...added);
      memories.sort((a, b) => `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`));
      activeMonth = added[0]?.month || activeMonth;
      sessionStorage.removeItem(previewStorageKey);
    }
  } catch { /* Private browsing may block session storage; the sample diary still works. */ }

  const buildCard = (memory) => {
    const type = memory.kind;
    const card = document.createElement('article');
    card.className = `memory-card memory-card--${type === 'little-things' ? 'note' : type}${memory.previewOnly ? ' memory-card--preview-added' : ''}`;
    card.dataset.category = type;
    card.dataset.memoryMonth = memory.month;
    const open = document.createElement('button');
    open.type = 'button';
    open.className = type === 'photo' ? 'memory-card__image' : type === 'video' ? 'memory-card__video' : type === 'voice' ? 'memory-card__art' : 'memory-card__note-art';
    open.dataset.memoryId = memory.id;
    open.dataset.kind = type;
    open.dataset.src = memory.src || '';
    open.dataset.poster = memory.poster || '';
    open.dataset.title = memory.title;
    open.dataset.date = prettyDate(memory.date);
    open.dataset.description = memory.caption || '';
    open.setAttribute('aria-label', `Open ${type === 'little-things' ? 'keepsake' : type}: ${memory.title}`);

    if (type === 'photo' || type === 'video') {
      const image = document.createElement('img');
      image.src = memory.previewOnly ? 'assets/photos/ammu-soft-smile.jpeg' : type === 'video' ? memory.poster : memory.src;
      image.alt = memory.previewOnly ? 'Preview keepsake placeholder' : memory.title;
      image.loading = 'lazy';
      open.append(image);
      const mark = document.createElement('span');
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = type === 'video' ? '▶' : '✧';
      open.append(mark);
    } else if (type === 'voice') {
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '♫';
      const label = document.createElement('small');
      label.textContent = memory.sender || 'A VOICE TO KEEP';
      open.append(icon, label);
    } else {
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = memory.icon || '✦';
      const note = document.createElement('p');
      note.textContent = memory.caption || memory.title;
      const label = document.createElement('small');
      label.textContent = memory.previewOnly ? 'PREVIEW ONLY' : memory.sender || 'A LITTLE KEEPSAKE';
      open.append(icon, note, label);
    }

    const details = document.createElement('div');
    details.className = 'memory-card__details';
    const kicker = document.createElement('p');
    kicker.className = 'memory-card__type';
    kicker.textContent = memory.previewOnly ? `${kindLabels[type]} · PREVIEW ONLY` : `${kindLabels[type]} · KEPT CLOSE`;
    const title = document.createElement('h3');
    title.textContent = memory.title;
    const date = document.createElement('time');
    date.dateTime = memory.date;
    date.textContent = prettyDate(memory.date);
    details.append(kicker, title, date);
    card.append(open, details);
    return card;
  };

  const chapterMonths = () => [...new Set(memories.map((memory) => memory.month))].sort().reverse();
  const renderChapterIndex = () => {
    chapterList.replaceChildren();
    const months = chapterMonths();
    months.forEach((month) => {
      const items = memories.filter((memory) => memory.month === month);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `chapter-tab${month === activeMonth ? ' is-active' : ''}`;
      button.dataset.chapter = month;
      button.setAttribute('aria-pressed', String(month === activeMonth));
      const title = document.createElement('span');
      title.textContent = monthTitle(month);
      const count = document.createElement('small');
      count.textContent = `${items.length} ${items.length === 1 ? 'memory' : 'memories'}`;
      button.append(title, count);
      button.addEventListener('click', () => {
        activeMonth = month;
        activePage = 0;
        renderChapterIndex();
        renderSpread('next');
      });
      chapterList.append(button);
    });
  };

  const chapterMemories = () => memories.filter((memory) => memory.month === activeMonth);
  const filteredMemories = () => chapterMemories().filter((memory) => activeFilter === 'all' || memory.kind === activeFilter);
  const renderCounts = () => {
    const current = chapterMemories();
    counts.forEach((node) => {
      const kind = node.dataset.filterCount;
      const count = kind === 'all' ? current.length : current.filter((memory) => memory.kind === kind).length;
      node.textContent = String(count).padStart(2, '0');
    });
  };
  const renderSpread = (direction = 'next') => {
    visibleMemories = filteredMemories();
    pageSize = getPageSize();
    const pageCount = Math.max(1, Math.ceil(visibleMemories.length / pageSize));
    activePage = Math.min(activePage, pageCount - 1);
    const start = activePage * pageSize;
    const end = Math.min(start + pageSize, visibleMemories.length);
    const visibleIds = new Set(visibleMemories.slice(start, end).map((memory) => memory.id));
    [...grid.children].forEach((card) => { card.hidden = !visibleIds.has(card.querySelector('[data-memory-id]')?.dataset.memoryId); });
    spreadTitle.textContent = monthTitle(activeMonth);
    spreadCount.textContent = visibleMemories.length ? `${start + 1}–${end} of ${visibleMemories.length} ${visibleMemories.length === 1 ? 'memory' : 'memories'}` : 'no memories in this chapter yet';
    pageNumber.textContent = `${activePage + 1} / ${pageCount}`;
    previousButton.disabled = activePage === 0;
    nextButton.disabled = activePage >= pageCount - 1;
    emptyState.hidden = visibleMemories.length !== 0;
    if (!visibleMemories.length) {
      emptyState.querySelector('p').textContent = chapterMemories().length
        ? `No ${filterNames[activeFilter] || 'memories'} on this chapter’s pages yet.`
        : 'This page is waiting for its first little memory.';
    }
    filters.forEach((button) => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    chapterList.querySelectorAll('[data-chapter]').forEach((button) => {
      const active = button.dataset.chapter === activeMonth;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    renderCounts();
    spreadStage.classList.remove('is-turning-next', 'is-turning-previous');
    void spreadStage.offsetWidth;
    spreadStage.classList.add(direction === 'previous' ? 'is-turning-previous' : 'is-turning-next');
    spreadStage.addEventListener('animationend', () => spreadStage.classList.remove('is-turning-next', 'is-turning-previous'), { once: true });
  };

  const turnSpread = (direction) => {
    if (pageTurning) return;
    const lastPage = Math.max(0, Math.ceil(filteredMemories().length / getPageSize()) - 1);
    const nextPage = activePage + (direction === 'next' ? 1 : -1);
    if (nextPage < 0 || nextPage > lastPage) return;
    pageTurning = true;
    activePage = nextPage;
    renderSpread(direction);
    spreadTitle.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(() => { pageTurning = false; }, 420);
  };

  const formatTime = (seconds) => {
    const value = Number.isFinite(seconds) ? seconds : 0;
    return `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
  };
  const buildVoiceViewer = (source) => {
    const frame = document.createElement('div');
    frame.className = 'memory-viewer__note-frame';
    const icon = document.createElement('span'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = '♫';
    const label = document.createElement('p'); label.textContent = 'A VOICE TO KEEP CLOSE';
    const player = document.createElement('div'); player.className = 'voice-viewer';
    const audio = document.createElement('audio'); audio.src = source; audio.preload = 'metadata';
    const play = document.createElement('button'); play.className = 'voice-viewer__play'; play.type = 'button'; play.textContent = '▶'; play.setAttribute('aria-label', 'Play voice note');
    const body = document.createElement('div'); body.className = 'voice-viewer__body';
    const wave = document.createElement('div'); wave.className = 'voice-viewer__wave'; wave.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 25; index += 1) wave.append(document.createElement('i'));
    const progress = document.createElement('input'); progress.className = 'voice-viewer__progress'; progress.type = 'range'; progress.min = '0'; progress.max = '1000'; progress.value = '0'; progress.setAttribute('aria-label', 'Seek through voice note');
    const times = document.createElement('div'); times.className = 'voice-viewer__time';
    const elapsed = document.createElement('span'); const duration = document.createElement('span'); elapsed.textContent = '0:00'; duration.textContent = '0:00'; times.append(elapsed, duration);
    body.append(wave, progress, times); player.append(play, body); frame.append(icon, label, player, audio);
    const update = () => {
      const total = Number.isFinite(audio.duration) ? audio.duration : 0;
      progress.value = String(Math.round(total ? audio.currentTime / total * 1000 : 0));
      elapsed.textContent = formatTime(audio.currentTime); duration.textContent = formatTime(total);
    };
    play.addEventListener('click', async () => { if (audio.paused) { try { await audio.play(); } catch { play.textContent = '▶'; } } else audio.pause(); });
    audio.addEventListener('play', () => { play.textContent = 'Ⅱ'; play.setAttribute('aria-label', 'Pause voice note'); wave.classList.add('is-playing'); });
    audio.addEventListener('pause', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Play voice note'); wave.classList.remove('is-playing'); });
    audio.addEventListener('loadedmetadata', update); audio.addEventListener('timeupdate', update);
    progress.addEventListener('input', () => { if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(progress.value) / 1000 * audio.duration; });
    return frame;
  };

  const openers = () => [...grid.querySelectorAll('[data-memory-id]')];
  const renderMemory = (memory) => {
    currentMemory = memory;
    viewer.dataset.kind = memory.kind;
    viewerType.textContent = mediaKindLabels[memory.kind] || 'KEPT CLOSE';
    viewerTitle.textContent = memory.title;
    viewerDate.textContent = prettyDate(memory.date);
    viewerDescription.textContent = memory.caption || '';
    viewerCount.textContent = `${visibleMemories.findIndex((item) => item.id === memory.id) + 1} / ${visibleMemories.length}`;
    viewerStage.replaceChildren();
    if (memory.kind === 'photo' && memory.src) {
      const frame = document.createElement('figure'); frame.className = 'memory-viewer__photo-frame';
      const image = document.createElement('img'); image.src = memory.previewOnly ? 'assets/photos/ammu-soft-smile.jpeg' : memory.src; image.alt = memory.title;
      const caption = document.createElement('figcaption'); caption.textContent = memory.caption || memory.title;
      frame.append(image, caption); viewerStage.append(frame);
    } else if (memory.kind === 'video' && memory.src) {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__video-frame';
      const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; if (memory.poster) video.poster = memory.poster;
      const source = document.createElement('source'); source.src = memory.src; source.type = 'video/mp4'; video.append(source); frame.append(video); viewerStage.append(frame);
    } else if (memory.kind === 'voice' && memory.src) {
      viewerStage.append(buildVoiceViewer(memory.src));
    } else {
      const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
      const icon = document.createElement('span'); icon.textContent = memory.icon || '✦'; icon.setAttribute('aria-hidden', 'true');
      const note = document.createElement('p'); note.className = 'memory-viewer__note-copy'; note.textContent = memory.caption || memory.title;
      frame.append(icon, note); viewerStage.append(frame);
    }
    if (!viewer.open) viewer.showModal();
  };

  grid.replaceChildren(...memories.map(buildCard));
  renderChapterIndex();
  renderSpread();

  if (openDiaryButton && diaryBook && archiveContent) {
    openDiaryButton.addEventListener('click', () => {
      if (diaryBook.classList.contains('is-opening')) return;
      diaryBook.classList.add('is-opening');
      openDiaryButton.setAttribute('aria-expanded', 'true');
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.setTimeout(() => {
        archiveContent.hidden = false;
        archiveContent.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
      }, prefersReducedMotion ? 0 : 650);
    });
  }
  filters.forEach((button) => button.addEventListener('click', () => { activeFilter = button.dataset.filter; activePage = 0; renderSpread(); }));
  previousButton.addEventListener('click', () => turnSpread('previous'));
  nextButton.addEventListener('click', () => turnSpread('next'));
  grid.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-memory-id]');
    if (!opener) return;
    const memory = memories.find((item) => item.id === opener.dataset.memoryId);
    if (memory) renderMemory(memory);
  });
  viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => viewerStage.querySelectorAll('audio,video').forEach((media) => media.pause()));
  viewer.querySelectorAll('[data-viewer-step]').forEach((button) => button.addEventListener('click', () => {
    if (!visibleMemories.length) return;
    const currentIndex = visibleMemories.findIndex((item) => item.id === currentMemory?.id);
    const step = Number(button.dataset.viewerStep);
    renderMemory(visibleMemories[(currentIndex + step + visibleMemories.length) % visibleMemories.length]);
  }));

  let touchStart = null;
  spreadStage.addEventListener('touchstart', (event) => {
    const touch = event.changedTouches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  spreadStage.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(deltaX) > 58 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) turnSpread(deltaX < 0 ? 'next' : 'previous');
  }, { passive: true });
  spreadStage.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  document.addEventListener('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (viewer.open) {
      if (event.key === 'ArrowRight') viewer.querySelector('[data-viewer-step="1"]').click();
      if (event.key === 'ArrowLeft') viewer.querySelector('[data-viewer-step="-1"]').click();
      return;
    }
    if (archiveContent.hidden) return;
    if (event.key === 'ArrowRight') turnSpread('next');
    if (event.key === 'ArrowLeft') turnSpread('previous');
  });
  window.addEventListener('resize', () => {
    const nextSize = getPageSize();
    if (nextSize !== pageSize) { pageSize = nextSize; activePage = 0; renderSpread(); }
  }, { passive: true });
  if (location.hash === '#archive-content' && openDiaryButton) openDiaryButton.click();
})();
