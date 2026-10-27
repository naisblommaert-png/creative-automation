/* Tijdwinst: how much time and money automating saves over a school year.
   React (UMD) + htm for markup without a build step; Tailwind classes carry the tw- prefix
   and are scoped to #besparing so they never touch the rest of the page.
   They are compiled into besparing.css (Tailwind CLI, same prefix and scope): add a new class here,
   then rebuild that file.
   Chart rules follow the dataviz skill: one accent (Geautomatiseerd) against a de-emphasis
   gray (Handmatig), two small charts instead of a dual axis, fixed scales so bars really grow,
   values at the bar tips, hover and focus tooltips, and a table view. */
(() => {
  const mount = document.getElementById('besparing-app');
  if (!mount || !window.React || !window.ReactDOM || !window.htm) return; // the static fallback stays
  const { useState, useMemo } = React;
  const html = htm.bind(React.createElement);

  /* the assumptions, also printed under the chart */
  const A = { manualMin: 12, autoMin: 2, setupH: 4, weeks: 46, rate: 40, max: 50 };
  const C = { manual: '#6E6A5F', auto: '#1E9FBD' }; // validated pair on the #1A1A1A panel

  const calc = (n) => {
    const manualH = (n * A.manualMin / 60) * A.weeks;
    const autoH = n > 0 ? (n * A.autoMin / 60) * A.weeks + A.setupH : 0;
    return { manualH, autoH, manualE: manualH * A.rate, autoE: autoH * A.rate, savedH: manualH - autoH, savedE: (manualH - autoH) * A.rate };
  };
  const nf = new Intl.NumberFormat('nl-BE', { maximumFractionDigits: 0 });
  const eur = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const compact = (v) => (v >= 1000 ? `${nf.format(v / 1000)}K` : nf.format(v));
  const niceMax = (v) => { const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p) * p; };

  function Bars({ title, unit, rows, max, fmt, tickFmt }) {
    const [tip, setTip] = useState(null);
    const ticks = [0, 0.5, 1].map((k) => k * max); // few, clean ticks: the bars carry their own values
    return html`
      <figure className="tw-m-0">
        <figcaption className="tw-mb-3 tw-text-sm tw-font-medium" style=${{ color: 'var(--ink)' }}>${title}</figcaption>
        <div className="tw-relative tw-pr-20 sm:tw-pl-[132px] sm:tw-pr-16">
          <div className="tw-absolute tw-inset-y-0 tw-left-0 tw-right-20 tw-hidden sm:tw-left-[132px] sm:tw-right-16 sm:tw-block" aria-hidden="true">
            ${ticks.map((t) => html`<span key=${t} className="tw-absolute tw-inset-y-0 tw-w-px" style=${{ left: `${(t / max) * 100}%`, background: '#2c2c2c' }}></span>`)}
          </div>
          ${rows.map((r) => html`
            <div key=${r.key} className="tw-relative tw-mb-3 sm:tw-mb-0 sm:tw-flex sm:tw-h-12 sm:tw-items-center">
              <span className="tw-mb-1 tw-block tw-text-sm sm:tw-absolute sm:tw-left-[-132px] sm:tw-mb-0 sm:tw-w-[124px]" style=${{ color: 'var(--muted)' }}>${r.label}</span>
              <div
                tabIndex="0"
                role="img"
                aria-label=${`${r.label}: ${fmt(r.value)} ${unit} per jaar`}
                className="tw-group tw-relative tw-flex tw-h-8 tw-w-full tw-items-center tw-outline-none sm:tw-h-full"
                onPointerEnter=${() => setTip(r.key)} onPointerLeave=${() => setTip(null)}
                onFocus=${() => setTip(r.key)} onBlur=${() => setTip(null)}
              >
                <span
                  className="tw-block tw-h-6 tw-shrink-0 tw-rounded-r tw-transition-[width] tw-duration-200 motion-reduce:tw-transition-none group-hover:tw-brightness-125 group-focus-visible:tw-brightness-125"
                  style=${{ width: `${(r.value / max) * 100}%`, background: r.color, minWidth: r.value > 0 ? '2px' : 0 }}
                ></span>
                <span className="tw-ml-2 tw-whitespace-nowrap tw-text-sm tw-font-medium tw-tabular-nums" style=${{ color: 'var(--ink)' }}>${fmt(r.value)}</span>
                ${tip === r.key && html`
                  <span role="presentation" className="tw-pointer-events-none tw-absolute tw-bottom-full tw-left-0 tw-z-10 tw-mb-1 tw-whitespace-nowrap tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-shadow-lg" style=${{ background: '#0D0D0D', color: 'var(--ink)', border: '1px solid #333' }}>
                    <strong className="tw-block">${fmt(r.value)} ${unit} per jaar</strong>
                    <span style=${{ color: 'var(--muted)' }}><span className="tw-mr-1.5 tw-inline-block tw-h-0.5 tw-w-3 tw-align-middle" style=${{ background: r.color }}></span>${r.label}, ${fmt(r.value / A.weeks)} per week</span>
                  </span>`}
              </div>
            </div>`)}
          <div className="tw-relative tw-mt-1 tw-h-5 tw-text-xs tw-tabular-nums" aria-hidden="true" style=${{ color: 'var(--muted)' }}>
            ${ticks.map((t, i) => html`<span key=${t} className="tw-absolute" style=${{ left: `${(t / max) * 100}%`, transform: i === 0 ? 'none' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)' }}>${tickFmt(t)}</span>`)}
          </div>
        </div>
      </figure>`;
  }

  function App() {
    const [n, setN] = useState(20);
    const [table, setTable] = useState(false);
    const v = useMemo(() => calc(n), [n]);
    const top = useMemo(() => calc(A.max), []);
    const maxH = niceMax(top.manualH), maxE = niceMax(top.manualE);
    const hours = (x) => nf.format(x);

    return html`
      <div className="tw-rounded-2xl tw-p-5 sm:tw-p-8" style=${{ background: '#1A1A1A' }}>
        <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-4">
          <label htmlFor="taken" className="tw-text-base tw-font-medium" style=${{ color: 'var(--ink)' }}>Handmatige taken per week</label>
          <output htmlFor="taken" className="tw-text-2xl tw-font-medium tw-tabular-nums" style=${{ color: 'var(--ink)' }}>${n}</output>
        </div>
        <input
          id="taken" type="range" min="0" max=${A.max} step="1" value=${n}
          aria-valuetext=${`${n} taken per week`}
          onInput=${(e) => setN(+e.target.value)} onChange=${(e) => setN(+e.target.value)}
          className="tw-mt-3 tw-h-11 tw-w-full tw-cursor-pointer"
          style=${{ accentColor: C.auto }}
        />
        <div className="tw-flex tw-justify-between tw-text-xs tw-tabular-nums" aria-hidden="true" style=${{ color: 'var(--muted)' }}><span>0</span><span>${A.max}</span></div>

        <p className="tw-mt-8 tw-mb-0" aria-live="polite">
          <span className="tw-block tw-text-sm" style=${{ color: 'var(--muted)' }}>Je wint per schooljaar</span>
          <span className="tw-block tw-text-5xl tw-font-medium tw-leading-none tw-tracking-tight" style=${{ color: 'var(--ink)' }}>${hours(v.savedH)} uur</span>
          <span className="tw-mt-2 tw-block tw-text-base" style=${{ color: 'var(--ink)' }}>Dat is ${eur.format(v.savedE)} aan werktijd.</span>
        </p>

        <ul className="tw-mt-8 tw-mb-6 tw-flex tw-list-none tw-flex-wrap tw-gap-5 tw-p-0 tw-text-sm" style=${{ color: 'var(--ink)' }}>
          <li className="tw-flex tw-items-center tw-gap-2"><span className="tw-inline-block tw-h-3 tw-w-3 tw-rounded-sm" style=${{ background: C.manual }}></span>Handmatig</li>
          <li className="tw-flex tw-items-center tw-gap-2"><span className="tw-inline-block tw-h-3 tw-w-3 tw-rounded-sm" style=${{ background: C.auto }}></span>Geautomatiseerd</li>
        </ul>

        ${table ? html`
          <table className="tw-w-full tw-border-collapse tw-text-sm" style=${{ color: 'var(--ink)' }}>
            <caption className="tw-mb-2 tw-text-left" style=${{ color: 'var(--muted)' }}>Per schooljaar, bij ${n} taken per week</caption>
            <thead><tr>${['', 'Uren', 'Kosten'].map((h) => html`<th key=${h} scope="col" className="tw-border-0 tw-border-b tw-border-solid tw-py-2 tw-text-left tw-font-medium" style=${{ borderColor: '#333' }}>${h}</th>`)}</tr></thead>
            <tbody className="tw-tabular-nums">
              <tr><th scope="row" className="tw-py-2 tw-text-left tw-font-normal">Handmatig</th><td>${hours(v.manualH)}</td><td>${eur.format(v.manualE)}</td></tr>
              <tr><th scope="row" className="tw-py-2 tw-text-left tw-font-normal">Geautomatiseerd</th><td>${hours(v.autoH)}</td><td>${eur.format(v.autoE)}</td></tr>
              <tr><th scope="row" className="tw-py-2 tw-text-left tw-font-medium">Verschil</th><td className="tw-font-medium">${hours(v.savedH)}</td><td className="tw-font-medium">${eur.format(v.savedE)}</td></tr>
            </tbody>
          </table>` : html`
          <div className="tw-grid tw-gap-10">
            <${Bars} title="Tijd per schooljaar, in uren" unit="uur" max=${maxH} fmt=${hours} tickFmt=${compact}
              rows=${[{ key: 'm', label: 'Handmatig', value: v.manualH, color: C.manual }, { key: 'a', label: 'Geautomatiseerd', value: v.autoH, color: C.auto }]} />
            <${Bars} title="Kosten per schooljaar, in euro" unit="euro" max=${maxE} fmt=${(x) => eur.format(x)} tickFmt=${(x) => `€${compact(x)}`}
              rows=${[{ key: 'm', label: 'Handmatig', value: v.manualE, color: C.manual }, { key: 'a', label: 'Geautomatiseerd', value: v.autoE, color: C.auto }]} />
          </div>`}

        <button type="button" onClick=${() => setTable(!table)} aria-pressed=${table}
          className="tw-mt-6 tw-min-h-[44px] tw-cursor-pointer tw-rounded-full tw-border tw-border-solid tw-bg-transparent tw-px-5 tw-text-sm tw-font-medium"
          style=${{ color: 'var(--ink)', borderColor: '#5a5a5a', fontFamily: 'inherit' }}>
          ${table ? 'Bekijk als grafiek' : 'Bekijk als tabel'}
        </button>
      </div>`;
  }

  ReactDOM.createRoot(mount).render(html`<${App} />`);
})();
