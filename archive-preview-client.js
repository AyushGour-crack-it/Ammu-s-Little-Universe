const openDiaryButton = document.querySelector('#open-diary');
const diaryBook = document.querySelector('#diary-book');
const archiveContent = document.querySelector('#archive-content');

if (openDiaryButton && diaryBook && archiveContent) {
  openDiaryButton.addEventListener('click', () => {
    if (diaryBook.classList.contains('is-opening')) return;
    diaryBook.classList.add('is-opening');
    openDiaryButton.setAttribute('aria-expanded', 'true');
    window.setTimeout(() => {
      archiveContent.hidden = false;
      archiveContent.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }, 650);
  });
}

const archiveFilters = [...document.querySelectorAll('[data-filter]')];
const memoryCards = [...document.querySelectorAll('.memory-card[data-category]')];

archiveFilters.forEach((filter) => {
  filter.addEventListener('click', () => {
    const selected = filter.dataset.filter;
    archiveFilters.forEach((button) => {
      const isActive = button === filter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    memoryCards.forEach((card) => {
      card.hidden = selected !== 'all' && card.dataset.category !== selected;
    });
  });
});

const memoryViewer = document.querySelector('#memory-viewer');
const viewerStage = document.querySelector('#memory-viewer-stage');
const viewerType = document.querySelector('#memory-viewer-type');
const viewerTitle = document.querySelector('#memory-viewer-title');
const viewerDate = document.querySelector('#memory-viewer-date');
const viewerDescription = document.querySelector('#memory-viewer-description');
const viewerCount = document.querySelector('#memory-viewer-count');
const memoryOpeners = [...document.querySelectorAll('[data-memory-open]')];
let currentMemory = null;

const formatViewerTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
};

const buildVoiceViewer = (source) => {
  const frame = document.createElement('div');
  frame.className = 'memory-viewer__note-frame';
  const icon = document.createElement('span');
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '♫';
  const label = document.createElement('p');
  label.textContent = 'A VOICE TO KEEP CLOSE';
  const player = document.createElement('div');
  player.className = 'voice-viewer';
  const audio = document.createElement('audio');
  audio.src = source;
  audio.preload = 'metadata';
  const play = document.createElement('button');
  play.className = 'voice-viewer__play';
  play.type = 'button';
  play.setAttribute('aria-label', 'Play voice note');
  play.textContent = '▶';
  const body = document.createElement('div');
  body.className = 'voice-viewer__body';
  const waveform = document.createElement('div');
  waveform.className = 'voice-viewer__wave';
  waveform.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 25; i += 1) waveform.append(document.createElement('i'));
  const progress = document.createElement('input');
  progress.className = 'voice-viewer__progress';
  progress.type = 'range';
  progress.min = '0';
  progress.max = '1000';
  progress.value = '0';
  progress.setAttribute('aria-label', 'Seek through voice note');
  const times = document.createElement('div');
  times.className = 'voice-viewer__time';
  const elapsed = document.createElement('span');
  const total = document.createElement('span');
  elapsed.textContent = '0:00';
  total.textContent = '0:00';
  times.append(elapsed, total);
  body.append(waveform, progress, times);
  player.append(play, body);
  frame.append(icon, label, player, audio);

  const update = () => {
    const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
    const percent = duration ? (audio.currentTime / duration) * 100 : 0;
    progress.value = String(Math.round(percent * 10));
    elapsed.textContent = formatViewerTime(audio.currentTime);
    total.textContent = formatViewerTime(duration);
  };
  play.addEventListener('click', async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        play.textContent = '▶';
      }
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('play', () => {
    play.textContent = 'Ⅱ';
    play.setAttribute('aria-label', 'Pause voice note');
    waveform.classList.add('is-playing');
  });
  audio.addEventListener('pause', () => {
    play.textContent = '▶';
    play.setAttribute('aria-label', 'Play voice note');
    waveform.classList.remove('is-playing');
  });
  audio.addEventListener('loadedmetadata', update);
  audio.addEventListener('timeupdate', update);
  audio.addEventListener('ended', () => {
    audio.currentTime = 0;
    update();
  });
  progress.addEventListener('input', () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) audio.currentTime = (Number(progress.value) / 1000) * audio.duration;
  });
  return frame;
};

const renderMemory = (opener) => {
  currentMemory = opener;
  const { kind, src, poster, title, date, description } = opener.dataset;
  memoryViewer.dataset.kind = kind;
  viewerType.textContent = ({ photo: 'PHOTO KEEPSAKE', video: 'A LITTLE FILM', voice: 'VOICE NOTE', 'little-things': 'A LITTLE THING' })[kind] || 'KEPT CLOSE';
  viewerTitle.textContent = title || 'A little memory';
  viewerDate.textContent = date || '';
  viewerDescription.textContent = description || '';
  viewerStage.replaceChildren();

  if (kind === 'photo') {
    const frame = document.createElement('figure');
    frame.className = 'memory-viewer__photo-frame';
    const image = document.createElement('img');
    image.src = src;
    image.alt = title || 'Saved photo';
    const caption = document.createElement('figcaption');
    caption.textContent = title || 'A little moment, kept close';
    frame.append(image, caption);
    viewerStage.append(frame);
  } else if (kind === 'video') {
    const frame = document.createElement('div');
    frame.className = 'memory-viewer__video-frame';
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    if (poster) video.poster = poster;
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.append(source);
    frame.append(video);
    viewerStage.append(frame);
  } else if (kind === 'voice') {
    viewerStage.append(buildVoiceViewer(src));
  } else {
    const frame = document.createElement('div');
    frame.className = 'memory-viewer__note-frame';
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '✦';
    const note = document.createElement('p');
    note.className = 'memory-viewer__note-copy';
    note.textContent = description || title || 'A little thing worth keeping';
    frame.append(icon, note);
    viewerStage.append(frame);
  }

  const visibleMemories = memoryOpeners.filter((item) => !item.closest('.memory-card')?.hidden);
  viewerCount.textContent = `${visibleMemories.indexOf(opener) + 1} / ${visibleMemories.length}`;
};

memoryOpeners.forEach((opener) => {
  opener.addEventListener('click', () => {
    renderMemory(opener);
    if (!memoryViewer.open) memoryViewer.showModal();
  });
});

memoryViewer.querySelector('[data-viewer-close]').addEventListener('click', () => memoryViewer.close());
memoryViewer.addEventListener('click', (event) => {
  if (event.target === memoryViewer) memoryViewer.close();
});
memoryViewer.addEventListener('close', () => {
  viewerStage.querySelectorAll('audio, video').forEach((media) => media.pause());
});
memoryViewer.querySelectorAll('[data-viewer-step]').forEach((button) => {
  button.addEventListener('click', () => {
    const visibleMemories = memoryOpeners.filter((item) => !item.closest('.memory-card')?.hidden);
    const currentIndex = visibleMemories.indexOf(currentMemory);
    const nextIndex = (currentIndex + Number(button.dataset.viewerStep) + visibleMemories.length) % visibleMemories.length;
    renderMemory(visibleMemories[nextIndex]);
  });
});
