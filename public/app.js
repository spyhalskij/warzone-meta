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
    if (!views.length) {
      document.documentElement.dataset.appReady = 'true';
      return;
    }
    views.forEach(view => { view.hidden = view.dataset.modeView !== mode; });
    controls.forEach(control => {
      const active = control.dataset.modeTarget === mode;
      control.href = `${base}?mode=${control.dataset.modeTarget}`;
      if (active) control.setAttribute('aria-current', 'page');
      else control.removeAttribute('aria-current');
    });
    const activeHeadline = document.querySelector(`[data-mode-view="${mode}"] .eyebrow`)?.textContent;
    if (activeHeadline) document.title = `${activeHeadline} · Warzone Meta`;
    const url = new URL(location.href);
    url.searchParams.set('mode', mode);
    // Query parameters survive GitHub Pages refreshes; no runtime route is required.
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    try { localStorage.setItem(KEY, mode); } catch (_) {}
    document.documentElement.dataset.appReady = 'true';
  }
  document.querySelectorAll('[data-build-tabs]').forEach(list => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    function select(next) {
      tabs.forEach((tab, index) => {
        const on = tab === next;
        const panel = panels[index];
        if (!panel) return;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        panel.classList.toggle('is-selected', on);
        panel.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      });
    }
    list.addEventListener('keydown', event => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      let next = null;
      if (event.key === 'ArrowRight') next = tabs[(current + 1) % tabs.length];
      else if (event.key === 'ArrowLeft') next = tabs[(current - 1 + tabs.length) % tabs.length];
      else if (event.key === 'Home') next = tabs[0];
      else if (event.key === 'End') next = tabs[tabs.length - 1];
      else return;
      event.preventDefault();
      select(next);
      next.focus();
      next.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    });
    tabs.forEach(tab => tab.addEventListener('click', () => {
      select(tab);
      tab.scrollIntoView({ inline: 'nearest', block: 'nearest' });
    }));
  });
  controls.forEach(control => control.addEventListener('click', event => {
    if (!views.length) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    mode = control.dataset.modeTarget;
    draw();
  }));
  draw();
})();
