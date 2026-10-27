/* De productielijn: one bottle becomes a whole campaign, driven by scroll.
   One fixed canvas covers the hero and the pinned section. T runs -1..3:
   -1 the finished bottle lies in the hero slot, 0 it has landed as a blueprint,
   1 painted by the recorded action, 2 the batch fills the grid,
   3 the grid runs as a production line while the spreadsheet fills the labels.
   All motion follows the scroll (with a short ease); the only unprompted motion is a
   one-second entrance on load. */
(async () => {
  const section = document.querySelector('.line');
  if (!section) return;
  const header = document.querySelector('.hero');
  const slot = document.querySelector('.hero .slot');
  const canvas = document.querySelector('.gl');
  const steps = [...section.querySelectorAll('.line__step')];
  const ticks = [...section.querySelectorAll('.line__meter span')];
  const sheetRows = [...section.querySelectorAll('.line__sheet tbody tr')];
  // reduced motion comes from the system setting or from the Weergave panel ('Animaties stoppen')
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const still = () => mq.matches || document.documentElement.classList.contains('a11y-still');

  /* the spreadsheet rows: what goes on the labels */
  const rowsData = sheetRows.map((tr) => [...tr.cells].map((td) => td.textContent.trim()));

  /* captions, meter and sheet work without WebGL too */
  const progress = () => {
    const r = section.getBoundingClientRect();
    const total = section.offsetHeight - innerHeight;
    return Math.min(1, Math.max(0, -r.top / (total || 1)));
  };
  const markStep = (p) => {
    const i = Math.min(steps.length - 1, Math.round(p * (steps.length - 1)));
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    ticks.forEach((s, k) => s.classList.toggle('is-on', k <= i));
    // on phones captions sit under the bottles: show one only while it is in the lower half
    steps.forEach((s) => { const y = s.firstElementChild.getBoundingClientRect().top; s.classList.toggle('in-band', y > innerHeight * 0.45 && y < innerHeight); });
    return i;
  };
  const markSheet = (filled, rows) => {
    sheetRows.forEach((tr, r) => {
      tr.classList.toggle('is-off', r >= rows);
      tr.classList.toggle('is-filled', r < filled);
      tr.classList.toggle('is-now', r === filled - 1);
    });
  };
  markStep(progress());
  markSheet(sheetRows.length, sheetRows.length);

  let THREE, RoomEnvironment;
  try {
    // three.js is bundled locally in vendor/three.min.js, so the page also works offline
    THREE = window.THREE;
    RoomEnvironment = window.THREE_RoomEnvironment;
    if (!THREE || !RoomEnvironment) throw new Error('three.js not loaded');
    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('no webgl');
  } catch (e) {
    section.classList.add('no-gl');
    canvas.remove();
    addEventListener('scroll', () => markStep(progress()), { passive: true });
    return;
  }
  try { await document.fonts.load('500 120px "Inter Tight"'); } catch (e) { /* labels fall back to sans-serif */ }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  const key = new THREE.DirectionalLight(0xfff4e0, 2.2); key.position.set(-4, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x29cdf2, 1.6); rim.position.set(5, 2, -4); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  camera.position.set(0, 0.4, 9);
  camera.lookAt(0, 0, 0);

  /* ---------- the Bron bottle, same proportions as the drawn one ---------- */
  const H = 2.3; // overall height incl. cap
  const profile = [[0, 0], [0.42, 0], [0.5, 0.04], [0.52, 0.12], [0.52, 1.42], [0.5, 1.56], [0.42, 1.68], [0.27, 1.78], [0.22, 1.86], [0.22, 1.98], [0, 1.98]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const bodyGeo = new THREE.LatheGeometry(profile, 72);
  const wireGeo = new THREE.WireframeGeometry(new THREE.LatheGeometry(profile, 20));
  const capGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 48); capGeo.translate(0, 2.14, 0);
  const labelGeo = new THREE.CylinderGeometry(0.526, 0.526, 0.52, 72, 1, true, Math.PI, Math.PI * 2); labelGeo.translate(0, 0.92, 0);
  const fillGeo = new THREE.CylinderGeometry(0.53, 0.53, 0.52, 72, 1, true, Math.PI, Math.PI * 2); fillGeo.translate(0, 0.92, 0);

  const variants = {
    cyan: { body: '#29CDF2', label: '#D9D3C1', cap: '#0D0D0D', ink: '#0D0D0D' },
    deep: { body: '#268EA6', label: '#29CDF2', cap: '#D9D3C1', ink: '#0D0D0D' },
    sand: { body: '#D9D3C1', label: '#0D0D0D', cap: '#268EA6', ink: '#D9D3C1' },
    dark: { body: '#3a3a3a', label: '#D9D3C1', cap: '#29CDF2', ink: '#0D0D0D' },
  };
  const texture = (bg, paint) => {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 160;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    paint(g);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return tex;
  };
  const brandLabel = (v) => texture(v.label, (g) => {
    g.fillStyle = v.ink;
    g.font = '500 92px "Inter Tight", sans-serif'; g.fillText('bron', 512, 70);
    g.font = '400 30px "Inter Tight", sans-serif'; g.globalAlpha = 0.8; g.fillText('750 ml', 512, 128);
  });
  // a row from the spreadsheet, set the way the template sets it: title large, tagline small
  const rowLabel = (v, [title, tagline]) => texture(v.label, (g) => {
    g.fillStyle = v.ink;
    g.font = '500 44px "Inter Tight", sans-serif'; g.fillText(title, 512, 62);
    g.font = '400 26px "Inter Tight", sans-serif'; g.globalAlpha = 0.8; g.fillText(tagline, 512, 112);
  });
  const mats = {};
  for (const [name, v] of Object.entries(variants)) {
    mats[name] = {
      body: new THREE.MeshPhysicalMaterial({ color: v.body, roughness: 0.38, metalness: 0.15, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
      cap: new THREE.MeshPhysicalMaterial({ color: v.cap, roughness: 0.55, metalness: 0.2, clearcoat: 0.3 }),
      label: new THREE.MeshStandardMaterial({ map: brandLabel(v), roughness: 0.6 }),
      rows: rowsData.map((row) => new THREE.MeshStandardMaterial({ map: rowLabel(v, row), roughness: 0.6 })),
    };
  }
  const makeBottle = (m, variant) => {
    const g = new THREE.Group();
    const label = new THREE.Mesh(labelGeo, m.label);
    const fill = new THREE.Mesh(fillGeo, mats[variant].rows[0] || m.label);
    fill.visible = false;
    g.add(new THREE.Mesh(bodyGeo, m.body), new THREE.Mesh(capGeo, m.cap), label, fill);
    g.userData = { variant, label, fill };
    return g;
  };

  /* the hero bottle: finished in the slot, stripped to a blueprint on its way down,
     then painted again by the recorded action */
  const scanY = { solid: new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), wire: new THREE.Plane(new THREE.Vector3(0, -1, 0), 0) };
  const heroMats = {};
  for (const k of ['body', 'cap', 'label']) { heroMats[k] = mats.cyan[k].clone(); heroMats[k].clippingPlanes = [scanY.solid]; }
  const hero = makeBottle(heroMats, 'cyan');
  const wireMat = new THREE.LineBasicMaterial({ color: 0x29cdf2, transparent: true, opacity: 0.55, clippingPlanes: [scanY.wire] });
  const wire = new THREE.LineSegments(wireGeo, wireMat);
  const wireCap = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.CylinderGeometry(0.25, 0.25, 0.32, 12).translate(0, 2.14, 0)), wireMat);
  hero.add(wire, wireCap);
  scene.add(hero);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0x29cdf2, transparent: true }));
  ring.rotation.x = Math.PI / 2;
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.66, 64), new THREE.MeshBasicMaterial({ color: 0x29cdf2, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2;
  const scanner = new THREE.Group(); scanner.add(ring, glow); scene.add(scanner);

  /* the batch: every other bottle in the folder */
  const order = ['cyan', 'sand', 'deep', 'dark'];
  const MAX = 24;
  const batch = [];
  for (let i = 1; i < MAX; i++) {
    const v = order[(i + Math.floor(i / 6)) % 4];
    const b = makeBottle(mats[v], v);
    b.visible = false; scene.add(b); batch.push(b);
  }
  const all = [hero, ...batch];
  const belts = [];
  const beltMat = new THREE.MeshBasicMaterial({ color: 0x262626, transparent: true });
  for (let r = 0; r < 4; r++) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 0.025, 0.5), beltMat); m.visible = false; scene.add(m); belts.push(m); }

  /* ---------- layout, recomputed on resize ---------- */
  let L;
  const layout = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visW = visH * camera.aspect;
    const wide = camera.aspect > 1.05;
    const region = wide
      ? { cx: visW * 0.22, cy: 0, w: visW * 0.48, h: visH * 0.8 }
      : { cx: 0, cy: visH * 0.18, w: visW * 0.92, h: visH * 0.44 };
    const cols = wide ? 6 : 4, rows = Math.min(wide ? 4 : 3, rowsData.length || 4);
    const cellW = region.w / cols, cellH = region.h / rows;
    const gs = Math.min(cellW * 0.62 / 1.04, cellH * 0.86 / H);
    const grid = [];
    for (let i = 0; i < cols * rows; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      grid.push(new THREE.Vector3(region.cx + (c - (cols - 1) / 2) * cellW, region.cy + ((rows - 1) / 2 - r) * cellH - H * gs / 2, (r % 2) * -0.2));
    }
    const ms = Math.min(region.h * 0.9 / H, region.w * 0.55 / 1.04);
    L = { region, cols, rows, cellW, cellH, gs, grid, n: cols * rows, ms, main: new THREE.Vector3(region.cx, region.cy - H * ms / 2, 0) };
    all.forEach((b, j) => {
      b.userData.inGrid = j < L.n;
      b.userData.row = Math.floor(j / cols);
      const m = mats[b.userData.variant].rows[b.userData.row];
      if (m) b.userData.fill.material = m;
    });
    markSheet(sheetRows.length, rows);
  };

  /* where the hero slot sits in the scene: unproject its screen box onto z = 0 */
  const ray = new THREE.Vector3();
  const toWorld = (x, y) => {
    const r = canvas.getBoundingClientRect();
    ray.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1, 0.5).unproject(camera).sub(camera.position).normalize();
    return camera.position.clone().addScaledVector(ray, -camera.position.z / ray.z);
  };
  const slotBox = () => {
    const r = slot.getBoundingClientRect();
    const c = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const w = toWorld(r.right, r.top).distanceTo(toWorld(r.left, r.top));
    const h = toWorld(r.left, r.top).distanceTo(toWorld(r.left, r.bottom));
    const s = Math.min(w * 0.82 / H, h * 0.74 / 1.04);
    return { pos: new THREE.Vector3(c.x - H * s / 2, c.y, 0), s };
  };

  /* ---------- the timeline ---------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const easeOut = (k) => 1 - Math.pow(1 - k, 3);
  const lerp = THREE.MathUtils.lerp;
  const tmp = new THREE.Vector3();
  let intro = still() ? 1 : 0;

  const setScan = (y) => { scanY.solid.constant = -y; scanY.wire.constant = y; };

  const draw = (t) => {
    const top = L.main.y + (H + 0.05) * L.ms, bottom = L.main.y - 0.05;

    if (t < 0) {
      /* hero: lying in the slot, then upright at the start of the line, stripped to a blueprint */
      const h = t + 1;
      const fly = smooth(0, 0.6, h), strip = smooth(0.55, 1, h);
      const S = slotBox();
      hero.position.lerpVectors(S.pos, L.main, fly);
      hero.scale.setScalar(lerp(S.s, L.ms, fly) * easeOut(intro));
      hero.rotation.set(0, lerp(0, -1.1, h), lerp(-Math.PI / 2, 0, fly), "ZYX"); // spin on its own axis, then stand up
      setScan(lerp(bottom, top, strip));
      if (strip === 0) setScan(-1e3);
      wire.visible = wireCap.visible = strip > 0;
      scanner.visible = strip > 0 && strip < 1;
      scanner.position.set(L.main.x, lerp(bottom, top, strip), 0);
      scanner.scale.setScalar(L.ms);
      ring.material.opacity = Math.sin(strip * Math.PI) * 0.9 + 0.1;
      hero.userData.label.visible = true; hero.userData.fill.visible = false;
      batch.forEach((b) => { b.visible = false; });
      belts.forEach((m) => { m.visible = false; });
      renderer.render(scene, camera);
      return;
    }

    const scan = smooth(0.15, 0.85, t);          // step 1 → 2: the action runs
    const spread = smooth(1.15, 1.9, t);         // step 2 → 3: the batch
    const run = smooth(2.1, 3, t);               // step 3 → 4: the line

    /* hero bottle */
    hero.scale.setScalar(lerp(L.ms, L.gs, spread));
    hero.position.lerpVectors(L.main, L.grid[0], spread);
    hero.rotation.set(0, (Math.min(t, 2) - 1) * 1.1 * (1 - spread), 0); // label faces you once it is painted
    const y = lerp(top, bottom, scan);
    setScan(y);
    if (spread > 0) { scanY.solid.constant = 1e3; scanY.wire.constant = -1e3; } // fully painted, no blueprint
    wire.visible = wireCap.visible = scan < 1;
    scanner.visible = scan > 0 && scan < 1;
    scanner.position.set(L.main.x, y, 0);
    scanner.scale.setScalar(L.ms);
    ring.material.opacity = Math.sin(scan * Math.PI) * 0.9 + 0.1;

    /* the batch leaves the hero bottle one by one */
    const span = L.cols * L.cellW;
    batch.forEach((b, i) => {
      if (!b.userData.inGrid) { b.visible = false; return; }
      const j = i + 1;
      const k = easeOut(clamp((spread - (j / L.n) * 0.55) / 0.45));
      b.visible = k > 0.001;
      if (!b.visible) return;
      tmp.copy(L.grid[j]);
      b.position.lerpVectors(L.main, tmp, k);
      b.position.y += Math.sin(k * Math.PI) * 0.6;
      b.scale.setScalar(L.gs * k);
      b.rotation.y = (Math.min(t, 2) - 2) * 0.9 + ((j % 3) - 1) * 0.22 * (1 - run);
    });

    /* the production line: rows travel and wrap, alternating direction,
       and each row takes its text from the matching spreadsheet row */
    const filled = run >= 1 ? L.rows : Math.floor(clamp((run - 0.08) / 0.8) * L.rows + (run > 0.08 ? 1 : 0));
    all.forEach((b, j) => {
      if (j >= L.n) return;
      const on = b.userData.row < filled && rowsData.length > 0;
      b.userData.fill.visible = on; b.userData.label.visible = !on;
      if (run <= 0) return;
      const dir = b.userData.row % 2 ? -1 : 1;
      const left = L.region.cx - span / 2;
      // rows slide exactly two cells, so the line comes to rest as a tidy grid again
      let x = L.grid[j].x + dir * run * L.cellW * 2 - left;
      x = ((x % span) + span) % span;
      b.position.x = left + x;
      const edge = Math.min(x, span - x) / (L.cellW * 0.5);
      b.scale.setScalar(L.gs * clamp(edge));
      b.rotation.y += dir * run * Math.PI * 2;
    });
    markSheet(filled, L.rows);
    belts.forEach((m, r) => {
      m.visible = run > 0 && r < L.rows;
      if (!m.visible) return;
      m.scale.set(span, 1, 1);
      m.position.set(L.region.cx, L.grid[r * L.cols].y - 0.03, (r % 2) * -0.2);
      beltMat.opacity = run;
    });
    renderer.render(scene, camera);
  };

  /* ---------- the canvas leaves with the end of the section, like a sticky stage ---------- */
  const place = () => {
    const end = section.getBoundingClientRect().bottom - innerHeight;
    canvas.style.transform = end < 0 ? `translateY(${end}px)` : '';
    canvas.style.visibility = end < -innerHeight ? 'hidden' : '';
  };

  /* ---------- loop: ease toward the scroll position, then sleep ---------- */
  let cur = null, target = -1, raf = 0;
  const goal = () => {
    const p = progress();
    const i = markStep(p);
    const start = section.getBoundingClientRect().top + scrollY;
    if (scrollY < start) {
      const h = scrollY / (start || 1);
      return still() ? (h < 0.5 ? -1 : 0) : h - 1;
    }
    // with reduced motion, jump straight to the finished state of each step
    return still() ? [0, 1, 2, 3][i] : p * 3;
  };
  const tick = () => {
    raf = 0;
    if (cur === null || still()) cur = target;
    else cur += (target - cur) * 0.12;
    if (Math.abs(target - cur) < 0.0005) cur = target;
    place();
    draw(cur);
    // the slot's colour field fades out as the bottle flies off, so no empty panel stays behind
    slot.style.opacity = cur < 0 ? String(1 - smooth(0.05, 0.6, cur + 1)) : '0';
    if (cur !== target || intro < 1) raf = requestAnimationFrame(tick);
  };
  const kick = () => { target = goal(); if (!raf) raf = requestAnimationFrame(tick); };

  layout();
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', () => { layout(); kick(); });
  document.documentElement.classList.add('gl-ready');
  section.classList.add('has-gl');
  addEventListener('a11y-change', () => { if (still()) intro = 1; kick(); });
  if (!still()) {
    // the one unprompted moment: the bottle settles into the slot as it opens
    const t0 = performance.now() + 450;
    const grow = () => { intro = clamp((performance.now() - t0) / 900); kick(); if (intro < 1) requestAnimationFrame(grow); };
    requestAnimationFrame(grow);
  }
  kick();
})();
