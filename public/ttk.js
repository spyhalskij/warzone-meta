(() => {
  const page = document.querySelector('.ttk-page');
  if (!page) return;
  const MAX_SERIES = 4;
  // weaponId stays null until an individual-weapon filter is added.
  // The type filter is the only control that writes state today.
  const state = { type: 'all', weaponId: null };

  const writeState = () => {
    page.dataset.filterState = JSON.stringify(state);
  };

  const applyType = () => {
    document.querySelectorAll('[data-ttk-type]').forEach(block => {
      block.hidden = state.type !== 'all' && block.dataset.ttkType !== state.type;
    });
    document.querySelectorAll('[data-filter-type]').forEach(chip => {
      chip.setAttribute('aria-pressed', chip.dataset.filterType === state.type ? 'true' : 'false');
    });
    writeState();
  };

  document.querySelectorAll('[data-filter-type]').forEach(chip => {
    chip.addEventListener('click', () => {
      state.type = chip.dataset.filterType;
      state.weaponId = null;
      applyType();
    });
  });

  document.querySelectorAll('[data-chart]').forEach(chart => {
    const buttons = [...chart.querySelectorAll('.series-toggle')];
    const note = chart.querySelector('.series-limit');
    const marks = () => [...chart.querySelectorAll('.series-mark')];
    const selected = () => buttons.filter(button => button.getAttribute('aria-pressed') === 'true');
    const paint = () => {
      const slots = new Map(selected().map((button, index) => [button.dataset.weaponId, String(index)]));
      marks().forEach(mark => {
        const slot = slots.get(mark.dataset.weaponId);
        if (slot === undefined) mark.removeAttribute('data-slot');
        else mark.setAttribute('data-slot', slot);
      });
    };
    buttons.forEach(button => {
      button.addEventListener('click', () => {
        const on = button.getAttribute('aria-pressed') === 'true';
        if (on) {
          button.setAttribute('aria-pressed', 'false');
          if (note) note.textContent = '';
        } else if (selected().length >= MAX_SERIES) {
          if (note) note.textContent = 'Four series is the maximum on one chart. Turn one off to add another.';
          return;
        } else {
          button.setAttribute('aria-pressed', 'true');
          if (note) note.textContent = '';
        }
        paint();
      });
    });
  });

  applyType();
})();
