const revealItems = document.querySelectorAll('.reveal');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const birthdayCountdown = document.querySelector('#birthday-countdown');
if (birthdayCountdown) {
  const birthdayLabel = birthdayCountdown.querySelector('#birthday-countdown-label');
  const birthdayNumbers = birthdayCountdown.querySelector('#birthday-countdown-numbers');
  const birthdayUnits = Object.fromEntries(
    [...birthdayCountdown.querySelectorAll('[data-countdown-unit]')]
      .map((unit) => [unit.dataset.countdownUnit, unit])
  );
  const indiaDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const indiaDateParts = (date) => Object.fromEntries(
    indiaDateFormatter.formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  const updateBirthdayCountdown = () => {
    const now = new Date();
    const today = indiaDateParts(now);
    let targetYear = today.year;
    if (today.month > 11 || (today.month === 11 && today.day >= 19)) targetYear += 1;
    const nextBirthday = Date.UTC(targetYear, 10, 18, 18, 30);
    const remainingSeconds = Math.max(0, Math.floor((nextBirthday - now.getTime()) / 1000));
    const days = Math.floor(remainingSeconds / 86400);
    const hours = Math.floor((remainingSeconds % 86400) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;
    birthdayLabel.textContent = `Counting down to your day · November 19, ${targetYear} · India time`;
    birthdayUnits.days.textContent = String(days);
    birthdayUnits.hours.textContent = String(hours).padStart(2, '0');
    birthdayUnits.minutes.textContent = String(minutes).padStart(2, '0');
    birthdayUnits.seconds.textContent = String(seconds).padStart(2, '0');
  };

  updateBirthdayCountdown();
  window.setInterval(updateBirthdayCountdown, 1000);
}

if ('IntersectionObserver' in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

const envelope = document.querySelector('.envelope');
const letter = document.querySelector('#letter-paper');

envelope.addEventListener('click', () => {
  const isOpen = envelope.getAttribute('aria-expanded') === 'true';
  envelope.setAttribute('aria-expanded', String(!isOpen));
  envelope.classList.toggle('is-open', !isOpen);
  letter.classList.toggle('is-visible', !isOpen);
  letter.setAttribute('aria-hidden', String(isOpen));
  envelope.querySelector('.envelope__hint').textContent = isOpen ? 'tap to open' : 'tap to close';
});

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  nav.classList.toggle('is-open', !isOpen);
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  });
});

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
};

const mediaItems = [...document.querySelectorAll('.sound-card__media')];

document.querySelectorAll('.audio-player').forEach((player) => {
  const media = player.querySelector('.sound-card__media');
  const playButton = player.querySelector('.audio-play-button');
  const progress = player.querySelector('.audio-progress');
  const currentTime = player.querySelector('.audio-current');
  const durationTime = player.querySelector('.audio-duration');

  const updateProgress = () => {
    const duration = Number.isFinite(media.duration) ? media.duration : 0;
    const percentage = duration ? (media.currentTime / duration) * 100 : 0;
    progress.value = String(Math.round(percentage * 10));
    progress.style.setProperty('--progress', `${percentage}%`);
    currentTime.textContent = formatTime(media.currentTime);
    durationTime.textContent = formatTime(duration);
    progress.setAttribute('aria-valuetext', `${formatTime(media.currentTime)} of ${formatTime(duration)}`);
  };

  const setPlaying = (isPlaying) => {
    player.classList.toggle('is-playing', isPlaying);
    playButton.setAttribute('aria-pressed', String(isPlaying));
    const trackLabel = player.dataset.audioLabel || playButton.getAttribute('aria-label').replace(/^(Play|Pause)\s+/, '');
    playButton.setAttribute('aria-label', `${isPlaying ? 'Pause' : 'Play'} ${trackLabel}`);
  };

  playButton.addEventListener('click', async () => {
    if (media.paused) {
      mediaItems.forEach((otherMedia) => {
        if (otherMedia !== media && !otherMedia.paused) otherMedia.pause();
      });
      try {
        await media.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
      }
    } else {
      media.pause();
      setPlaying(false);
    }
  });

  progress.addEventListener('input', () => {
    if (Number.isFinite(media.duration) && media.duration > 0) {
      media.currentTime = (Number(progress.value) / 1000) * media.duration;
    }
  });

  media.addEventListener('loadedmetadata', updateProgress);
  media.addEventListener('durationchange', updateProgress);
  media.addEventListener('timeupdate', updateProgress);
  media.addEventListener('play', () => setPlaying(true));
  media.addEventListener('pause', () => setPlaying(false));
  media.addEventListener('ended', () => {
    setPlaying(false);
    media.currentTime = 0;
    updateProgress();
  });
});

const setupVoicePlaylist = (playlist, labelPrefix) => {
  const tracks = [...playlist.querySelectorAll('.voice-track-list li')];
  const media = playlist.querySelector('.sound-card__media');
  const player = playlist.querySelector('.audio-player');
  const playButton = player.querySelector('.audio-play-button');
  const progress = player.querySelector('.audio-progress');
  const currentTime = player.querySelector('.audio-current');
  const durationTime = player.querySelector('.audio-duration');
  const trackTitle = playlist.querySelector('.voice-track-title');
  const trackCount = playlist.querySelector('.voice-track-count');
  let currentTrack = 0;

  const loadTrack = (index, resumePlayback = false) => {
    currentTrack = (index + tracks.length) % tracks.length;
    const track = tracks[currentTrack];
    const label = `${labelPrefix} ${currentTrack + 1} of ${tracks.length}`;
    media.pause();
    media.src = track.dataset.src;
    media.load();
    player.dataset.audioLabel = label;
    playButton.setAttribute('aria-label', `Play ${label}`);
    trackTitle.textContent = track.dataset.title;
    trackCount.innerHTML = `${String(currentTrack + 1).padStart(2, '0')} <i>/</i> ${String(tracks.length).padStart(2, '0')}`;
    progress.value = '0';
    progress.style.setProperty('--progress', '0%');
    currentTime.textContent = '0:00';
    durationTime.textContent = '0:00';
    if (resumePlayback) {
      mediaItems.forEach((otherMedia) => {
        if (otherMedia !== media && !otherMedia.paused) otherMedia.pause();
      });
      media.play().catch(() => player.classList.remove('is-playing'));
    }
  };

  playlist.querySelectorAll('[data-playlist-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const shouldContinue = !media.paused;
      loadTrack(currentTrack + Number(button.dataset.playlistStep), shouldContinue);
    });
  });

  loadTrack(0);
};

setupVoicePlaylist(
  document.querySelector('[data-voice-playlist]'),
  'Ammu’s Hindi lyrics voice note',
);
setupVoicePlaylist(
  document.querySelector('[data-my-voice-playlist]'),
  'My voice note',
);

const secretStarButton = document.querySelector('.secret-star');
const secretStarNote = document.querySelector('#secret-star-note');

secretStarButton.addEventListener('click', () => {
  const isOpen = secretStarButton.getAttribute('aria-expanded') === 'true';
  secretStarButton.setAttribute('aria-expanded', String(!isOpen));
  secretStarNote.hidden = isOpen;
  secretStarButton.classList.toggle('is-open', !isOpen);
});
