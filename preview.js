const storyMoments = [
  {
    date: 'JULY 30, 2026 · 12:48 PM',
    title: 'One reel, one hello',
    copy: '“Lol these people. I almost fell in love with your pfp.” A random little message, and suddenly I had a new favorite person to talk to.'
  },
  {
    date: 'AUGUST 1, 2026 · 12:01 AM',
    title: 'The half-girlfriend moment',
    copy: '“You are my half girlfriend.” You liked the message and said “Mhmmm.” I think my heart knew to keep that one.'
  },
  {
    date: 'AUGUST 1, 2026 · 9:30 PM',
    title: 'Three little letters',
    copy: 'My first “ilysm” to you. Three tiny letters, and somehow they already felt too small for what I wanted to say.'
  },
  {
    date: 'OCTOBER 19, 2026',
    title: 'Our first little photo booth',
    copy: 'A screen between us, matching silly poses, and a photo strip that still feels like a tiny first date. I can’t wait for the real-life version.'
  }
];

const storyButtons = [...document.querySelectorAll('[data-story-star]')];
const dateNode = document.querySelector('#story-star-date');
const titleNode = document.querySelector('#story-star-title');
const copyNode = document.querySelector('#story-star-copy');
const progressNode = document.querySelector('#story-star-progress');
const unlockNode = document.querySelector('#potato-unlock');
const decreeNode = document.querySelector('#potato-decree');
const openDecreeButton = document.querySelector('#open-decree');

if (storyButtons.length && dateNode && titleNode && copyNode && progressNode && unlockNode && decreeNode && openDecreeButton) {
  const foundMoments = new Set([0]);

  const renderMoment = (index) => {
    const moment = storyMoments[index];
    if (!moment) return;
    foundMoments.add(index);
    dateNode.textContent = moment.date;
    titleNode.textContent = moment.title;
    copyNode.textContent = moment.copy;
    progressNode.textContent = `${foundMoments.size} of ${storyMoments.length} stars found`;
    storyButtons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.classList.toggle('is-selected', selected);
      button.classList.toggle('is-found', foundMoments.has(buttonIndex));
      button.setAttribute('aria-pressed', String(selected));
    });
    if (foundMoments.size === storyMoments.length) unlockNode.hidden = false;
  };

  storyButtons.forEach((button) => {
    button.addEventListener('click', () => renderMoment(Number(button.dataset.storyStar)));
  });
  openDecreeButton.addEventListener('click', () => {
    decreeNode.hidden = false;
    openDecreeButton.setAttribute('aria-expanded', 'true');
    decreeNode.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
}
