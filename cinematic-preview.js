(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opening = document.querySelector('.opening');
  const environment = document.querySelector('.environment');
  const route = document.querySelector('#flight-route');
  const mobileRoute = document.querySelector('#flight-route-mobile');
  const plane = document.querySelector('#paper-plane');
  const card = document.querySelector('#message-card');
  const paper = document.querySelector('#first-message');
  const skip = document.querySelector('#skip-intro');
  const soundToggle = document.querySelector('#sound-toggle');
  const soundLabel = soundToggle.querySelector('.sound-toggle__label');
  const progressBar = document.querySelector('#reading-progress-bar');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const supportsMotion = Boolean(gsap && ScrollTrigger);
  let soundEnabled = false;
  let messageOpen = false;
  let audioContext;
  let intro;
  let lilyBloomTimeline;
  let lilySwayTimeline;
  let lilyBloomHasRun = false;

  const activeRoute = () => window.matchMedia('(max-width: 760px)').matches && mobileRoute ? mobileRoute : route;
  const setIntroVisible = () => document.documentElement.classList.add('intro-ready');
  const placePlane = (progress = 1) => {
    const active = activeRoute();
    if (!active || !plane) return;
    const length = active.getTotalLength();
    const distance = Math.max(0, Math.min(1, progress)) * length;
    const point = active.getPointAtLength(distance);
    const near = active.getPointAtLength(Math.min(distance + 2, length));
    const angle = Math.atan2(near.y - point.y, near.x - point.x) * (180 / Math.PI);
    plane.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
  };
  const setRouteDraw = (progress) => {
    const active = activeRoute();
    if (!active) return;
    const length = active.getTotalLength();
    active.style.strokeDasharray = `${length}`;
    active.style.strokeDashoffset = `${length * (1 - progress)}`;
  };

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      audioContext ||= new AudioCtx();
      if (audioContext.state === 'suspended') void audioContext.resume();
      const now = audioContext.currentTime;
      [659.25, 880].forEach((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(.0001, now + index * .095);
        gain.gain.exponentialRampToValueAtTime(.025, now + index * .095 + .035);
        gain.gain.exponentialRampToValueAtTime(.0001, now + index * .095 + .46);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now + index * .095);
        oscillator.stop(now + index * .095 + .48);
      });
    } catch { /* sound is optional; the story remains fully usable without it */ }
  };

  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Turn gentle interaction sounds off' : 'Enable gentle interaction sounds');
    soundLabel.textContent = soundEnabled ? 'sound on' : 'sound off';
    if (soundEnabled) playChime();
  });

  const hidePaperAfterClose = (event) => {
    if (event.propertyName === 'opacity' && card.getAttribute('aria-expanded') !== 'true') paper.hidden = true;
  };
  paper.addEventListener('transitionend', hidePaperAfterClose);
  card.addEventListener('click', () => {
    const openingMessage = !messageOpen;
    messageOpen = openingMessage;
    if (openingMessage) {
      paper.hidden = false;
      requestAnimationFrame(() => {
        if (messageOpen) card.setAttribute('aria-expanded', 'true');
      });
    } else {
      card.setAttribute('aria-expanded', 'false');
    }
    card.setAttribute('aria-label', openingMessage ? 'Close our first message' : 'Open our first message');
    if (openingMessage) playChime();
    if (!openingMessage && (reducedMotion || !supportsMotion)) paper.hidden = true;
  });

  const finishIntro = () => {
    setIntroVisible();
    setRouteDraw(1);
    placePlane(1);
    skip.querySelector('span')?.remove();
    skip.textContent = 'Replay intro ↺';
    skip.setAttribute('aria-label', 'Replay the opening animation');
  };

  if (!supportsMotion || reducedMotion) {
    setIntroVisible();
    setRouteDraw(1);
    placePlane(1);
    skip.textContent = reducedMotion ? 'Motion reduced' : 'Intro complete';
    skip.disabled = true;
    skip.setAttribute('aria-label', reducedMotion ? 'Opening animation is reduced by your motion setting' : 'Opening animation complete');
  } else {
    gsap.registerPlugin(ScrollTrigger);
    const farStars = [...document.querySelectorAll('.star-layer--far .star')];
    const nearStars = [...document.querySelectorAll('.star-layer--near .star')];
    const planeProgress = { value: 0 };
    const active = activeRoute();
    if (active) {
      const length = active.getTotalLength();
      active.style.strokeDasharray = `${length}`;
      active.style.strokeDashoffset = `${length}`;
    }
    placePlane(0);
    intro = gsap.timeline({ paused: true, onStart: () => { skip.textContent = 'Skip intro ↗'; }, onComplete: finishIntro });
    intro
      .to(environment, { opacity: 1, duration: .95, ease: 'power1.out' }, 0)
      .to(farStars, { autoAlpha: .72, duration: .3, stagger: .075, ease: 'sine.out' }, .14)
      .to(nearStars, { autoAlpha: .86, duration: .28, stagger: .105, ease: 'sine.out' }, .48)
      .to('.moon-halo', { autoAlpha: .52, scale: 1.08, duration: 1.05, ease: 'power2.out' }, .68)
      .to('.moon-craters', { autoAlpha: .2, duration: .75 }, .78)
      .to('.cloud-layer', { autoAlpha: 1, duration: .9, stagger: .12, ease: 'sine.out' }, .55)
      .to('.blossom-branch', { autoAlpha: .88, duration: .8, ease: 'power1.out' }, .88)
      .to('.moment-stamp', { autoAlpha: 1, duration: .55, ease: 'power2.out' }, 1.03)
      .to('.opening-copy', { autoAlpha: 1, duration: 1.1, ease: 'power2.out' }, 1.22)
      .to('.flight-trail--draw', { strokeDashoffset: 0, duration: 2.12, ease: 'sine.inOut' }, 2.12)
      .to(plane, { opacity: 1, duration: .22 }, 2.12)
      .to(planeProgress, { value: 1, duration: 2.12, ease: 'sine.inOut', onUpdate: () => placePlane(planeProgress.value) }, 2.12)
      .to('.message-card', { autoAlpha: 1, duration: .68, ease: 'power2.out' }, 4.08)
      .to('.opening-caption', { autoAlpha: 1, duration: .6, ease: 'power1.out' }, 4.42)
      .call(() => opening.classList.add('petals-active'), [], 4.7);
    intro.play(0);

    skip.addEventListener('click', () => {
      if (intro.progress() >= 1) {
        if (card.getAttribute('aria-expanded') === 'true') {
          messageOpen = false;
          card.setAttribute('aria-expanded', 'false');
          card.setAttribute('aria-label', 'Open our first message');
          paper.hidden = true;
        }
        intro.restart();
        return;
      }
      intro.progress(1).pause();
      finishIntro();
    });

    ScrollTrigger.create({
      trigger: '.next-page', start: 'top bottom', end: 'top 25%', scrub: .65,
      onUpdate: (self) => progressBar.style.transform = `scaleX(${self.progress})`,
      animation: gsap.timeline()
        .to('.far-sky', { y: -10, duration: 1 }, 0)
        .to('.moon-layer', { y: -18, duration: 1 }, 0)
        .to('.cloud-layer--front', { x: -12, duration: 1 }, 0)
        .to('.opening-copy', { y: -10, opacity: .35, duration: 1 }, 0)
        .fromTo('.next-page .eyebrow, .next-page h2, .next-page>p, .return-button',
          { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, duration: .65, stagger: .12 }, .18),
    });

    if (window.matchMedia('(hover: hover) and (min-width: 761px)').matches) {
      const farX = gsap.quickTo('.far-sky', 'x', { duration: .8, ease: 'power2.out' });
      const farY = gsap.quickTo('.far-sky', 'y', { duration: .8, ease: 'power2.out' });
      const nearX = gsap.quickTo('.blossom-branch', 'x', { duration: 1.1, ease: 'power2.out' });
      const nearY = gsap.quickTo('.blossom-branch', 'y', { duration: 1.1, ease: 'power2.out' });
      opening.addEventListener('pointermove', (event) => {
        const bounds = opening.getBoundingClientRect();
        const x = (event.clientX / bounds.width - .5);
        const y = (event.clientY / bounds.height - .5);
        farX(x * -7); farY(y * -5); nearX(x * 12); nearY(y * 8);
      }, { passive: true });
      opening.addEventListener('pointerleave', () => { farX(0); farY(0); nearX(0); nearY(0); }, { passive: true });
    }
  }

  document.querySelector('.scroll-cue').addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('#next-page').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  });

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return '--:--';
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  };
  const audioDecks = [...document.querySelectorAll('.sound-deck')];
  const songAudio = document.querySelector('[data-song-audio]');
  const allPlayers = [...audioDecks.map((deck) => deck.querySelector('[data-story-audio]')), songAudio].filter(Boolean);
  const pauseOtherMedia = (active) => allPlayers.forEach((media) => { if (media !== active) media.pause(); });
  const paintWaveform = (waveform, progress) => {
    if (!waveform) return;
    const bars = [...waveform.querySelectorAll('i')];
    const playedCount = Math.round(Math.max(0, Math.min(1, progress)) * bars.length);
    bars.forEach((bar, index) => bar.classList.toggle('is-played', index < playedCount));
  };

  audioDecks.forEach((deck) => {
    const audio = deck.querySelector('[data-story-audio]');
    const toggle = deck.querySelector('[data-player-toggle]');
    const seek = deck.querySelector('[data-player-seek]');
    const time = deck.querySelector('[data-player-time]');
    const title = deck.querySelector('.sound-deck__title');
    const select = deck.querySelector('[data-track-select]');
    const waveform = deck.querySelector('[data-audio-waveform]');
    const update = () => {
      const duration = audio.duration;
      const current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const progress = Number.isFinite(duration) && duration > 0 ? current / duration : 0;
      seek.value = String(Math.round(progress * 1000));
      time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      toggle.textContent = audio.paused ? '▶' : 'Ⅱ';
      toggle.setAttribute('aria-label', audio.paused ? 'Play selected voice note' : 'Pause selected voice note');
      toggle.setAttribute('aria-pressed', String(!audio.paused));
      deck.classList.toggle('is-playing', !audio.paused);
      paintWaveform(waveform, progress);
    };
    toggle.addEventListener('click', async () => {
      if (audio.paused) {
        pauseOtherMedia(audio);
        try { await audio.play(); } catch { update(); time.textContent = 'Audio unavailable'; return; }
      } else audio.pause();
      update();
    });
    select.addEventListener('change', () => {
      audio.pause();
      audio.src = select.value;
      audio.load();
      const selected = select.options[select.selectedIndex];
      title.textContent = `${selected.text} of ${select.options.length}`;
      update();
    });
    seek.addEventListener('input', () => {
      if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value) / 1000 * audio.duration;
      update();
    });
    ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'error'].forEach((type) => audio.addEventListener(type, update));
    update();
  });

  if (songAudio) {
    const song = document.querySelector('.song-keepsake');
    const toggle = song.querySelector('[data-song-toggle]');
    const seek = song.querySelector('[data-song-seek]');
    const currentTime = song.querySelector('[data-song-time]');
    const durationTime = song.querySelector('[data-song-duration]');
    const volume = song.querySelector('[data-song-volume]');
    const waveform = song.querySelector('[data-audio-waveform]');
    const updateSong = () => {
      const duration = songAudio.duration;
      const current = Number.isFinite(songAudio.currentTime) ? songAudio.currentTime : 0;
      const progress = Number.isFinite(duration) && duration > 0 ? current / duration : 0;
      seek.value = String(Math.round(progress * 1000));
      currentTime.textContent = formatTime(current);
      durationTime.textContent = formatTime(duration);
      toggle.textContent = songAudio.paused ? '▶' : 'Ⅱ';
      toggle.setAttribute('aria-label', songAudio.paused ? 'Play Ammu’s song cover' : 'Pause Ammu’s song cover');
      toggle.setAttribute('aria-pressed', String(!songAudio.paused));
      song.classList.toggle('is-playing', !songAudio.paused);
      paintWaveform(waveform, progress);
    };
    toggle.addEventListener('click', async () => {
      if (songAudio.paused) {
        pauseOtherMedia(songAudio);
        try { await songAudio.play(); } catch { updateSong(); currentTime.textContent = 'Unavailable'; return; }
      } else songAudio.pause();
      updateSong();
    });
    seek.addEventListener('input', () => {
      if (Number.isFinite(songAudio.duration)) songAudio.currentTime = Number(seek.value) / 1000 * songAudio.duration;
      updateSong();
    });
    volume.addEventListener('input', () => { songAudio.volume = Number(volume.value); });
    ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'error'].forEach((type) => songAudio.addEventListener(type, updateSong));
    updateSong();
  }

  document.querySelectorAll('[data-edit-note]').forEach((button) => {
    const id = button.dataset.editNote;
    const note = document.querySelector(`[data-editable-note="${id}"]`);
    const key = `dear-ammu-preview-note-${id}`;
    try { const saved = localStorage.getItem(key); if (saved) note.textContent = saved; } catch { /* Local storage may be disabled in private browsing. */ }
    button.addEventListener('click', () => {
      const editing = note.getAttribute('contenteditable') === 'true';
      if (editing) {
        note.setAttribute('contenteditable', 'false');
        button.textContent = 'edit note';
        button.setAttribute('aria-pressed', 'false');
        try { localStorage.setItem(key, note.textContent.trim()); } catch { /* Keep the edit for this preview session. */ }
      } else {
        note.setAttribute('contenteditable', 'true');
        button.textContent = 'save note';
        button.setAttribute('aria-pressed', 'true');
        note.focus();
      }
    });
  });

  const lightbox = document.querySelector('#keepsake-lightbox');
  const lightboxImage = lightbox.querySelector('img');
  const lightboxCaption = lightbox.querySelector('p');
  document.querySelectorAll('[data-lightbox]').forEach((button) => button.addEventListener('click', () => {
    lightboxImage.src = button.dataset.lightbox;
    lightboxImage.alt = button.querySelector('img')?.alt || button.dataset.caption;
    lightboxCaption.textContent = button.dataset.caption;
    if (typeof lightbox.showModal === 'function') lightbox.showModal();
  }));
  lightbox.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) lightbox.close(); });
  lightbox.addEventListener('close', () => { lightboxImage.removeAttribute('src'); });

  document.querySelector('.secret-star-button')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const secret = document.querySelector('#potato-secret');
    secret.hidden = !secret.hidden;
    button.setAttribute('aria-expanded', String(!secret.hidden));
  });

  const universeChapter = document.querySelector('.universe-chapter');
  const universeMessage = document.querySelector('#universe-message');
  const showUniverseMessage = (message) => { universeMessage.textContent = message; };
  const moonButton = document.querySelector('[data-moon-light]');
  moonButton?.addEventListener('click', () => {
    const lit = moonButton.getAttribute('aria-pressed') !== 'true';
    moonButton.setAttribute('aria-pressed', String(lit));
    universeChapter.classList.toggle('moonlit', lit);
    showUniverseMessage(lit ? 'A little more moonlight for both our windows. ☾' : 'The moonlight settles softly over our little world.');
  });
  document.querySelectorAll('[data-star-message]').forEach((star) => star.addEventListener('click', () => {
    const open = star.getAttribute('aria-pressed') !== 'true';
    document.querySelectorAll('[data-star-message]').forEach((item) => item.setAttribute('aria-pressed', String(item === star && open)));
    if (open) showUniverseMessage(star.dataset.starMessage);
  }));
  const lanternButton = document.querySelector('[data-lantern-light]');
  lanternButton?.addEventListener('click', () => {
    const lit = lanternButton.getAttribute('aria-pressed') !== 'true';
    lanternButton.setAttribute('aria-pressed', String(lit));
    universeChapter.classList.toggle('lantern-lit', lit);
    showUniverseMessage(lit ? 'One little lantern, keeping a little piece of home glowing.' : 'The lantern rests beneath the blossoms.');
  });

  const stickerData = [
    ['cuddling',0,0],['cheeky pout',1,0],['cat-paw hoodies',2,0],['matching cool',3,0],
    ['noodles together',0,1],['sleepy cuddle',1,1],['playful boxing',2,1],['squeeze hug',3,1],
    ['teasing',0,2],['movie night',1,2],['kiss',2,2],['angel and devil',3,2],
    ['spa day',0,3],['gaming together',1,3],['sunglasses kiss',2,3],['sleepy peek',3,3],
  ];
  const spriteOffsets = ['0%', '33.333%', '66.666%', '100%'];
  const stickerGrid = document.querySelector('#sticker-drawer-grid');
  let activeSticker = 0;
  const setSticker = (index) => {
    activeSticker = (index + stickerData.length) % stickerData.length;
    const [name, column, row] = stickerData[activeSticker];
    const sprite = document.querySelector('#active-couple-sprite');
    sprite.style.setProperty('--sprite-x', spriteOffsets[column]);
    sprite.style.setProperty('--sprite-y', spriteOffsets[row]);
    document.querySelector('#active-couple-sticker').setAttribute('aria-label', `Tap to change the ${name} couple sticker`);
    document.querySelector('#sticker-count').textContent = `${String(activeSticker + 1).padStart(2, '0')} / 16`;
    document.querySelectorAll('[data-sticker-index]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.stickerIndex) === activeSticker)));
    const stage = document.querySelector('.universe-character__float');
    stage.classList.remove('sticker-changed');
    void stage.offsetWidth;
    stage.classList.add('sticker-changed');
  };
  stickerData.forEach(([name, column, row], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.stickerIndex = String(index);
    button.setAttribute('aria-label', `Show ${name} couple sticker`);
    button.setAttribute('aria-pressed', String(index === activeSticker));
    const preview = document.createElement('span');
    preview.className = 'couple-sprite';
    preview.style.setProperty('--sprite-x', spriteOffsets[column]);
    preview.style.setProperty('--sprite-y', spriteOffsets[row]);
    button.append(preview);
    button.addEventListener('click', () => {
      setSticker(index);
      document.querySelector('.sticker-drawer').open = false;
      showUniverseMessage(`A little ${name} moment, floating in our sky. ♡`);
    });
    stickerGrid.append(button);
  });
  document.querySelector('#active-couple-sticker')?.addEventListener('click', () => setSticker(activeSticker + 1));
  document.querySelectorAll('[data-sticker-step]').forEach((button) => button.addEventListener('click', () => setSticker(activeSticker + Number(button.dataset.stickerStep))));
  document.querySelector('[data-sleepy-cat]')?.addEventListener('click', (event) => {
    const playful = universeChapter.dataset.catAwake !== 'true';
    universeChapter.dataset.catAwake = String(playful);
    event.currentTarget.setAttribute('aria-pressed', String(playful));
    setSticker(playful ? 5 : activeSticker);
    showUniverseMessage(playful ? 'The sleepy kitty stirs, stretches, and curls up again. ♡' : 'Shhh… the little kitty is dreaming again.');
  });
  document.querySelector('[data-night-to-lilies]')?.addEventListener('click', (event) => {
    event.preventDefault();
    const continueToLilies = () => {
      history.replaceState(null, '', '#chapter-six');
      chapterSix.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    };
    if (!supportsMotion || reducedMotion) { continueToLilies(); return; }
    universeChapter.classList.add('universe-leaving');
    gsap.to('.universe-transition', { autoAlpha: 1, scale: 2.4, duration: .8, ease: 'power2.inOut', onComplete: continueToLilies });
  });

  const closingEnvelope = document.querySelector('.closing-envelope');
  const closingLetter = document.querySelector('#closing-letter');
  closingEnvelope.addEventListener('click', () => {
    const open = closingEnvelope.getAttribute('aria-expanded') !== 'true';
    closingEnvelope.setAttribute('aria-expanded', String(open));
    closingLetter.hidden = !open;
    if (open) {
      closingLetter.classList.remove('letter-opened');
      requestAnimationFrame(() => closingLetter.classList.add('letter-opened'));
    } else closingLetter.classList.remove('letter-opened');
  });

  const birthday = document.querySelector('#birthday-countdown');
  if (birthday) {
    const label = birthday.querySelector('#birthday-countdown-label');
    const units = Object.fromEntries([...birthday.querySelectorAll('[data-countdown-unit]')].map((unit) => [unit.dataset.countdownUnit, unit]));
    const indiaDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' });
    const updateBirthday = () => {
      const parts = Object.fromEntries(indiaDateFormatter.formatToParts(new Date()).filter((part) => part.type !== 'literal').map((part) => [part.type, Number(part.value)]));
      const year = parts.month > 11 || (parts.month === 11 && parts.day >= 19) ? parts.year + 1 : parts.year;
      const left = Math.max(0, Math.floor((Date.UTC(year, 10, 18, 18, 30) - Date.now()) / 1000));
      units.days.textContent = String(Math.floor(left / 86400));
      units.hours.textContent = String(Math.floor(left % 86400 / 3600)).padStart(2, '0');
      units.minutes.textContent = String(Math.floor(left % 3600 / 60)).padStart(2, '0');
      units.seconds.textContent = String(left % 60).padStart(2, '0');
      label.textContent = `Counting down to your day · November 19, ${year} · India time`;
    };
    let birthdayTimer;
    const syncBirthdayTimer = () => {
      window.clearInterval(birthdayTimer);
      if (!document.hidden) {
        updateBirthday();
        birthdayTimer = window.setInterval(updateBirthday, 1000);
      }
    };
    document.addEventListener('visibilitychange', syncBirthdayTimer);
    syncBirthdayTimer();
  }

  const chapterSix = document.querySelector('#chapter-six');
  const lilyStage = document.querySelector('#lily-stage');
  const bouquetTrigger = document.querySelector('#lily-bouquet-trigger');
  const memoryReveal = document.querySelector('#lily-memory-reveal');
  bouquetTrigger?.addEventListener('click', () => {
    if (reducedMotion) {
      memoryReveal.textContent = 'A little bouquet, made with all my love. ♡';
      return;
    }
    if (supportsMotion) {
      const flecks = gsap.utils.toArray('.lily-reaction i');
      const offsets = [[-82, -62], [-40, -112], [18, -96], [76, -68], [98, -20]];
      gsap.killTweensOf(flecks);
      gsap.fromTo(flecks, { autoAlpha: 1, x: 0, y: 0, scale: .45, rotation: -15 }, {
        autoAlpha: 0, x: (index) => offsets[index][0], y: (index) => offsets[index][1], scale: 1,
        rotation: (index) => index % 2 ? 24 : -22, duration: .95, stagger: .045, ease: 'power2.out',
      });
    } else {
      chapterSix?.classList.remove('petals-burst');
      void lilyStage?.offsetWidth;
      chapterSix?.classList.add('petals-burst');
      window.setTimeout(() => chapterSix?.classList.remove('petals-burst'), 1100);
    }
  });
  document.querySelectorAll('[data-petal-memory]').forEach((petal) => petal.addEventListener('click', () => {
    memoryReveal.textContent = petal.dataset.petalMemory;
    lilyStage?.classList.add('memory-open');
  }));
  const affirmationStars = [...document.querySelectorAll('.lily-affirmation-star')];
  affirmationStars.forEach((star) => star.addEventListener('click', () => {
    const shouldOpen = star.getAttribute('aria-pressed') !== 'true';
    affirmationStars.forEach((item) => {
      item.setAttribute('aria-pressed', String(item === star && shouldOpen));
    });
  }));

  if (!supportsMotion || reducedMotion) {
    document.documentElement.classList.add('journey-ready');
  } else {
    const chapterReveals = gsap.utils.toArray('.chapter-reveal').filter((element) => !element.closest('.conversation-keepsake'));
    ScrollTrigger.batch(chapterReveals, {
      start: 'top 88%', once: true, interval: .12, batchMax: 6,
      onEnter: (elements) => gsap.to(elements, { autoAlpha: 1, y: 0, duration: .68, stagger: .1, ease: 'power2.out', overwrite: true }),
    });
    const conversation = document.querySelector('.conversation-keepsake');
    if (conversation) {
      gsap.timeline({ scrollTrigger: { trigger: conversation, start: 'top 78%', once: true } })
        .fromTo(conversation, { autoAlpha: 0, y: 18, rotateX: -3, transformOrigin: 'top center' }, { autoAlpha: 1, y: 0, rotateX: 0, duration: .72, ease: 'power2.out' })
        .fromTo(conversation.querySelector('.conversation-keepsake__heading time'), { autoAlpha: 0, y: 7 }, { autoAlpha: 1, y: 0, duration: .35 }, '-=.28')
        .fromTo(conversation.querySelectorAll('.chat-scrap__bubble'), { autoAlpha: 0, y: 9 }, { autoAlpha: 1, y: 0, duration: .32, stagger: .095, ease: 'power1.out' }, '-=.12')
        .fromTo(conversation.querySelectorAll('.chat-scrap__stamp'), { autoAlpha: 0, scale: .5 }, { autoAlpha: .72, scale: 1, duration: .3, stagger: .12, ease: 'back.out(1.8)' }, '-=.08');
    }
    gsap.utils.toArray('.audio-waveform').forEach((waveform) => gsap.fromTo(waveform, { scaleX: 0 }, { scaleX: 1, duration: .65, ease: 'power2.out', scrollTrigger: { trigger: waveform, start: 'top 92%', once: true } }));
    gsap.to('.chapter-three__sky', { y: -30, ease: 'none', scrollTrigger: { trigger: '.chapter-three', start: 'top bottom', end: 'bottom top', scrub: .6 } });
    gsap.to('.chapter-five__art', { yPercent: -5, scale: 1.035, ease: 'none', scrollTrigger: { trigger: '.chapter-five', start: 'top bottom', end: 'bottom top', scrub: .8 } });
    if (window.matchMedia('(hover: hover) and (min-width: 761px)').matches) {
      const skyX = gsap.quickTo('.universe-art img', 'x', { duration: 1.2, ease: 'power2.out' });
      const foregroundX = gsap.quickTo('.universe-depth', 'x', { duration: .8, ease: 'power2.out' });
      universeChapter.addEventListener('pointermove', (event) => {
        const bounds = universeChapter.getBoundingClientRect();
        const amount = event.clientX / bounds.width - .5;
        skyX(amount * -8); foregroundX(amount * 13);
      }, { passive: true });
      universeChapter.addEventListener('pointerleave', () => { skyX(0); foregroundX(0); }, { passive: true });
    }
    ScrollTrigger.create({ trigger: document.body, start: 'top top', end: 'bottom bottom', onUpdate: (self) => progressBar.style.transform = `scaleX(${self.progress})` });

    chapterSix.classList.add('lily-animating');
    const stems = gsap.utils.toArray('.lily-stem');
    stems.forEach((stem) => {
      const length = stem.getTotalLength();
      gsap.set(stem, { strokeDasharray: length, strokeDashoffset: length });
    });
    const leaves = gsap.utils.toArray('.lily-leaf, .lily-vein');
    const flowers = gsap.utils.toArray('.lily-flower');
    gsap.set(leaves, { autoAlpha: 0, scale: .72, transformOrigin: '50% 50%' });
    gsap.set('.lily-bud', { autoAlpha: 0, scale: .65, transformOrigin: '50% 100%' });
    gsap.set('.lily-petal-wrap', { autoAlpha: 0, scale: .12, transformOrigin: '50% 100%' });
    gsap.set('.lily-heart, .lily-stamen', { autoAlpha: 0, scale: .65, transformOrigin: '50% 50%' });
    gsap.set('.lily-seed', { autoAlpha: 0, scale: .35 });
    gsap.set('.lily-stage__particles i', { autoAlpha: 0, scale: .4 });
    gsap.set('#lily-final-message', { autoAlpha: 0, y: 18 });
    lilyBloomTimeline = gsap.timeline({ paused: true, onComplete: () => { if (chapterSix.classList.contains('is-in-view')) lilySwayTimeline.play(); } });
    lilyBloomTimeline
      .to('.lily-seed', { autoAlpha: 1, scale: 1, duration: .6, ease: 'back.out(2)' }, .12)
      .to('.lily-seed', { textShadow: '0 0 18px #f9db9a', duration: .4 }, .18)
      .to(stems, { strokeDashoffset: 0, duration: 1.35, stagger: .24, ease: 'sine.inOut' }, .72)
      .to(leaves, { autoAlpha: 1, scale: 1, duration: .62, stagger: .09, ease: 'power2.out' }, 1.52)
      .to('.lily-bud', { autoAlpha: 1, scale: 1, duration: .42, stagger: .24, ease: 'back.out(1.5)' }, 2.12);
    flowers.forEach((flower, index) => {
      const bloomAt = 2.72 + index * .82;
      lilyBloomTimeline
        .to(flower.querySelector('.lily-bud'), { autoAlpha: 0, scale: .55, duration: .3, ease: 'power1.in' }, bloomAt)
        .to(flower.querySelectorAll('.lily-petal-wrap'), { autoAlpha: 1, scale: 1, duration: .58, stagger: .055, ease: 'back.out(1.35)' }, bloomAt + .05)
        .to(flower.querySelectorAll('.lily-heart, .lily-stamen'), { autoAlpha: 1, scale: 1, duration: .36, stagger: .08, ease: 'power2.out' }, bloomAt + .38);
    });
    lilyBloomTimeline
      .to('.lily-stage__particles i', { autoAlpha: (index) => index % 2 ? .55 : .8, scale: 1, duration: .55, stagger: .07, ease: 'sine.out' }, 4.75)
      .to('#lily-final-message', { autoAlpha: 1, y: 0, duration: .7, ease: 'power2.out' }, 5.15)
      .fromTo('#lily-final-message p', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .48, stagger: .25, ease: 'power1.out' }, 5.3);
    lilySwayTimeline = gsap.timeline({ repeat: -1, yoyo: true, paused: true });
    lilySwayTimeline
      .to(flowers[0], { rotation: 1.1, y: 1, duration: 3.8, ease: 'sine.inOut', transformOrigin: '50% 92%' }, 0)
      .to(flowers[1], { rotation: -.75, y: -1, duration: 4.6, ease: 'sine.inOut', transformOrigin: '50% 94%' }, 0)
      .to(flowers[2], { rotation: .85, y: .8, duration: 4.1, ease: 'sine.inOut', transformOrigin: '50% 90%' }, 0);
    ScrollTrigger.create({ trigger: chapterSix, start: 'top 72%', once: true, onEnter: () => { lilyBloomHasRun = true; lilyBloomTimeline.play(0); } });
  }

  document.querySelector('#lily-replay')?.addEventListener('click', () => {
    lilySwayTimeline?.pause(0);
    if (lilyBloomTimeline) {
      lilyBloomHasRun = true;
      lilyBloomTimeline.restart();
    } else {
      chapterSix?.classList.remove('replaying');
      void chapterSix?.offsetWidth;
      chapterSix?.classList.add('replaying');
      window.setTimeout(() => chapterSix?.classList.remove('replaying'), 1400);
    }
  });

  const scenesToObserve = [opening, document.querySelector('.chapter-three'), universeChapter, document.querySelector('.chapter-six'), ...audioDecks, document.querySelector('.song-keepsake')].filter(Boolean);
  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle('scene-active', entry.isIntersecting);
      entry.target.classList.toggle('is-in-view', entry.isIntersecting);
      if (entry.target === chapterSix) {
        if (entry.isIntersecting && lilyBloomHasRun && lilyBloomTimeline?.progress() < 1) lilyBloomTimeline.play();
        if (!entry.isIntersecting && lilyBloomTimeline?.progress() < 1) lilyBloomTimeline.pause();
        if (entry.isIntersecting && lilyBloomTimeline?.progress() >= 1) lilySwayTimeline?.play();
        if (!entry.isIntersecting) lilySwayTimeline?.pause();
      }
    }), { threshold: .12 });
    scenesToObserve.forEach((scene) => sceneObserver.observe(scene));
  } else scenesToObserve.forEach((scene) => { scene.classList.add('scene-active', 'is-in-view'); });
})();
