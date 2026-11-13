(() => {
  const authForm = document.querySelector('#diary-auth-form');
  const authStatus = document.querySelector('#diary-auth-status');
  const authEmail = document.querySelector('#diary-email');
  const authDialog = document.querySelector('#diary-auth-dialog');
  const archiveStatus = document.querySelector('#archive-status');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const archiveContent = document.querySelector('#archive-content');
  const openButton = document.querySelector('#open-diary');
  const enterAlbumButton = document.querySelector('#enter-album');
  const storyStatus = document.querySelector('#story-status');
  const returnToStoryButton = document.querySelector('#return-to-story');
  const mobileOpenChapterButton = document.querySelector('#mobile-open-chapter');
  const mobileIndexBackButton = document.querySelector('#mobile-index-back');
  const readAsBookButton = document.querySelector('#read-as-book');
  const readingPage = document.querySelector('#book-reading-page');
  const readingMemoryCount = document.querySelector('#reading-memory-count');
  const exitReadingButton = document.querySelector('#exit-book-reading');
  const exitReadingMobileButton = document.querySelector('#exit-book-reading-mobile');
  const readingToolbar = document.querySelector('#reading-mode-toolbar');
  const book = document.querySelector('#diary-book');
  const grid = document.querySelector('#memory-grid');
  const chapterList = document.querySelector('#chapter-list');
  const chapterPicker = document.querySelector('#chapter-picker');
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
  const viewerFavoriteButton = document.querySelector('#memory-viewer-favorite');
  const signOutButton = document.querySelector('#diary-signout');
  const pageSoundToggle = document.querySelector('#diary-page-sound');
  const uploaderLink = document.querySelector('#archive-upload-link');
  const counts = [...document.querySelectorAll('[data-count]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const labels = { photo: 'PHOTO KEEPSAKE', video: 'A LITTLE FILM', voice: 'VOICE NOTE', 'little-things': 'A LITTLE THING' };
  const filterNames = { photo: 'photos', video: 'videos', voice: 'voice notes', 'little-things': 'little things', favorites: 'favorites' };

  let memoryIndex = [];
  let visible = [];
  let activeFilter = 'all';
  let activeMonth = null;
  let activePage = 0;
  let readingMode = false;
  let readingReturnState = null;
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
  let mobileFlipTimer = null;
  let pageSoundEnabled = false;
  let pageAudioContext = null;

  try { pageSoundEnabled = localStorage.getItem('diary-page-turn-sound') === 'on'; } catch (_) { /* Storage can be unavailable in private browsing. */ }
  const updatePageSoundToggle = () => {
    pageSoundToggle.textContent = pageSoundEnabled ? '♫ sound on' : '♫ sound off';
    pageSoundToggle.setAttribute('aria-pressed', String(pageSoundEnabled));
    pageSoundToggle.setAttribute('aria-label', `Page turn sound is ${pageSoundEnabled ? 'on' : 'off'}`);
  };
  const playPageTurnSound = () => {
    if (!pageSoundEnabled) return;
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) return;
    try {
      pageAudioContext ||= new AudioContextType();
      if (pageAudioContext.state === 'suspended') void pageAudioContext.resume();
      const duration = .34;
      const sampleCount = Math.floor(pageAudioContext.sampleRate * duration);
      const buffer = pageAudioContext.createBuffer(1, sampleCount, pageAudioContext.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let index = 0; index < sampleCount; index += 1) {
        const time = index / pageAudioContext.sampleRate;
        const fadeIn = Math.min(1, time / .025);
        const fadeOut = Math.min(1, (duration - time) / .085);
        const flutter = .62 + .38 * Math.sin(2 * Math.PI * (13 * time + 7 * time * time));
        samples[index] = (Math.random() * 2 - 1) * fadeIn * fadeOut * flutter * .7;
      }
      const source = pageAudioContext.createBufferSource();
      const highPass = pageAudioContext.createBiquadFilter();
      const lowPass = pageAudioContext.createBiquadFilter();
      const volume = pageAudioContext.createGain();
      source.buffer = buffer;
      highPass.type = 'highpass'; highPass.frequency.value = 260;
      lowPass.type = 'lowpass'; lowPass.frequency.value = 3100;
      volume.gain.value = .13;
      source.connect(highPass).connect(lowPass).connect(volume).connect(pageAudioContext.destination);
      source.start();
    } catch (_) { /* Keep page turns working if audio is unavailable. */ }
  };
  updatePageSoundToggle();

  function isMobileBook() {
    return window.matchMedia('(max-width: 650px)').matches
      || (window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 900 && window.innerHeight <= 500);
  }
  const setMobileBookPage = (page) => {
    if (!isMobileBook()) return;
    playPageTurnSound();
    window.clearTimeout(mobileFlipTimer);
    document.body.classList.toggle('is-mobile-index', page === 'index');
    document.body.classList.toggle('is-mobile-memory-page', page === 'memories');
    document.body.classList.remove('is-turning-to-index', 'is-turning-to-memories');
    void document.body.offsetWidth;
    document.body.classList.add(page === 'index' ? 'is-turning-to-index' : 'is-turning-to-memories');
    mobileFlipTimer = window.setTimeout(() => document.body.classList.remove('is-turning-to-index', 'is-turning-to-memories'), 560);
  };

  function getPageSize() {
    if (readingMode) return isMobileBook() ? 1 : 4;
    const width = window.innerWidth;
    if (isMobileBook()) return 2;
    if (width >= 1700) return 8;
    if (width >= 1200) return 6;
    return 4;
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
  const filteredMemories = () => {
    if (readingMode) return memoryIndex;
    return currentChapter().filter((memory) => activeFilter === 'all'
      || (activeFilter === 'favorites' ? memory.is_favorite : memory.media_type === activeFilter));
  };

  const renderChapterIndex = () => {
    const months = [...new Set(memoryIndex.map(monthFor))].sort((a, b) => b.localeCompare(a));
    chapterIndex.hidden = months.length === 0;
    chapterList.replaceChildren();
    const featuredMonths = months.slice(0, 3);
    if (activeMonth && !featuredMonths.includes(activeMonth) && months.length > 3) featuredMonths[2] = activeMonth;
    const olderMonths = months.filter((month) => !featuredMonths.includes(month));
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = olderMonths.length ? 'choose another chapter' : 'all chapters shown';
    chapterPicker.replaceChildren(placeholder);
    olderMonths.forEach((month) => {
      const option = document.createElement('option');
      option.value = month;
      option.textContent = `${monthTitle(month)} · ${memoryIndex.filter((memory) => monthFor(memory) === month).length}`;
      chapterPicker.append(option);
    });
    chapterPicker.closest('.chapter-more').hidden = olderMonths.length === 0;
    chapterPicker.value = olderMonths.includes(activeMonth) ? activeMonth : '';
    featuredMonths.forEach((month) => {
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
        renderSpread('next');
      });
      chapterList.append(button);
    });
  };

  const renderFilterCounts = () => {
    const items = readingMode ? memoryIndex : currentChapter();
    counts.forEach((node) => {
      const kind = node.dataset.count;
      const count = kind === 'all' ? items.length : kind === 'favorites'
        ? items.filter((memory) => memory.is_favorite).length
        : items.filter((memory) => memory.media_type === kind).length;
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
    chapterPicker.value = [...chapterPicker.options].some((option) => option.value === activeMonth) ? activeMonth : '';
  };

  const createCard = (memory) => {
    const type = kindOf(memory);
    const card = document.createElement('article');
    card.className = `memory-card memory-card--${type === 'little-things' ? 'note' : type}${memory.is_favorite ? ' is-favorite' : ''}`;
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
      if (memory.preview_poster) video.poster = memory.preview_poster;
      const play = document.createElement('span');
      play.textContent = '▶';
      play.setAttribute('aria-hidden', 'true');
      open.append(play);
    } else {
      if (type === 'little-things') {
        const envelope = document.createElement('span');
        envelope.className = 'memory-card__envelope';
        envelope.setAttribute('aria-hidden', 'true');
        const flap = document.createElement('i'); flap.className = 'memory-card__envelope-flap';
        const seal = document.createElement('i'); seal.className = 'memory-card__envelope-seal'; seal.textContent = '♡';
        envelope.append(flap, seal); open.append(envelope);
        const note = document.createElement('p');
        note.textContent = memory.caption || memory.title;
        open.append(note);
        const category = document.createElement('small'); category.textContent = 'A LITTLE LETTER · OPEN TO READ'; open.append(category);
      } else {
        const icon = document.createElement('span');
        icon.setAttribute('aria-hidden', 'true');
        icon.textContent = '♫';
        open.append(icon);
        const category = document.createElement('small'); category.textContent = 'A VOICE TO KEEP'; open.append(category);
      }
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
    if (memory.location) {
      const location = document.createElement('p');
      location.className = 'memory-card__location';
      location.textContent = `⌖ ${memory.location}`;
      details.append(location);
    }
    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.className = 'memory-card__favorite';
    favorite.dataset.favoriteId = memory.id;
    favorite.setAttribute('aria-pressed', String(Boolean(memory.is_favorite)));
    favorite.setAttribute('aria-label', memory.is_favorite ? `Remove ${memory.title} from our favorites` : `Save ${memory.title} to our favorites`);
    favorite.textContent = memory.is_favorite ? '♥' : '♡';

    const peek = document.createElement('div');
    peek.className = `memory-card__peek memory-card__peek--${type}`;
    peek.setAttribute('aria-hidden', 'true');
    const peekMedia = document.createElement('div');
    peekMedia.className = 'memory-card__peek-media';
    const peekCopy = document.createElement('p');
    peekCopy.className = 'memory-card__peek-copy';
    if (type === 'photo' && memory.signed_url) {
      const image = document.createElement('img'); image.src = memory.signed_url; image.alt = '';
      peekMedia.append(image);
      peekCopy.textContent = memory.caption || memory.title;
    } else if (type === 'video') {
      const video = document.createElement('video'); video.src = memory.signed_url || ''; video.muted = true; video.playsInline = true; video.preload = 'metadata';
      if (memory.preview_poster) video.poster = memory.preview_poster;
      peekMedia.append(video);
      peekCopy.textContent = memory.caption || 'A little film, saved close.';
    } else if (type === 'voice') {
      const icon = document.createElement('span'); icon.textContent = '♫'; icon.setAttribute('aria-hidden', 'true');
      peekMedia.append(icon);
      peekCopy.textContent = memory.caption || 'A voice note, saved close. Tap the card to listen.';
    } else {
      const envelope = document.createElement('span'); envelope.className = 'memory-card__peek-envelope'; envelope.textContent = '♡'; envelope.setAttribute('aria-hidden', 'true');
      peekMedia.append(envelope);
      peekCopy.textContent = memory.caption || 'Hold this little letter to read a few lines…';
    }
    const peekMeta = document.createElement('small');
    peekMeta.textContent = `${prettyDate(itemDate(memory))}${memory.location ? ` · ${memory.location}` : ''}`;
    peek.append(peekMedia, peekCopy, peekMeta);

    let peekLoaded = type !== 'little-things' || Boolean(memory.caption);
    const showPeek = () => {
      card.classList.add('is-peeking');
      peek.setAttribute('aria-hidden', 'false');
      if (!peekLoaded && memory.content_type === 'text/plain' && memory.signed_url) {
        peekLoaded = true;
        window.DiaryClient.getMemoryById(memory.id).then((freshMemory) => {
          if (!freshMemory?.signed_url) return;
          return fetch(freshMemory.signed_url).then((response) => response.ok ? response.text() : '').then((text) => {
            if (text && card.isConnected) peekCopy.textContent = text.trim().slice(0, 900);
          });
        }).catch(() => { /* The card remains openable if the quick preview cannot load. */ });
      }
    };
    const hidePeek = () => { card.classList.remove('is-peeking'); peek.setAttribute('aria-hidden', 'true'); };
    let holdTimer = 0;
    let pointerStart = null;
    let heldPeek = false;
    let suppressOpenClick = false;
    card.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') showPeek(); });
    card.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') hidePeek(); });
    open.addEventListener('focus', showPeek);
    open.addEventListener('blur', hidePeek);
    card.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
      if (event.target.closest('.memory-card__favorite')) return;
      pointerStart = { x: event.clientX, y: event.clientY };
      heldPeek = false;
      holdTimer = window.setTimeout(() => { heldPeek = true; suppressOpenClick = true; showPeek(); }, 460);
    });
    card.addEventListener('pointermove', (event) => {
      if (!pointerStart) return;
      if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 12) {
        window.clearTimeout(holdTimer);
        pointerStart = null;
        if (heldPeek) hidePeek();
        heldPeek = false;
      }
    });
    card.addEventListener('pointerup', () => {
      window.clearTimeout(holdTimer);
      pointerStart = null;
      if (heldPeek) hidePeek();
    });
    card.addEventListener('pointercancel', () => {
      window.clearTimeout(holdTimer); pointerStart = null; heldPeek = false; hidePeek();
    });
    open.addEventListener('click', (event) => {
      if (!suppressOpenClick) return;
      event.preventDefault(); event.stopPropagation(); suppressOpenClick = false;
    });
    open.addEventListener('contextmenu', (event) => event.preventDefault());

    card.append(open, details, favorite, peek);
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

  const renderSpread = async (direction = null) => {
    const renderId = ++pageRenderId;
    pageSize = getPageSize();
    visible = filteredMemories();
    const pages = Math.max(1, Math.ceil(visible.length / pageSize));
    activePage = Math.max(0, Math.min(activePage, pages - 1));
    const first = activePage * pageSize;
    const pageEntries = visible.slice(first, first + pageSize);

    spreadTitle.textContent = readingMode ? 'Our little story' : activeMonth ? monthTitle(activeMonth) : 'Our little diary';
    readingMemoryCount.textContent = String(memoryIndex.length);
    readAsBookButton.hidden = memoryIndex.length === 0;
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
      playPageTurnSound();
      const page = spreadStage.closest('.archive-page--memories') || spreadStage;
      page.classList.remove('is-turning-next', 'is-turning-previous');
      void page.offsetWidth;
      page.classList.add(direction === 'previous' ? 'is-turning-previous' : 'is-turning-next');
      page.addEventListener('animationend', () => page.classList.remove('is-turning-next', 'is-turning-previous'), { once: true });
    }

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
      const cards = pageMemories.map((memory) => ({
        ...memory,
        is_favorite: Boolean(memoryIndex.find((entry) => entry.id === memory.id)?.is_favorite),
      }));
      grid.replaceChildren(...cards.map(createCard));
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
    const location = document.querySelector('#memory-viewer-location');
    location.textContent = memoryIndexItem.location ? `⌖ ${memoryIndexItem.location}` : '';
    location.hidden = !memoryIndexItem.location;
    viewerFavoriteButton.dataset.favoriteId = memoryIndexItem.id;
    viewerFavoriteButton.setAttribute('aria-pressed', String(Boolean(memoryIndexItem.is_favorite)));
    viewerFavoriteButton.textContent = memoryIndexItem.is_favorite ? '♥ saved in our favorites' : '♡ save to our favorites';
    document.querySelector('#memory-viewer-description').textContent = memoryIndexItem.media_type === 'little-things' ? '' : memoryIndexItem.caption || '';
    document.querySelector('#memory-viewer-count').textContent = `${currentIndex + 1} / ${visible.length}`;
    viewer.dataset.kind = memoryIndexItem.media_type;
    viewer.classList.remove('is-video-compact');
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
        const frame = document.createElement('section'); frame.className = 'video-viewer'; frame.setAttribute('aria-label', 'Video memory player');
        const screen = document.createElement('div'); screen.className = 'video-viewer__screen';
        const video = document.createElement('video'); video.className = 'video-viewer__media'; video.controls = false; video.playsInline = true; video.preload = 'metadata'; video.src = memory.signed_url; video.setAttribute('aria-label', memory.title || 'A little film');
        const playOverlay = document.createElement('button'); playOverlay.className = 'video-viewer__play-overlay'; playOverlay.type = 'button'; playOverlay.setAttribute('aria-label', 'Play video'); playOverlay.textContent = '▶';
        const videoStatus = document.createElement('p'); videoStatus.className = 'video-viewer__status'; videoStatus.setAttribute('role', 'status'); videoStatus.hidden = true;
        screen.append(video, playOverlay, videoStatus);

        const controls = document.createElement('div'); controls.className = 'video-viewer__controls';
        const play = document.createElement('button'); play.className = 'video-viewer__control video-viewer__play'; play.type = 'button'; play.textContent = '▶'; play.setAttribute('aria-label', 'Play video');
        const elapsed = document.createElement('span'); elapsed.className = 'video-viewer__time video-viewer__time--elapsed'; elapsed.textContent = '0:00';
        const seek = document.createElement('input'); seek.className = 'video-viewer__seek'; seek.type = 'range'; seek.min = '0'; seek.max = '1000'; seek.value = '0'; seek.disabled = true; seek.setAttribute('aria-label', 'Seek through video');
        const duration = document.createElement('span'); duration.className = 'video-viewer__time video-viewer__time--duration'; duration.textContent = '0:00';
        const sound = document.createElement('button'); sound.className = 'video-viewer__control video-viewer__sound'; sound.type = 'button'; sound.textContent = '♫'; sound.setAttribute('aria-label', 'Mute video');
        const fullscreen = document.createElement('button'); fullscreen.className = 'video-viewer__control video-viewer__fullscreen'; fullscreen.type = 'button'; fullscreen.textContent = '⛶'; fullscreen.setAttribute('aria-label', 'Enter full screen');
        controls.append(play, elapsed, seek, duration, sound, fullscreen);
        frame.append(screen, controls); viewerStage.append(frame);

        const updatePlayback = () => {
          const playing = !video.paused && !video.ended;
          frame.classList.toggle('is-playing', playing);
          play.textContent = playing ? 'Ⅱ' : '▶';
          play.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
          playOverlay.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
          playOverlay.textContent = playing ? 'Ⅱ' : '▶';
          playOverlay.hidden = playing;
        };
        const updateTime = () => {
          const total = Number.isFinite(video.duration) ? video.duration : 0;
          const progress = total ? Math.min(100, Math.max(0, video.currentTime / total * 100)) : 0;
          elapsed.textContent = formatTime(video.currentTime);
          duration.textContent = formatTime(total);
          seek.value = String(Math.round(progress * 10));
          seek.style.setProperty('--seek-progress', `${progress}%`);
          seek.disabled = !total;
        };
        const togglePlayback = async () => {
          if (video.paused || video.ended) {
            try { await video.play(); } catch { videoStatus.textContent = 'This video could not be played. Try opening it again when the connection is steadier.'; videoStatus.hidden = false; }
          } else video.pause();
        };
        const updateFullscreen = () => {
          const active = document.fullscreenElement === frame;
          frame.classList.toggle('is-fullscreen', active);
          fullscreen.setAttribute('aria-label', active ? 'Exit full screen' : 'Enter full screen');
        };
        play.addEventListener('click', () => { void togglePlayback(); });
        playOverlay.addEventListener('click', () => { void togglePlayback(); });
        video.addEventListener('play', updatePlayback);
        video.addEventListener('pause', updatePlayback);
        video.addEventListener('ended', updatePlayback);
        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', () => {
          if (video.videoWidth && video.videoHeight) {
            const ratio = video.videoWidth / video.videoHeight;
            frame.style.setProperty('--video-ratio', String(ratio));
            screen.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
            viewer.classList.toggle('is-video-compact', ratio < 1.2);
          }
          updateTime();
        });
        video.addEventListener('durationchange', updateTime);
        video.addEventListener('error', () => { videoStatus.textContent = 'This video could not be loaded. Refresh the diary and try again.'; videoStatus.hidden = false; });
        seek.addEventListener('input', () => { if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = Number(seek.value) / 1000 * video.duration; });
        sound.addEventListener('click', () => {
          video.muted = !video.muted;
          frame.classList.toggle('is-muted', video.muted);
          sound.textContent = video.muted ? '×' : '♫';
          sound.setAttribute('aria-label', video.muted ? 'Unmute video' : 'Mute video');
        });
        fullscreen.addEventListener('click', async () => {
          try {
            if (document.fullscreenElement === frame) await document.exitFullscreen();
            else if (frame.requestFullscreen) await frame.requestFullscreen();
            else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
          } catch { videoStatus.textContent = 'Full screen is not available in this browser.'; videoStatus.hidden = false; }
        });
        frame.addEventListener('fullscreenchange', updateFullscreen);
        video.addEventListener('webkitendfullscreen', updateFullscreen);
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
      } else if (memory.media_type === 'little-things' && memory.content_type !== 'application/pdf') {
        const frame = document.createElement('section'); frame.className = 'memory-letter'; frame.setAttribute('aria-label', 'A little letter from your diary');
        const paper = document.createElement('article'); paper.className = 'memory-letter__paper';
        const heading = document.createElement('p'); heading.className = 'memory-letter__kicker'; heading.textContent = 'A LITTLE THOUGHT, KEPT CLOSE';
        const title = document.createElement('h3'); title.textContent = memory.title || 'A note for us';
        const message = document.createElement('p'); message.className = 'memory-letter__message'; message.textContent = memory.caption || (memory.content_type === 'text/plain' ? 'Opening this little letter…' : memory.title);
        const signature = document.createElement('span'); signature.className = 'memory-letter__signature'; signature.textContent = 'always, us  ♡';
        paper.append(heading, title, message, signature);
        const envelope = document.createElement('div'); envelope.className = 'memory-letter__envelope'; envelope.setAttribute('aria-hidden', 'true');
        const back = document.createElement('span'); back.className = 'memory-letter__back';
        const front = document.createElement('span'); front.className = 'memory-letter__front';
        const flap = document.createElement('span'); flap.className = 'memory-letter__flap';
        const seal = document.createElement('span'); seal.className = 'memory-letter__seal'; seal.textContent = '♡';
        envelope.append(back, front, flap, seal); frame.append(paper, envelope); viewerStage.append(frame);
        if (!memory.caption && memory.content_type === 'text/plain') {
          fetch(memory.signed_url).then((response) => { if (!response.ok) throw new Error('Could not open letter'); return response.text(); }).then((text) => {
            if (renderId === viewerRenderId && viewer.open) message.textContent = text.slice(0, 20000);
          }).catch(() => { if (renderId === viewerRenderId && viewer.open) message.textContent = memory.title || 'This little letter could not be opened.'; });
        }
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

  const setFavorite = async (memoryId, button) => {
    const memory = memoryIndex.find((entry) => entry.id === memoryId);
    if (!memory || button?.disabled) return;
    const nextValue = !memory.is_favorite;
    if (button) button.disabled = true;
    try {
      await window.DiaryClient.setMemoryFavorite(memoryId, nextValue);
      memory.is_favorite = nextValue;
      if (viewerFavoriteButton.dataset.favoriteId === memoryId) {
        viewerFavoriteButton.setAttribute('aria-pressed', String(nextValue));
        viewerFavoriteButton.textContent = nextValue ? '♥ saved in our favorites' : '♡ save to our favorites';
      }
      say(archiveStatus, nextValue ? 'Tucked into our shared favorites.' : 'Removed from our shared favorites.');
      if (viewer.open && activeFilter === 'favorites' && !nextValue && !readingMode) viewer.close();
      await renderSpread();
    } catch (error) {
      say(archiveStatus, error.message || 'That favorite could not be saved just now. Try again.', true);
    } finally {
      if (button?.isConnected) button.disabled = false;
    }
  };

  const enterReadingMode = () => {
    if (!indexLoaded || loadingIndex || readingMode) return;
    readingReturnState = { activeMonth, activeFilter, activePage };
    readingMode = true;
    activeMonth = null;
    activeFilter = 'all';
    activePage = 0;
    archiveContent.classList.add('is-reading-mode');
    document.body.classList.add('is-reading-mode');
    readingPage.hidden = false;
    readingToolbar.hidden = false;
    readAsBookButton.setAttribute('aria-pressed', 'true');
    if (isMobileBook()) setMobileBookPage('memories');
    void renderSpread('next');
    if (isMobileBook()) spreadTitle.focus({ preventScroll: true });
    else exitReadingButton.focus({ preventScroll: true });
  };

  const exitReadingMode = () => {
    if (!readingMode) return;
    readingMode = false;
    archiveContent.classList.remove('is-reading-mode');
    document.body.classList.remove('is-reading-mode');
    readingPage.hidden = true;
    readingToolbar.hidden = true;
    readAsBookButton.setAttribute('aria-pressed', 'false');
    if (isMobileBook()) setMobileBookPage('index');
    if (readingReturnState) {
      activeMonth = readingReturnState.activeMonth;
      activeFilter = readingReturnState.activeFilter;
      activePage = readingReturnState.activePage;
    }
    readingReturnState = null;
    renderChapterIndex();
    void renderSpread();
    readAsBookButton.focus({ preventScroll: true });
  };

  const turnSpread = (direction) => {
    if (pageTurning || loadingPage || loadingIndex) return;
    if (isMobileBook() && document.body.classList.contains('is-mobile-index')) {
      if (direction === 'next') setMobileBookPage('memories');
      return;
    }
    const lastPage = Math.max(0, Math.ceil(filteredMemories().length / getPageSize()) - 1);
    const nextPage = activePage + (direction === 'next' ? 1 : -1);
    if (nextPage < 0 || nextPage > lastPage) return;
    pageTurning = true;
    activePage = nextPage;
    void renderSpread(direction).finally(() => window.setTimeout(() => { pageTurning = false; }, 560));
  };

  const openArchive = async (knownSession = null) => {
    if (bookOpening) return;
    bookOpening = true;
    try {
      // The illustrated story page is public and should turn open immediately.
      // Network/auth latency must not block the book animation; the private
      // album checks the session when the reader turns to their memories.
      book.classList.add('is-opening');
      openButton.setAttribute('aria-expanded', 'true');
      document.body.classList.add('is-story-open');
      enterAlbumButton.hidden = false;
      say(storyStatus, 'Our story began here. Turn the page when you’re ready.');
      session = knownSession || session;
      if (!knownSession && !session) {
        void window.DiaryClient.getMemberSession().then((currentSession) => {
          if (!currentSession) return;
          session = currentSession;
          signOutButton.hidden = false;
        }).catch(() => { /* Keep the story page available if session lookup is offline. */ });
      }
    } catch (error) {
      // A memory list failure should not prevent the illustrated first page.
      enterAlbumButton.hidden = false;
      say(storyStatus, 'Our story began here. Turn the page when you’re ready.');
      say(archiveStatus, error.message || 'The memories could not load just now. Refresh the diary to try again.', true);
    } finally {
      bookOpening = false;
    }
  };

  const enterAlbum = async () => {
    if (bookOpening) return;
    bookOpening = true;
    try {
      if (!session) session = await window.DiaryClient.getMemberSession();
      if (!session) {
        say(authStatus, 'Sign in to open your private memories.');
        if (!authDialog.open) authDialog.showModal();
        window.setTimeout(() => authEmail.focus(), 80);
        return;
      }
      if (authDialog.open) authDialog.close();
      signOutButton.hidden = false;
      if (!indexLoaded) await refreshArchive();
      archiveContent.hidden = false;
      document.body.classList.remove('is-story-open');
      document.body.classList.add('is-album-open');
      document.documentElement.classList.add('is-album-open');
      themeColor.setAttribute('content', '#e9decd');
      if (isMobileBook()) setMobileBookPage('index');
      if (location.hash !== '#archive-content') history.replaceState(null, '', '#archive-content');
      archiveContent.querySelector('#archive-title').focus({ preventScroll: true });
    } catch (error) {
      say(authStatus, error.message || 'Could not open the private diary. Please try again.', true);
      if (!authDialog.open) authDialog.showModal();
    } finally {
      bookOpening = false;
    }
  };

  const returnToStory = () => {
    archiveContent.hidden = true;
    document.body.classList.remove('is-album-open');
    document.documentElement.classList.remove('is-album-open');
    document.body.classList.remove('is-mobile-index', 'is-mobile-memory-page');
    document.body.classList.add('is-story-open');
    themeColor.setAttribute('content', '#160f24');
    if (location.hash) history.replaceState(null, '', `${location.pathname}${location.search}`);
    enterAlbumButton.focus({ preventScroll: true });
  };

  if (!window.DiaryClient.configured) say(authStatus, 'Add the Supabase project URL and publishable key to diary-config.js to connect the private diary.', true);
  openButton.addEventListener('click', () => { void openArchive(); });
  enterAlbumButton.addEventListener('click', () => { void enterAlbum(); });
  mobileOpenChapterButton.addEventListener('click', () => {
    setMobileBookPage('memories');
    spreadTitle.focus({ preventScroll: true });
  });
  mobileIndexBackButton.addEventListener('click', () => {
    setMobileBookPage('index');
    document.querySelector('#archive-title').focus({ preventScroll: true });
  });
  readAsBookButton.addEventListener('click', enterReadingMode);
  exitReadingButton.addEventListener('click', exitReadingMode);
  exitReadingMobileButton.addEventListener('click', exitReadingMode);
  returnToStoryButton.addEventListener('click', returnToStory);
  authDialog.querySelector('[data-auth-close]').addEventListener('click', () => authDialog.close());
  authDialog.addEventListener('click', (event) => { if (event.target === authDialog) authDialog.close(); });
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
  chapterPicker.addEventListener('change', () => {
    if (!chapterPicker.value || chapterPicker.value === activeMonth) return;
    activeMonth = chapterPicker.value;
    activePage = 0;
    renderChapterIndex();
    renderSpread('next');
  });
  previousButton.addEventListener('click', () => turnSpread('previous'));
  nextButton.addEventListener('click', () => turnSpread('next'));
  refreshButton.addEventListener('click', () => { void refreshArchive(); });
  pageSoundToggle.addEventListener('click', () => {
    pageSoundEnabled = !pageSoundEnabled;
    try { localStorage.setItem('diary-page-turn-sound', pageSoundEnabled ? 'on' : 'off'); } catch (_) { /* Sound remains enabled for this visit. */ }
    updatePageSoundToggle();
    if (pageSoundEnabled) {
      const AudioContextType = window.AudioContext || window.webkitAudioContext;
      if (AudioContextType) {
        try { pageAudioContext ||= new AudioContextType(); void pageAudioContext.resume(); } catch (_) { /* The visual page turn remains available. */ }
      }
    }
  });
  grid.addEventListener('click', (event) => {
    const retry = event.target.closest('[data-retry-spread]');
    if (retry) { void renderSpread(); return; }
    const favorite = event.target.closest('[data-favorite-id]');
    if (favorite) { event.preventDefault(); event.stopPropagation(); void setFavorite(favorite.dataset.favoriteId, favorite); return; }
    const opener = event.target.closest('[data-memory-id]');
    if (!opener) return;
    const index = visible.findIndex((memory) => memory.id === opener.dataset.memoryId);
    if (index >= 0) void openMemory(index);
  });
  viewer.querySelector('[data-viewer-close]').addEventListener('click', () => viewer.close());
  viewerFavoriteButton.addEventListener('click', () => void setFavorite(viewerFavoriteButton.dataset.favoriteId, viewerFavoriteButton));
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => {
    viewerRenderId += 1;
    viewerStage.querySelectorAll('audio,video').forEach((media) => media.pause());
  });
  viewer.querySelectorAll('[data-viewer-step]').forEach((button) => button.addEventListener('click', () => {
    if (visible.length) void openMemory(currentIndex + Number(button.dataset.viewerStep));
  }));
  let viewerTouchStart = null;
  viewerStage.addEventListener('touchstart', (event) => {
    if (!viewer.open || event.target.closest('button,input,audio,video,select')) return;
    const touch = event.changedTouches[0];
    viewerTouchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  viewerStage.addEventListener('touchend', (event) => {
    if (!viewerTouchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - viewerTouchStart.x;
    const deltaY = touch.clientY - viewerTouchStart.y;
    viewerTouchStart = null;
    if (visible.length && Math.abs(deltaX) > 64 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      void openMemory(currentIndex + (deltaX < 0 ? 1 : -1));
    }
  }, { passive: true });
  viewerStage.addEventListener('touchcancel', () => { viewerTouchStart = null; }, { passive: true });
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
  let mobileIndexTouchStart = null;
  document.querySelector('#archive-book-spread').addEventListener('touchstart', (event) => {
    if (!isMobileBook() || !document.body.classList.contains('is-mobile-index') || event.target.closest('button,a,select')) return;
    const touch = event.changedTouches[0];
    mobileIndexTouchStart = { x: touch.clientX, y: touch.clientY };
  }, { passive: true });
  document.querySelector('#archive-book-spread').addEventListener('touchend', (event) => {
    if (!mobileIndexTouchStart) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - mobileIndexTouchStart.x;
    const deltaY = touch.clientY - mobileIndexTouchStart.y;
    mobileIndexTouchStart = null;
    if (deltaX < -58 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) setMobileBookPage('memories');
  }, { passive: true });
  document.querySelector('#archive-book-spread').addEventListener('touchcancel', () => { mobileIndexTouchStart = null; }, { passive: true });
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
  if (window.DiaryClient.configured) {
    window.DiaryClient.getMemberSession().then((currentSession) => {
      if (!currentSession) return;
      session = currentSession;
      signOutButton.hidden = false;
      if (location.hash === '#archive-content') {
        void openArchive(currentSession).then(() => enterAlbum());
      }
    }).catch((error) => say(authStatus, error.message || 'This account cannot access the diary.', true));
  }
})();
