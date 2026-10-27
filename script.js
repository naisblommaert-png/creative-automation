(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-still');

  /* hero slot: one design, cycling through its variants once, then resting on the first (under 5s, WCAG 2.2.2) */
  const frames = [...document.querySelectorAll('.slot__frame')];
  let f = 0;
  if (!reduce && frames.length) {
    const cycle = setInterval(() => {
      frames[f].classList.remove('is-on');
      f = (f + 1) % frames.length;
      frames[f].classList.add('is-on');
      if (f === 0) clearInterval(cycle);
    }, 1200);
  }

  /* readable rag: keep short words (de, je, op, Pas…) with the next word and the last two words of
     a heading or paragraph together, so no word is left dangling on its own line */
  const NB = '\u00A0';
  document.querySelectorAll('main h2, main h3, main p, main li, main figcaption, .footer h2, .footer p').forEach((el) => {
    if (el.closest('table, code, pre, #besparing-app')) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => { n.nodeValue = n.nodeValue.replace(/(^|[\s(])([\p{L}\d€]{1,3})[ ]+(?=\S)/gu, `$1$2${NB}`); });
    const last = [...nodes].reverse().find((n) => n.nodeValue.trim());
    if (last) last.nodeValue = last.nodeValue.replace(/[ ]+(\S{1,12})\s*$/u, `${NB}$1`);
  });

  /* entrances */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('[data-reveal], [data-shutter]').forEach((el) => io.observe(el));

  /* photoshop batch */
  const variants = ['v-cyan','v-sand','v-dark','v-deep'];
  const grounds = ['#268EA6','#29CDF2','#D9D3C1','#262626'];
  const folder = document.getElementById('ps-folder');
  const count = document.getElementById('ps-count');
  const steps = [...document.querySelectorAll('.ps-actions .step')];
  for (let i = 0; i < 12; i++) {
    const v = variants[i % 4], g = grounds[(i + 1) % 4];
    folder.insertAdjacentHTML('beforeend',
      `<div class="ps-file"><span class="name">IMG_${String(2041 + i)}</span>
        <div class="raw"><svg viewBox="0 0 100 240" class="bottle ${v}"><use href="#bottle"/></svg></div>
        <div class="done" style="background:${g}"><svg viewBox="0 0 100 240" class="bottle ${v}"><use href="#bottle"/></svg><span class="logo" style="color:${g === '#262626' ? '#D9D3C1' : '#0D0D0D'}">bron</span></div>
      </div>`);
  }
  const files = [...folder.children];
  let timer = null;
  const reset = () => { clearInterval(timer); timer = null; files.forEach((x) => x.classList.remove('is-done')); steps.forEach((s) => s.classList.remove('is-run')); count.textContent = '0 van 12'; };
  const run = () => {
    reset();
    if (reduce) { files.forEach((x) => x.classList.add('is-done')); count.textContent = '12 van 12'; return; }
    let i = 0;
    timer = setInterval(() => {
      steps.forEach((s, k) => s.classList.toggle('is-run', k === i % steps.length));
      files[i].classList.add('is-done');
      i++; count.textContent = `${i} van 12`;
      if (i === files.length) { clearInterval(timer); timer = null; steps.forEach((s) => s.classList.remove('is-run')); }
    }, 260);
  };
  document.getElementById('ps-run').addEventListener('click', run);
  document.getElementById('ps-reset').addEventListener('click', reset);
  const psIO = new IntersectionObserver((es) => { if (es[0].isIntersecting) { run(); psIO.disconnect(); } }, { threshold: .5 });
  psIO.observe(document.getElementById('ps'));

  /* bulk create: the live thing */
  const colours = {
    cyaan: { bg: '#29CDF2', ink: '#0D0D0D', v: 'v-sand' },
    teal:  { bg: '#268EA6', ink: '#0D0D0D', v: 'v-cyan' },
    zand:  { bg: '#D9D3C1', ink: '#0D0D0D', v: 'v-deep' },
    zwart: { bg: '#262626', ink: '#D9D3C1', v: 'v-cyan' },
  };
  const sets = [
    [
      { titel: 'Drink bij de bron', tagline: 'Navulbaar, 750 ml', cta: 'Bestel nu', kleur: 'cyaan' },
      { titel: 'Altijd bij de hand', tagline: 'Past in elke tas', cta: 'Ontdek', kleur: 'zand' },
      { titel: 'Eén fles per jaar', tagline: 'In plaats van 300', cta: 'Lees meer', kleur: 'teal' },
    ],
    [
      { titel: "Koud tot 's avonds", tagline: 'Dubbelwandig staal', cta: 'Bekijk', kleur: 'zwart' },
      { titel: 'Kies je kleur', tagline: 'Vier tinten water', cta: 'Kies nu', kleur: 'cyaan' },
      { titel: 'Vul me bij', tagline: '120 tappunten in Gent', cta: 'Zoek er een', kleur: 'zand' },
    ],
  ];
  let set = 0;
  const data = sets[0].map((r) => ({ ...r }));
  const tbody = document.getElementById('sheet-body');
  const rowsOut = document.getElementById('canvas-rows');
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const opts = (sel) => Object.keys(colours).map((k) => `<option${k === sel ? ' selected' : ''}>${k}</option>`).join('');
  const art = (r, kind) => {
    const c = colours[r.kleur] || colours.cyaan;
    return `<div class="art art--${kind}" style="--a-bg:${c.bg};--a-ink:${c.ink}">
      <svg viewBox="0 0 100 240" class="bottle ${c.v}"><use href="#bottle"/></svg>
      <div><div class="t">${esc(r.titel)}</div><div class="s">${esc(r.tagline)}</div></div>
      <span class="c">${esc(r.cta)}</span></div>`;
  };
  const renderSheet = () => {
    tbody.innerHTML = data.map((r, i) => `<tr>
      <td><input aria-label="Titel rij ${i + 1}" data-r="${i}" data-k="titel" value="${esc(r.titel)}" maxlength="24"></td>
      <td><input aria-label="Tagline rij ${i + 1}" data-r="${i}" data-k="tagline" value="${esc(r.tagline)}" maxlength="28"></td>
      <td><input aria-label="Call-to-action rij ${i + 1}" data-r="${i}" data-k="cta" value="${esc(r.cta)}" maxlength="14"></td>
      <td><select aria-label="Kleur rij ${i + 1}" data-r="${i}" data-k="kleur">${opts(r.kleur)}</select></td></tr>`).join('');
  };
  const renderRow = (i, flash) => {
    const el = rowsOut.children[i];
    const html = `${art(data[i], 'post')}${art(data[i], 'story')}${art(data[i], 'banner')}`;
    if (el) el.innerHTML = html; else rowsOut.insertAdjacentHTML('beforeend', `<div class="row-out">${html}</div>`);
    if (flash && !reduce) rowsOut.children[i].querySelectorAll('.art').forEach((a, k) => { a.style.animationDelay = `${k * 70}ms`; a.classList.add('flash'); });
  };
  const renderAll = (flash) => { data.forEach((_, i) => renderRow(i, flash)); };
  renderSheet(); renderAll(false);
  tbody.addEventListener('input', (e) => {
    const t = e.target; if (!t.dataset.k) return;
    data[t.dataset.r][t.dataset.k] = t.value || ' ';
    renderRow(+t.dataset.r, t.tagName === 'SELECT');
  });
  document.getElementById('sheet-shuffle').addEventListener('click', () => {
    set = (set + 1) % sets.length;
    sets[set].forEach((r, i) => Object.assign(data[i], r));
    renderSheet(); renderAll(true);
  });
})();

/* the bar: shows up once the hero is gone, marks the section you're in, and opens as a menu on small screens */
(() => {
  const bar = document.querySelector('[data-bar]');
  if (!bar) return;
  const hero = document.querySelector('.hero');
  const toggle = bar.querySelector('.bar__toggle');
  const now = bar.querySelector('.bar__now');
  const list = bar.querySelector('.bar__list');
  const links = [...list.querySelectorAll('a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    list.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  links.forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && list.classList.contains('is-open')) { setOpen(false); toggle.focus(); } });
  document.addEventListener('click', (e) => { if (!bar.contains(e.target)) setOpen(false); });

  const update = () => {
    const shown = hero.getBoundingClientRect().bottom < 80;
    bar.classList.toggle('is-shown', shown);
    if (!shown) setOpen(false);
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', (scrollY / (max || 1)).toFixed(4));
    // the current section is the last one whose top has passed the middle of the screen
    let cur = -1;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.5) cur = i; });
    links.forEach((a, i) => { if (i === cur) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    now.textContent = cur >= 0 ? links[cur].textContent : 'Menu';
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  /* AI video: plays muted when it scrolls into view, pauses when it leaves; never autoplays with reduced motion */
  const vid = document.querySelector('.aivid__video');
  if (vid) {
    const playBtn = document.querySelector('.aivid__btn[data-act="play"]');
    const soundBtn = document.querySelector('.aivid__btn[data-act="sound"]');
    let userPaused = false;
    const sync = () => {
      playBtn.textContent = vid.paused ? 'Speel af' : 'Pauzeer';
      playBtn.setAttribute('aria-pressed', String(!vid.paused));
      soundBtn.textContent = vid.muted ? 'Geluid aan' : 'Geluid uit';
      soundBtn.setAttribute('aria-pressed', String(!vid.muted));
    };
    vid.addEventListener('play', sync); vid.addEventListener('pause', sync); vid.addEventListener('volumechange', sync);
    playBtn.addEventListener('click', () => { if (vid.paused) { userPaused = false; vid.play().catch(() => {}); } else { userPaused = true; vid.pause(); } });
    soundBtn.addEventListener('click', () => { vid.muted = !vid.muted; if (!vid.muted && vid.paused) { userPaused = false; vid.play().catch(() => {}); } });
    const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('a11y-still');
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !userPaused && !calm()) vid.play().catch(() => {});
      else if (!e.isIntersecting && !vid.paused) vid.pause();
    }, { threshold: 0.4 }).observe(vid);
    sync();
  }
})();
