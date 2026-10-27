/* Weergave: a small panel where visitors set text size, motion, contrast, link underlines,
   focus outline and heading font. Choices are classes on <html> and are remembered in this browser. */
(() => {
  const root = document.documentElement;
  const box = document.querySelector('[data-view]');
  if (!box) return;
  const toggle = box.querySelector('.view__toggle');
  const panel = box.querySelector('.view__panel');
  const switches = [...panel.querySelectorAll('input[type="checkbox"]')];
  const sizes = [...panel.querySelectorAll('input[name="size"]')];
  const KEY = 'ca-weergave';

  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } };
  const write = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* not stored, still applied */ } };

  const apply = (s) => {
    switches.forEach((i) => root.classList.toggle('a11y-' + i.name, !!s[i.name]));
    root.classList.toggle('a11y-lg', s.size === 'lg');
    root.classList.toggle('a11y-xl', s.size === 'xl');
    dispatchEvent(new Event('a11y-change'));
    dispatchEvent(new Event('resize')); // text size changes the layout the 3D scene measures
  };
  const sync = (s) => {
    switches.forEach((i) => { i.checked = !!s[i.name]; });
    sizes.forEach((i) => { i.checked = i.value === (s.size || ''); });
  };
  const state = read();
  sync(state);

  const change = () => {
    switches.forEach((i) => { state[i.name] = i.checked; });
    state.size = (sizes.find((i) => i.checked) || {}).value || '';
    write(state); apply(state);
  };
  panel.addEventListener('change', change);
  panel.querySelector('.view__reset').addEventListener('click', () => {
    Object.keys(state).forEach((k) => delete state[k]);
    sync(state); write(state); apply(state);
  });

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
    if (open) panel.querySelector('input').focus();
  };
  toggle.addEventListener('click', () => setOpen(panel.hidden));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { setOpen(false); toggle.focus(); } });
  document.addEventListener('click', (e) => { if (!box.contains(e.target) && !panel.hidden) setOpen(false); });

  /* tuck the button away while scrolling down so it never sits on top of what you are reading */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, atEnd = innerHeight + y >= document.documentElement.scrollHeight - 40;
    const open = toggle.getAttribute('aria-expanded') === 'true';
    if (open || y < 80 || atEnd || y < lastY - 4) box.classList.remove('is-tucked');
    else if (y > lastY + 4) box.classList.add('is-tucked');
    lastY = y;
  }, { passive: true });
})();
