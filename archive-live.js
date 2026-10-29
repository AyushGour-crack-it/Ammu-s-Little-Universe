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
  const chapterList = document.querySelector('#chapter-list');
  const chapterIndex = document.querySelector('.chapter-index');
  const spreadTitle = document.querySelector('#spread-title');
  const spreadCount = document.querySelector('#spread-count');
  const spreadPageNumber = document.querySelector('#spread-page-number');
  const spreadStage = document.querySelector('#spread-turn-stage');
  const emptyState = document.querySelector('#spread-empty');
  const previousButton = document.querySelector('#previous-spread');
  const nextButton = document.querySelector('#next-spread');
  const refreshButton = document.querySelector('#archive-refresh');
  const emptyUploadLink = document.querySelector('#empty-upload-link');
  const viewer = document.querySelector('#memory-viewer');
  const viewerStage = document.querySelector('#memory-viewer-stage');
  const signOutButton = document.querySelector('#diary-signout');
  const uploaderLink = document.querySelector('#archive-upload-link');
  const counts = [...document.querySelectorAll('[data-count]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const labels = { photo: 'PHOTO KEEPSAKE', video: 'A LITTLE FILM', voice: 'VOICE NOTE', 'little-things': 'A LITTLE THING' };
  const filterNames = { photo: 'photos', video: 'videos', voice: 'voice notes', 'little-things': 'little things' };

  let memoryIndex = [];
  let visible = [];
  let activeFilter = 'all';
  let activeMonth = null;
  let activePage = 0;
  let pageSize = getPageSize();
  let currentIndex = 0;
  let session = null;
  let indexLoaded = false;
  let loadingIndex = false;
  let loadingPage = false;
  let pageRenderId = 0;
  let viewerRenderId = 0;
  let pageTurning = false;
  let bookOpening = false;

  function getPageSize() {
    return window.matchMedia('(max-width: 540px)').matches ? 4 : 6;
  }

  const say = (node, message, isError = false) => {
    node.textContent = message;
    node.classList.toggle('is-error', isError);
  };
  const itemDate = (memory) => memory.memory_date || memory.created_at || '';
  const monthFor = (memory) => itemDate(memory).slice(0, 7) || 'undated';
  const prettyDate = (value) => {
    if (!value) return 'A day to keep';
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.valueOf()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(date);
  };
  const monthTitle = (month) => {
    if (month === 'undated') return 'Undated keepsakes';
    const date = new Date(`${month}-01T12:00:00`);
    return Number.isNaN(date.valueOf()) ? month : new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
  };
  const kindOf = (memory) => memory.media_type === 'little-things' ? 'little-things' : memory.media_type;
  const currentChapter = () => memoryIndex.filter((memory) => monthFor(memory) === activeMonth);
  const filteredMemories = () => currentChapter().filter((memory) => activeFilter === 'all' || memory.media_type === activeFilter);

  const renderChapterIndex = () => {
    const months = [...new Set(memoryIndex.map(monthFor))].sort((a, b) => b.localeCompare(a));
    chapterIndex.hidden = months.length < 2;
    chapterList.replaceChildren();
    months.forEach((month) => {
      const items = memoryIndex.filter((memory) => monthFor(memory) === month);
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
        if (month === activeMonth) return;
        activeMonth = month;
        activePage = 0;
        renderSpread('next', true);
      });
      chapterList.append(button);
    });
  };

  const renderFilterCounts = () => {
    const items = currentChapter();
    counts.forEach((node) => {
      const kind = node.dataset.count;
      const count = kind === 'all' ? items.length : items.filter((memory) => memory.media_type === kind).length;
      node.textContent = String(count).padStart(2, '0');
    });
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
      const image = document.createElement('img');
      image.src = memory.signed_url;
      image.alt = memory.title;
      image.loading = 'lazy';
      open.append(image);
      const mark = document.createElement('span');
      mark.textContent = '✧';
      mark.setAttribute('aria-hidden', 'true');
      open.append(mark);
    } else if (type === 'video') {
      const video = document.createElement('video');
      video.src = memory.signed_url || '';
      video.muted = true;
      video.preload = 'metadata';
      video.playsInline = true;
      open.append(video);
      const play = document.createElement('span');
      play.textContent = '▶';
      play.setAttribute('aria-hidden', 'true');
      open.append(play);
    } else {
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = type === 'voice' ? '♫' : '✦';
      open.append(icon);
      if (type === 'little-things') {
        const note = document.createElement('p');
        note.textContent = memory.caption || memory.title;
        open.append(note);
      }
      const category = document.createElement('small');
      category.textContent = type === 'voice' ? 'A VOICE TO KEEP' : 'A LITTLE KEEPSAKE';
      open.append(category);
    }
    const details = document.createElement('div');
    details.className = 'memory-card__details';
    const kicker = document.createElement('p');
    kicker.className = 'memory-card__type';
    kicker.textContent = `${labels[type] || 'KEEPSAKE'} · KEPT CLOSE`;
    const title = document.createElement('h3');
    title.textContent = memory.title || 'A little memory';
    const date = document.createElement('time');
    const value = itemDate(memory);
    date.dateTime = value;
    date.textContent = prettyDate(value);
    details.append(kicker, title, date);
    card.append(open, details);
    return card;
  };

  const makeSkeleton = () => {
    const skeleton = document.createElement('div');
    skeleton.className = 'memory-skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.innerHTML = '<span></span><span><i></i><i></i><i></i></span>';
    return skeleton;
  };

  const setEmptyMessage = (message) => {
    emptyState.querySelector('p').textContent = message;
  };

  const renderSpread = async (direction = null, scrollToTop = false) => {
    const renderId = ++pageRenderId;
    pageSize = getPageSize();
    visible = filteredMemories();
    const pages = Math.max(1, Math.ceil(visible.length / pageSize));
    activePage = Math.max(0, Math.min(activePage, pages - 1));
    const first = activePage * pageSize;
    const pageEntries = visible.slice(first, first + pageSize);

    spreadTitle.textContent = activeMonth ? monthTitle(activeMonth) : 'Our little diary';
    spreadCount.textContent = visible.length
      ? `${first + 1}–${first + pageEntries.length} of ${visible.length} ${visible.length === 1 ? 'memory' : 'memories'}`
      : memoryIndex.length ? `no ${filterNames[activeFilter] || 'memories'} in this chapter` : 'your first pages are waiting';
    spreadPageNumber.textContent = `${activePage + 1} / ${pages}`;
    previousButton.disabled = activePage === 0 || loadingPage;
    nextButton.disabled = activePage >= pages - 1 || loadingPage;
    emptyState.hidden = pageEntries.length !== 0;
    if (!memoryIndex.length) setEmptyMessage('Our pages are waiting for their first little memory. Add one whenever you like.');
    else if (!visible.length) setEmptyMessage(`No ${filterNames[activeFilter] || 'memories'} on this chapter’s pages yet.`);
    renderFilterCounts();

    if (direction) {
      spreadStage.classList.remove('is-turning-next', 'is-turning-previous');
      void spreadStage.offsetWidth;
      spreadStage.classList.add(direction === 'previous' ? 'is-turning-previous' : 'is-turning-next');
      spreadStage.addEventListener('animationend', () => spreadStage.classList.remove('is-turning-next', 'is-turning-previous'), { once: true });
    }
    if (scrollToTop) spreadTitle.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

    if (!pageEntries.length) {
      grid.replaceChildren();
      loadingPage = false;
      previousButton.disabled = activePage === 0;
      nextButton.disabled = true;
      if (!memoryIndex.length) say(archiveStatus, 'Our pages are waiting for their first little memory. Add one whenever you like.');
      else if (!visible.length) say(archiveStatus, `There are no ${filterNames[activeFilter] || 'memories'} in ${monthTitle(activeMonth)} yet.`);
      return;
    }

    loadingPage = true;
    previousButton.disabled = true;
    nextButton.disabled = true;
    grid.classList.add('is-loading');
    grid.replaceChildren(...pageEntries.map(makeSkeleton));
    say(archiveStatus, `Turning to ${monthTitle(activeMonth)}…`);
    try {
      const pageMemories = await window.DiaryClient.getMemoriesByIds(pageEntries.map((memory) => memory.id));
      if (renderId !== pageRenderId) return;
      if (pageMemories.length !== pageEntries.length) throw new Error('A few memories changed while this page was opening. Refresh the diary to see the latest pages.');
      grid.replaceChildren(...pageMemories.map(createCard));
      const shownStart = first + 1;
      const shownEnd = first + pageMemories.length;
      say(archiveStatus, `${memoryIndex.length} ${memoryIndex.length === 1 ? 'memory' : 'memories'} tucked into our diary · showing ${shownStart}–${shownEnd} in this chapter.`);
    } catch (error) {
      if (renderId !== pageRenderId) return;
      const errorCard = document.createElement('div');
      errorCard.className = 'memory-load-error';
      const message = document.createElement('p');
      message.textContent = error.message || 'This spread could not open just now.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.dataset.retrySpread = '';
      retry.textContent = 'try this page again';
      errorCard.append(message, retry);
      grid.replaceChildren(errorCard);
      say(archiveStatus, 'We could not open this spread. Your saved memories are safe; please try again.', true);
    } finally {
      if (renderId === pageRenderId) {
        loadingPage = false;
        grid.classList.remove('is-loading');
        previousButton.disabled = activePage === 0;
        nextButton.disabled = activePage >= pages - 1;
      }
    }
  };

  const refreshArchive = async () => {
    if (loadingIndex) return;
    loadingIndex = true;
    refreshButton.disabled = true;
    refreshButton.setAttribute('aria-busy', 'true');
    say(archiveStatus, 'Gathering the latest pages from our diary…');
    try {
      const previousMonth = activeMonth;
      const result = await window.DiaryClient.listMemoryIndex();
      memoryIndex = result || [];
      indexLoaded = true;
      const months = [...new Set(memoryIndex.map(monthFor))].sort((a, b) => b.localeCompare(a));
      activeMonth = months.includes(previousMonth) ? previousMonth : months[0] || null;
      activePage = 0;
      renderChapterIndex();
      await renderSpread();
      if (memoryIndex.length) say(archiveStatus, `${memoryIndex.length} ${memoryIndex.length === 1 ? 'memory' : 'memories'} tucked into our diary. New uploads appear here when you refresh.`);
    } catch (error) {
      say(archiveStatus, error.message || 'Could not refresh the diary. Please try again.', true);
    } finally {
      loadingIndex = false;
      refreshButton.disabled = false;
      refreshButton.removeAttribute('aria-busy');
    }
  };

  const formatTime = (seconds) => `${Math.floor((seconds || 0) / 60)}:${Math.floor((seconds || 0) % 60).toString().padStart(2, '0')}`;
  const openMemory = async (index) => {
    if (!visible.length) return;
    currentIndex = (index + visible.length) % visible.length;
    const memoryIndexItem = visible[currentIndex];
    const renderId = ++viewerRenderId;
    document.querySelector('#memory-viewer-type').textContent = labels[memoryIndexItem.media_type] || 'KEPT CLOSE';
    document.querySelector('#memory-viewer-title').textContent = memoryIndexItem.title || 'A little memory';
    document.querySelector('#memory-viewer-date').textContent = prettyDate(itemDate(memoryIndexItem));
    document.querySelector('#memory-viewer-description').textContent = memoryIndexItem.caption || '';
    document.querySelector('#memory-viewer-count').textContent = `${currentIndex + 1} / ${visible.length}`;
    viewer.dataset.kind = memoryIndexItem.media_type;
    const loadingMessage = document.createElement('p');
    loadingMessage.className = 'viewer-loading';
    loadingMessage.textContent = 'Opening this little memory…';
    viewerStage.replaceChildren(loadingMessage);
    if (!viewer.open) viewer.showModal();
    try {
      const memory = await window.DiaryClient.getMemoryById(memoryIndexItem.id);
      if (renderId !== viewerRenderId || !viewer.open) return;
      viewerStage.replaceChildren();
      if (!memory?.signed_url) {
        const message = document.createElement('p');
        message.className = 'diary-live-status is-error';
        message.textContent = memory?.viewer_error || 'This keepsake could not be opened. Refresh the diary and try again.';
        viewerStage.append(message);
      } else if (memory.media_type === 'photo') {
        const frame = document.createElement('figure'); frame.className = 'memory-viewer__photo-frame';
        const image = document.createElement('img'); image.src = memory.signed_url; image.alt = memory.title;
        const caption = document.createElement('figcaption'); caption.textContent = memory.caption || memory.title;
        frame.append(image, caption); viewerStage.append(frame);
      } else if (memory.media_type === 'video') {
        const frame = document.createElement('div'); frame.className = 'memory-viewer__video-frame';
        const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = memory.signed_url;
        frame.append(video); viewerStage.append(frame);
      } else if (memory.media_type === 'voice') {
        const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
        const icon = document.createElement('span'); icon.textContent = '♫'; icon.setAttribute('aria-hidden', 'true');
        const label = document.createElement('p'); label.textContent = 'A VOICE TO KEEP CLOSE';
        const player = document.createElement('div'); player.className = 'voice-viewer';
        const audio = document.createElement('audio'); audio.src = memory.signed_url; audio.preload = 'metadata';
        const play = document.createElement('button'); play.className = 'voice-viewer__play'; play.type = 'button'; play.textContent = '▶'; play.setAttribute('aria-label', 'Play voice note');
        const body = document.createElement('div'); body.className = 'voice-viewer__body';
        const wave = document.createElement('div'); wave.className = 'voice-viewer__wave'; wave.setAttribute('aria-hidden', 'true');
        for (let index = 0; index < 25; index += 1) wave.append(document.createElement('i'));
        const progress = document.createElement('input'); progress.className = 'voice-viewer__progress'; progress.type = 'range'; progress.min = '0'; progress.max = '1000'; progress.value = '0'; progress.setAttribute('aria-label', 'Seek through voice note');
        const times = document.createElement('div'); times.className = 'voice-viewer__time';
        const elapsed = document.createElement('span'); const duration = document.createElement('span'); elapsed.textContent = '0:00'; duration.textContent = '0:00'; times.append(elapsed, duration);
        body.append(wave, progress, times); player.append(play, body); frame.append(icon, label, player, audio); viewerStage.append(frame);
        const update = () => {
          const total = Number.isFinite(audio.duration) ? audio.duration : 0;
          progress.value = String(Math.round(total ? audio.currentTime / total * 1000 : 0));
          elapsed.textContent = formatTime(audio.currentTime); duration.textContent = formatTime(total);
        };
        play.addEventListener('click', async () => { if (audio.paused) { try { await audio.play(); } catch {} } else audio.pause(); });
        audio.addEventListener('play', () => { play.textContent = 'Ⅱ'; play.setAttribute('aria-label', 'Pause voice note'); wave.classList.add('is-playing'); });
        audio.addEventListener('pause', () => { play.textContent = '▶'; play.setAttribute('aria-label', 'Play voice note'); wave.classList.remove('is-playing'); });
        audio.addEventListener('loadedmetadata', update); audio.addEventListener('timeupdate', update);
        progress.addEventListener('input', () => { if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = Number(progress.value) / 1000 * audio.duration; });
      } else if (memory.content_type === 'application/pdf') {
        const frame = document.createElement('div'); frame.className = 'memory-viewer__photo-frame';
        const documentView = document.createElement('iframe'); documentView.src = memory.signed_url; documentView.title = memory.title;
        frame.append(documentView); viewerStage.append(frame);
      } else if (memory.content_type === 'text/plain') {
        const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
        const note = document.createElement('pre'); note.textContent = 'Opening this little note…'; frame.append(note); viewerStage.append(frame);
        fetch(memory.signed_url).then((response) => { if (!response.ok) throw new Error('Could not open note'); return response.text(); }).then((text) => { note.textContent = text.slice(0, 20000); }).catch(() => { note.textContent = memory.caption || memory.title; });
      } else {
        const frame = document.createElement('div'); frame.className = 'memory-viewer__note-frame';
        const star = document.createElement('span'); star.textContent = '✦'; star.setAttribute('aria-hidden', 'true');
        const note = document.createElement('p'); note.className = 'memory-viewer__note-copy'; note.textContent = memory.caption || memory.title;
        frame.append(star, note); viewerStage.append(frame);
      }
    } catch (error) {
      if (renderId !== viewerRenderId || !viewer.open) return;
      const message = document.createElement('p'); message.className = 'diary-live-status is-error'; message.textContent = error.message || 'This keepsake could not be opened. Try again.'; viewerStage.replaceChildren(message);
    }
  };

  const turnSpread = (direction) => {
    if (pageTurning || loadingPage || loadingIndex) return;
    const lastPage = Math.max(0, Math.ceil(filteredMemories().length / getPageSize()) - 1);
    const nextPage = activePage + (direction === 'next' ? 1 : -1);
    if (nextPage < 0 || nextPage > lastPage) return;
    pageTurning = true;
    activePage = nextPage;
    void renderSpread(direction, true).finally(() => window.setTimeout(() => { pageTurning = false; }, 430));
  };

  const openArchive = async (knownSession = null) => {
    if (bookOpening) return;
    bookOpening = true;
    try {
      session = knownSession || await window.DiaryClient.getMemberSession();
      if (!session) {
        authPanel.classList.add('is-visible');
        say(authStatus, 'Sign in first, and then the diary will open for you.');
        authEmail.focus();
        return;
      }
      authPanel.hidden = true;
      signOutButton.hidden = false;
      book.classList.add('is-opening');
      openButton.setAttribute('aria-expanded', 'true');
      archiveContent.hidden = false;
      if (!indexLoaded) await refreshArchive();
      else await renderSpread();
      archiveContent.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    } catch (error) {
      say(authStatus, error.message || 'Could not open the diary. Please try again.', true);
    } finally {
      bookOpening = false;
    }
  };

  if (!window.DiaryClient.configured) say(authStatus, 'Add the Supabase project URL and publishable key to diary-config.js to connect the private diary.', true);
  openButton.addEventListener('click', () => { void openArchive(); });
  authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!window.DiaryClient.configured) return say(authStatus, 'Connect Supabase using backend/SETUP.md before signing in.', true);
    try {
      await window.DiaryClient.signInWithEmail(authEmail.value, '/archive.html');
      say(authStatus, 'Check your inbox for the private sign-in link. Open it in this browser.');
    } catch (error) {
      say(authStatus, error.message || 'Could not send the sign-in link.', true);
    }
  });
  filters.forEach((button) => button.addEventListener('click', () => {
    if (activeFilter === button.dataset.filter || loadingIndex) return;
    activeFilter = button.dataset.filter;
    activePage = 0;
    void renderSpread('next');
  }));
  previousButton.addEventListener('click', () => turnSpread('previous'));
  nextButton.addEventListener('click', () => turnSpread('next'));
  refreshButton.addEventListener('click', () => { void refreshArchive(); });
  grid.addEventListener('click', (event) => {
    const retry = event.target.closest('[data-retry-spread]');
    if (retry) { void renderSpread(); return; }
    const opener = event.target.closest('[data-memory-id]');
    if (!opener) return;
    const index = visible.findIndex((memory) => memory.id === opener.dataset.memoryId);
    if (index >= 0) void openMemory(index);
  });
  viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => {
    viewerRenderId += 1;
    viewerStage.querySelectorAll('audio,video').forEach((media) => media.pause());
  });
  viewer.querySelectorAll('[data-viewer-step]').forEach((button) => button.addEventListener('click', () => {
    if (visible.length) void openMemory(currentIndex + Number(button.dataset.viewerStep));
  }));
  signOutButton.addEventListener('click', async () => { await window.DiaryClient.signOut(); location.reload(); });

  const uploaderUrl = window.DIARY_CONFIG?.uploaderUrl?.trim();
  if (uploaderUrl) {
    uploaderLink.href = uploaderUrl;
    uploaderLink.target = '_blank';
    uploaderLink.rel = 'noopener noreferrer';
    emptyUploadLink.href = uploaderUrl;
    emptyUploadLink.target = '_blank';
    emptyUploadLink.rel = 'noopener noreferrer';
  } else {
    [uploaderLink, emptyUploadLink].forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      say(archiveStatus, 'The separate uploader site is not connected yet. Add its deployed URL to diary-config.js.', true);
    }));
  }

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
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
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
    if (nextSize !== pageSize && indexLoaded && !viewer.open) { pageSize = nextSize; activePage = 0; void renderSpread(); }
  }, { passive: true });
  if (location.hash === '#archive-content' && window.DiaryClient.configured) void openArchive();
  else if (window.DiaryClient.configured) {
    window.DiaryClient.getMemberSession().then((currentSession) => {
      if (!currentSession) return;
      authPanel.hidden = true;
      signOutButton.hidden = false;
      void openArchive(currentSession);
    }).catch((error) => say(authStatus, error.message || 'This account cannot access the diary.', true));
  }
})();
