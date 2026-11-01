(() => {
  const installButton = document.querySelector('#pwa-install-button');
  const guide = document.querySelector('#pwa-install-guide');
  const instructions = document.querySelector('#pwa-install-instructions');
  let installPrompt = null;

  const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  const syncInstallButton = () => {
    if (installButton) installButton.hidden = isInstalled();
  };

  const showInstallGuide = () => {
    if (!guide || guide.open) return;
    const agent = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(agent) && !window.MSStream) {
      instructions.textContent = 'In Safari, tap Share, choose “Add to Home Screen,” then tap “Add.” The diary stays available from its own icon.';
    } else if (/Android/i.test(agent)) {
      instructions.textContent = 'In Chrome, tap ⋮ and choose “Install app” or “Add to Home screen,” then confirm.';
    } else {
      instructions.textContent = 'Choose the install icon in your browser’s address bar, or open its menu and choose “Install Ammu’s little universe.”';
    }
    guide.showModal();
  };

  if (installButton) {
    syncInstallButton();
    installButton.addEventListener('click', async () => {
      if (!installPrompt) return showInstallGuide();
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice?.outcome === 'accepted') installButton.hidden = true;
      installPrompt = null;
    });
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      installPrompt = event;
      syncInstallButton();
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null;
      installButton.hidden = true;
    });
  }

  if (guide) {
    guide.querySelector('[data-pwa-close]').addEventListener('click', () => guide.close());
    guide.addEventListener('click', (event) => { if (event.target === guide) guide.close(); });
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js', { scope: '/' }).catch((error) => {
        console.warn('The diary app shell could not be prepared for offline use.', error);
      });
    }, { once: true });
  }
})();
