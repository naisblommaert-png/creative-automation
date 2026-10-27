/* Colour rhythm: every chapter has a tone (data-tone), and the page background blends from one
   tone to the next as the chapter boundary passes the middle of the screen. Blending happens in
   OKLab so sand to petrol stays clean instead of going muddy. Without this script every section
   simply keeps its own background. */
(() => {
  const secs = [...document.querySelectorAll('[data-tone]')];
  if (!secs.length) return;
  const root = document.documentElement;
  root.classList.add('tones');
  const css = getComputedStyle(root);
  const tone = (name) => (css.getPropertyValue(`--tone-${name}`).trim() || '#0D0D0D');

  const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  const lab = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => toLin(parseInt(hex.slice(i, i + 2), 16) / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const rgb = ([L, A, B]) => {
    const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
    const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
    const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
    const out = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
    return `rgb(${out.map((c) => Math.round(Math.min(1, Math.max(0, toSrgb(c))) * 255)).join(' ')})`;
  };
  const tones = secs.map((el) => lab(tone(el.dataset.tone)));
  const ease = (t) => t * t * (3 - 2 * t);
  const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches || root.classList.contains('a11y-still');

  let queued = false;
  const paint = () => {
    queued = false;
    const mid = innerHeight * 0.5;
    const band = still() ? 1 : innerHeight * 0.4; // with reduced motion the colour switches, it doesn't sweep
    let c = tones[0];
    for (let i = 1; i < secs.length; i++) {
      const t = Math.min(1, Math.max(0, (mid + band / 2 - secs[i].getBoundingClientRect().top) / band));
      if (t <= 0) break;
      const e = ease(t);
      c = c.map((v, k) => v + (tones[i][k] - v) * e);
    }
    root.style.setProperty('--page', rgb(c));
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('a11y-change', queue);
  paint();
})();
