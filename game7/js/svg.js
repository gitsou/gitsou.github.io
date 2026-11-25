/* Pomocnicze funkcje rysowania SVG: elementy, ułamki, rośliny, robot, tło. */
(function () {
  'use strict';
  const GF = (window.GF = window.GF || {});
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null) continue;
      if (k === 'text') e.textContent = v;
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  /** Ułamek zapisany piętrowo: licznik, kreska, mianownik. (x, y) to środek kreski. */
  function fraction(parent, f, x, y, size = 28, cls = 'frac') {
    const g = el('g', { class: cls, transform: `translate(${x} ${y})` }, parent);
    if (f.d === 1) {
      el('text', { x: 0, y: size * 0.35, 'text-anchor': 'middle', 'font-size': size * 1.1, text: String(f.n) }, g);
      return g;
    }
    el('text', { x: 0, y: -size * 0.16, 'text-anchor': 'middle', 'font-size': size, text: String(f.n) }, g);
    el('line', { x1: -size * 0.42, x2: size * 0.42, y1: 0, y2: 0, 'stroke-width': size * 0.1, 'stroke-linecap': 'round', class: 'frac-bar' }, g);
    el('text', { x: 0, y: size * 0.86, 'text-anchor': 'middle', 'font-size': size, text: String(f.d) }, g);
    return g;
  }

  function fractionHTML(f) {
    if (f.d === 1) return `<span class="hfrac whole">${f.n}</span>`;
    return `<span class="hfrac"><span>${f.n}</span><span>${f.d}</span></span>`;
  }

  const ease = (k) => 1 - Math.pow(1 - k, 3);
  function tween(duration, fn) {
    return new Promise((resolve) => {
      if (reduced || duration <= 0) { fn(1); resolve(); return; }
      const t0 = performance.now();
      function step(t) {
        const k = Math.max(0, Math.min(1, (t - t0) / duration));
        fn(ease(k));
        if (k < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 200) : ms));

  function svgPoint(svg, evt) {
    const p = svg.createSVGPoint();
    p.x = evt.clientX; p.y = evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  // --- Rośliny ----------------------------------------------------------------

  function drawPlant(parent, kind, x, y, i = 0) {
    const g = el('g', { class: `plant plant-${kind}`, transform: `translate(${x} ${y})` }, parent);
    const body = el('g', { class: 'plant-body', style: `--tilt:${i % 2 ? 16 : -16}deg` }, g);
    const stem = (d) => el('path', { d, class: 'stem' }, body);
    const leaf = (cx, cy, rot) => el('ellipse', { cx, cy, rx: 12, ry: 6, transform: `rotate(${rot} ${cx} ${cy})`, class: 'leaf' }, body);
    switch (kind) {
      case 'fern':
        for (const a of [-28, -14, 0, 14, 28]) el('path', { d: `M0 0 Q ${a * 0.3} -26 ${a} -46`, class: 'frond' }, body);
        el('circle', { cx: 0, cy: -50, r: 5, class: 'flower bud' }, body);
        break;
      case 'lettuce':
        for (const [cx, cy, r] of [[-12, -10, 12], [12, -10, 12], [0, -20, 14], [0, -8, 12]]) el('circle', { cx, cy, r, class: 'lettuce-leaf' }, body);
        el('circle', { cx: 0, cy: -16, r: 5, class: 'flower bud' }, body);
        break;
      case 'cactus':
        el('rect', { x: -9, y: -46, width: 18, height: 46, rx: 9, class: 'cactus' }, body);
        el('path', { d: 'M-9 -22 h-8 v-12', class: 'cactus-arm' }, body);
        el('path', { d: 'M9 -28 h8 v-10', class: 'cactus-arm' }, body);
        el('circle', { cx: 0, cy: -48, r: 6, class: 'flower' }, body);
        break;
      case 'tomato':
        stem('M0 0 C 0 -15 2 -30 0 -46');
        leaf(-11, -22, -30); leaf(11, -32, 30); leaf(-9, -40, -20);
        el('circle', { cx: 8, cy: -16, r: 6, class: 'flower fruit' }, body);
        el('circle', { cx: -7, cy: -30, r: 5, class: 'flower fruit' }, body);
        break;
      default: // sprout
        stem('M0 0 C 0 -15 2 -28 0 -40');
        leaf(-10, -28, -30); leaf(10, -34, 30);
        el('circle', { cx: 0, cy: -44, r: 6, class: 'flower' }, body);
    }
    return g;
  }

  // --- Robot ------------------------------------------------------------------

  function drawRobot(parent, x, y) {
    const g = el('g', { class: 'robot mood-happy', transform: `translate(${x} ${y})` }, parent);
    const bob = el('g', { class: 'robot-bob' }, g);
    el('path', { d: 'M70 22 C 70 8 72 0 70 -10', class: 'stem' }, bob);
    el('ellipse', { cx: 60, cy: -10, rx: 12, ry: 6, transform: 'rotate(-25 60 -10)', class: 'leaf' }, bob);
    el('ellipse', { cx: 82, cy: -14, rx: 12, ry: 6, transform: 'rotate(25 82 -14)', class: 'leaf' }, bob);
    el('rect', { x: 18, y: 20, width: 104, height: 80, rx: 26, class: 'robot-shell' }, bob);
    el('rect', { x: 30, y: 32, width: 80, height: 54, rx: 16, class: 'robot-screen' }, bob);
    el('circle', { cx: 16, cy: 60, r: 10, class: 'robot-ear' }, bob);
    el('circle', { cx: 124, cy: 60, r: 10, class: 'robot-ear' }, bob);
    const eyes = el('g', { class: 'robot-eyes' }, bob);
    el('path', { d: 'M48 64 q 9 -12 18 0 M76 64 q 9 -12 18 0', class: 'eyes-happy' }, eyes);
    el('path', { d: 'M50 60 h14 M78 60 h14', class: 'eyes-think' }, eyes);
    el('path', { d: 'M48 56 q 9 10 18 0 M76 56 q 9 10 18 0', class: 'eyes-sad' }, eyes);
    el('rect', { x: 32, y: 104, width: 76, height: 70, rx: 18, class: 'robot-shell' }, bob);
    el('rect', { x: 44, y: 116, width: 52, height: 40, rx: 10, class: 'robot-apron' }, bob);
    el('path', { d: 'M70 148 C 62 140 60 130 70 122 C 80 130 78 140 70 148', class: 'apron-leaf' }, bob);
    el('circle', { cx: 46, cy: 182, r: 14, class: 'robot-wheel' }, g);
    el('circle', { cx: 94, cy: 182, r: 14, class: 'robot-wheel' }, g);
    return g;
  }

  function setMood(robot, mood) {
    robot.setAttribute('class', `robot mood-${mood || 'happy'}`);
  }

  // --- Tło szklarni -------------------------------------------------------------
  // clean: 0 (ruina) .. 1 (odnowiony). Brud na szybach i pnącza zależą od postępu.

  function drawBackground(svg, clean) {
    const defs = el('defs', {}, svg);
    const sky = el('linearGradient', { id: 'bg-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#e3f4e8' }, sky);
    el('stop', { offset: '1', 'stop-color': '#f8f2e2' }, sky);
    const water = el('linearGradient', { id: 'water', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#7fd8ef' }, water);
    el('stop', { offset: '1', 'stop-color': '#2fa8d4' }, water);

    const g = el('g', { class: 'background' }, svg);
    el('rect', { x: 0, y: 0, width: 1000, height: 640, fill: 'url(#bg-sky)' }, g);
    const frame = el('g', { class: 'gh-frame' }, g);
    for (let x = 0; x <= 1000; x += 125) el('line', { x1: x, y1: 0, x2: x, y2: 540 }, frame);
    for (let y = 90; y <= 540; y += 150) el('line', { x1: 0, y1: y, x2: 1000, y2: y }, frame);
    el('path', { d: 'M0 140 Q 500 -120 1000 140', class: 'gh-arch' }, frame);
    const dirt = el('g', { class: 'gh-dirt', opacity: (1 - clean) * 0.4 }, g);
    const spots = [[80, 120, 70], [300, 60, 50], [520, 160, 80], [760, 90, 60], [900, 260, 70], [180, 330, 60], [640, 380, 50], [400, 300, 40]];
    for (const [cx, cy, r] of spots) el('circle', { cx, cy, r }, dirt);
    if (clean > 0.4) {
      const vine = el('g', { class: 'vine', opacity: Math.min(1, (clean - 0.4) * 2) }, g);
      el('path', { d: 'M1000 40 C 950 120 980 200 930 280 C 900 330 940 380 920 440', class: 'vine-stem' }, vine);
      for (const [cx, cy] of [[960, 110], [945, 210], [925, 300], [932, 400]]) el('ellipse', { cx, cy, rx: 14, ry: 8, class: 'leaf' }, vine);
      if (clean >= 1) for (const [cx, cy] of [[972, 160], [915, 350]]) el('circle', { cx, cy, r: 7, class: 'vine-flower' }, vine);
    }
    el('rect', { x: 0, y: 540, width: 1000, height: 100, class: 'floor' }, g);
    for (let x = 0; x < 1000; x += 80) el('line', { x1: x, y1: 540, x2: x - 30, y2: 640, class: 'floor-line' }, g);
    el('line', { x1: 0, y1: 590, x2: 1000, y2: 590, class: 'floor-line' }, g);
    return g;
  }

  GF.svg = { el, fraction, fractionHTML, tween, wait, svgPoint, drawPlant, drawRobot, setMood, drawBackground, reduced };
})();
