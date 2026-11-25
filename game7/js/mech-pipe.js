/* Mechanika: łatanie rury (model długości, zapowiedź osi liczbowej). */
(function () {
  'use strict';
  const GF = window.GF;
  GF.mechanics = GF.mechanics || {};
  const R = GF.rules;
  const { el, fraction, tween, wait } = GF.svg;

  GF.mechanics.pipe = function mountPipe(ctx) {
    const { stage, stats } = ctx;
    const layer = el('g', { transform: 'translate(40 0)' }, ctx.layer);
    const U = 400, PX = 300, PY = 300, PH = 40;
    const gap = R.parse(stage.gap);
    const gx0 = PX + R.val(R.parse(stage.gapStart)) * U;
    const gx1 = gx0 + R.val(gap) * U;
    const placed = [];
    let busy = false;
    let done = false;

    // Miarka całej rury
    const ruler = el('g', { class: 'ruler glow', 'data-hint': 'ruler' }, layer);
    el('rect', { x: gx0, y: 214, width: gx1 - gx0, height: 32, rx: 6, class: 'gap-span hint-only', 'data-hint': 'gap-span' }, ruler);
    el('line', { x1: PX, y1: 230, x2: PX + U, y2: 230 }, ruler);
    for (let k = 0; k <= stage.rulerParts; k++) {
      const x = PX + (k / stage.rulerParts) * U;
      const h = k === 0 || k === stage.rulerParts ? 16 : 10;
      el('line', { x1: x, y1: 230 - h, x2: x, y2: 230 + h }, ruler);
    }
    el('text', { x: PX + U / 2, y: 168, 'text-anchor': 'middle', text: '← cała rura →' }, ruler);
    const rulerResult = el('g', {}, layer);

    // Rura z dziurą, kran i zbiornik
    el('rect', { x: 230, y: PY - 30, width: 60, height: 60, rx: 12, class: 'faucet' }, layer);
    el('rect', { x: 250, y: PY - 52, width: 20, height: 26, rx: 4, class: 'faucet' }, layer);
    if (gx0 > PX) el('rect', { x: PX, y: PY - PH / 2, width: gx0 - PX, height: PH, rx: 4, class: 'pipe-seg' }, layer);
    if (gx1 < PX + U) el('rect', { x: gx1, y: PY - PH / 2, width: PX + U - gx1, height: PH, rx: 4, class: 'pipe-seg' }, layer);
    for (const x of [PX, PX + U]) el('rect', { x: x - 7, y: PY - PH / 2 - 9, width: 14, height: PH + 18, rx: 4, class: 'pipe-flange' }, layer);
    el('rect', { x: gx0, y: PY - PH / 2 - 4, width: gx1 - gx0, height: PH + 8, rx: 6, class: 'gap-mark glow', 'data-hint': 'gap' }, layer);
    el('rect', { x: PX + U + 7, y: 240, width: 140, height: 120, rx: 18, class: 'mini-tank-target' }, layer);
    const tankWater = el('rect', { x: PX + U + 13, y: 354, width: 128, height: 0, rx: 12, fill: 'url(#water)' }, layer);
    const flowLine = el('line', { x1: 290, y1: PY, x2: gx0, y2: PY, class: 'pipe-water' }, layer);
    const leak = el('g', { class: 'leak' }, layer);
    const drips = [1, 2, 3].map((k) => el('circle', { cx: 0, cy: PY + 14, r: 6, class: `drip d${k}` }, leak));

    // Skrzynka
    el('rect', { x: 270, y: 430, width: 500, height: 160, rx: 14, class: 'crate' }, layer);
    for (const y of [470, 515, 560]) el('line', { x1: 276, y1: y, x2: 764, y2: y, class: 'crate-slat' }, layer);
    const piecesG = el('g', {}, layer);
    const labels = el('g', {}, layer);

    const len = (i) => R.val(R.parse(stage.pieces[i])) * U;

    function cratePositions() {
      const pos = {};
      let x = 295, y = 448;
      stage.pieces.forEach((_, i) => {
        if (placed.includes(i)) return;
        if (x + len(i) > 750) { x = 295; y += 64; }
        pos[i] = { x, y };
        x += len(i) + 24;
      });
      return pos;
    }

    function render() {
      piecesG.textContent = '';
      const crate = cratePositions();
      let gx = gx0;
      const draw = (i, x, y, isPlaced) => {
        const g = el('g', { class: `piece clickable glow${isPlaced ? ' placed' : ''}`, 'data-hint': `piece-${i}`, role: 'button' }, piecesG);
        el('rect', { x, y, width: len(i), height: PH, rx: 6 }, g);
        if (stage.labels || done) fraction(g, R.parse(stage.pieces[i]), x + len(i) / 2, y + PH / 2 - 1, 17);
        g.addEventListener('click', () => onPiece(i, g));
        return g;
      };
      for (const i of placed) { draw(i, gx, PY - PH / 2, true); gx += len(i); }
      for (const [i, p] of Object.entries(crate)) draw(Number(i), p.x, p.y, false);
      const rest = gx1 - gx;
      drips.forEach((d, k) => d.setAttribute('cx', gx + rest * (0.3 + k * 0.2)));
      leak.style.display = rest > 0.5 && !done ? '' : 'none';
      ctx.applyHints();
    }

    function onPiece(i, g) {
      if (busy || done) return;
      const at = placed.indexOf(i);
      if (at >= 0) {
        placed.splice(at, 1);
        ctx.sound.play('tap');
      } else if (R.pipeFits(stage, placed, i)) {
        placed.push(i);
        ctx.sound.play('clunk');
      } else {
        stats.fails++;
        ctx.sound.play('bounce');
        ctx.say(stage.tooLongText, 'sad');
        g.classList.add('bounce');
        setTimeout(() => g.classList.remove('bounce'), 500);
        return;
      }
      render();
    }

    async function release() {
      if (busy || done) return;
      if (placed.length === 0) { ctx.say('Najpierw dotknij kawałka rury w skrzynce, żeby go wstawić.', 'think'); return; }
      busy = true;
      const ev = R.checkPipe(stage, placed);
      ctx.sound.play('splash');
      const reach = ev.ok ? PX + U + 10 : gx0 + R.val(ev.total) * U;
      flowLine.setAttribute('x2', reach);
      flowLine.classList.add('flowing');
      if (!ev.ok) {
        stats.fails++;
        ctx.sound.play('drip');
        ctx.say(stage.shortText, 'sad');
        await wait(1600);
        flowLine.classList.remove('flowing');
        busy = false;
        return;
      }
      done = true;
      render();
      await tween(1200, (k) => {
        tankWater.setAttribute('height', 100 * k);
        tankWater.setAttribute('y', 354 - 100 * k);
      });
      const names = placed.map((i) => R.str(R.parse(stage.pieces[i])));
      const gapName = R.str(gap);
      el('text', { x: (gx0 + gx1) / 2, y: PY + 60, 'text-anchor': 'middle', 'font-size': 26, 'font-weight': 800, text: names.length > 1 ? `${names.join(' + ')} = ${gapName}` : gapName }, labels);
      // Na miarce widać, jaką część całej rury zajmowała dziura.
      el('rect', { x: gx0, y: 214, width: gx1 - gx0, height: 32, rx: 6, class: 'gap-span' }, rulerResult);
      fraction(rulerResult, gap, (gx0 + gx1) / 2, 192, 20);
      ctx.sound.play('success');
      ctx.say(names.length > 1
        ? `Szczelnie! ${names.join(' + ')} = ${gapName}. Razem te kawałki są tak długie jak dziura, czyli ${gapName} całej rury.`
        : `Szczelnie! Dziura to ${gapName} całej rury — zobacz na miarce. Kawałek ${gapName} pasuje idealnie.`, 'happy');
      ctx.complete({ signature: ev.signature, pieces: ev.pieces });
    }

    ctx.setAction('💧 Puść wodę', release);
    render();
    return {};
  };
})();
