(() => {
  const KEY = 'warzone-meta:mode';
  const base = document.querySelector('link[rel="icon"]').getAttribute('href').replace(/favicon\.svg$/, '');
  const valid = value => value === 'br' || value === 'res';
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (_) {}
  let mode = new URL(location.href).searchParams.get('mode');
  // An explicit URL wins; otherwise retain the last selected view without a reload.
  mode = valid(mode) ? mode : valid(saved) ? saved : 'br';
  const controls = [...document.querySelectorAll('[data-mode-target]')];
  const views = [...document.querySelectorAll('[data-mode-view]')];
  function draw() {
    document.documentElement.dataset.mode = mode;
    views.forEach(view => { view.hidden = view.dataset.modeView !== mode; });
    controls.forEach(control => {
      const active = control.dataset.modeTarget === mode;
      control.href = `${base}?mode=${control.dataset.modeTarget}`;
      if (active) control.setAttribute('aria-current', 'page');
      else control.removeAttribute('aria-current');
    });
    const activeHeadline = document.querySelector(`[data-mode-view="${mode}"] .eyebrow`)?.textContent || 'Season 1';
    document.title = `${activeHeadline} · Warzone Meta`;
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    // Query parameters survive GitHub Pages refreshes; no runtime route is required.
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    try { localStorage.setItem(KEY, mode); } catch (_) {}
    document.documentElement.dataset.appReady = 'true';
  }
  controls.forEach(control => control.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    mode = control.dataset.modeTarget;
    draw();
  }));
  draw();
})();
