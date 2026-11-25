/* Mechanika: mycie szyb (model pola). */
(function () {
  'use strict';
  const GF = window.GF;
  GF.mechanics = GF.mechanics || {};
  const R = GF.rules;
  const { el, fraction, svgPoint } = GF.svg;

  // Ułamek do pokazania tak, jak jest zapisany w danych (2/4 zostaje 2/4).
  const written = (s) => { const [n, d] = String(s).split('/').map(Number); return { n, d: d || 1 }; };

  GF.mechanics.window = function mountWindow(ctx) {
    const { stage, layer, stats, svg } = ctx;
    const wide = stage.cols > 2;
    const X = wide ? 320 : 380, Y = 70, W = wide ? 480 : 320, H = 320;
    const total = stage.rows * stage.cols;
    const pw = W / stage.cols, ph = H / stage.rows;
    const cleaned = new Set();
    let done = false;

    const scene = el('g', { class: 'window-scene' }, layer);
    el('circle', { cx: X + W * 0.7, cy: Y + H * 0.3, r: 70, class: 'sun', opacity: 0.35 }, scene);
    const beams = el('g', { class: 'beams' }, scene);
    const panesG = el('g', { class: 'panes glow', 'data-hint': 'window' }, scene);
    const panes = [];
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / stage.cols), c = i % stage.cols;
      const x = X + c * pw, y = Y + r * ph;
      const g = el('g', { class: 'pane clickable glow', 'data-hint': `pane-${i} window`, 'data-pane': i, role: 'button', 'aria-label': `Szybka ${i + 1}` }, panesG);
      el('rect', { x, y, width: pw, height: ph, class: 'glass' }, g);
      const dirt = el('g', { class: 'dirt' }, g);
      el('rect', { x: x + 4, y: y + 4, width: pw - 8, height: ph - 8 }, dirt);
      const seed = (i * 37) % 11;
      for (let k = 0; k < 6; k++) {
        el('circle', {
          cx: x + 20 + ((k * 53 + seed * 13) % Math.max(1, pw - 40)),
          cy: y + 20 + ((k * 71 + seed * 29) % Math.max(1, ph - 40)),
          r: 9 + ((k + seed) % 4) * 5,
        }, dirt);
      }
      el('path', { d: `M${x + 18} ${y + ph * 0.45} l ${pw * 0.25} -${ph * 0.25} M${x + 22} ${y + ph * 0.65} l ${pw * 0.4} -${ph * 0.4}`, class: 'shine' }, g);
      el('polygon', { points: `${x} ${y} ${x + pw} ${y} ${x + pw + 60} 540 ${x + 60} 540`, class: 'beam' }, beams);
      panes.push(g);
    }
    el('rect', { x: X, y: Y, width: W, height: H, rx: 6, class: 'window-frame' }, scene);
    el('line', { x1: X + W / 2, y1: Y - 20, x2: X + W / 2, y2: Y + H + 20, class: 'half-line hint-only', 'data-hint': 'half-line' }, scene);
    const labels = el('g', {}, scene);
    const LX = X + W + 70, LY = Y + H / 2;

    // Tabliczka z zapisem: ile okna umyć.
    let tablet = null;
    if (stage.tablet) {
      tablet = el('g', { class: 'window-tablet glow', 'data-hint': 'cue' }, scene);
      el('rect', { x: LX - 44, y: LY - 58, width: 88, height: 104, rx: 10, class: 'tablet' }, tablet);
      fraction(tablet, written(stage.target), LX, LY - 8, 38);
      el('text', { x: LX, y: LY + 74, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 700, text: 'okna' }, scene).classList.add('tablet-caption');
    }

    function render() {
      panes.forEach((g, i) => g.classList.toggle('clean', cleaned.has(i)));
      [...beams.children].forEach((b, i) => b.style.opacity = done && cleaned.has(i) ? 1 : 0);
      ctx.applyHints();
    }

    function setPane(i, clean) {
      if (done || cleaned.has(i) === clean) return;
      if (clean) cleaned.add(i); else cleaned.delete(i);
      ctx.sound.play('squeak');
      render();
    }

    // Dotknięcie przełącza szybkę. Przesunięcie palca myje (albo brudzi) każdą szybkę po drodze:
    // co zrobi, zależy od pierwszej dotkniętej szybki.
    function paneAt(p) {
      const c = Math.floor((p.x - X) / pw), r = Math.floor((p.y - Y) / ph);
      if (c < 0 || r < 0 || c >= stage.cols || r >= stage.rows) return -1;
      return r * stage.cols + c;
    }
    let wipe = null;
    panesG.addEventListener('pointerdown', (e) => {
      if (done || !e.isPrimary) return;
      const i = paneAt(svgPoint(svg, e));
      if (i < 0) return;
      e.preventDefault();
      wipe = { id: e.pointerId, clean: !cleaned.has(i) };
      setPane(i, wipe.clean);
    });
    const onMove = (e) => {
      if (!wipe || wipe.id !== e.pointerId) return;
      const i = paneAt(svgPoint(svg, e));
      if (i >= 0) setPane(i, wipe.clean);
    };
    const onUp = (e) => { if (wipe && wipe.id === e.pointerId) wipe = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    function check() {
      if (cleaned.size === 0) { ctx.say('Dotknij szybek albo przeciągnij po nich palcem, żeby je umyć.', 'think'); return; }
      const ev = R.checkWindow(stage, [...cleaned]);
      if (!ev.ok) {
        stats.fails++;
        ctx.sound.play('fail');
        const fallback = ev.result === 'short'
          ? 'Za mało czystych szybek. Policz, ile ich trzeba.'
          : 'Za dużo czystych szybek. Policz, ile ich trzeba.';
        ctx.say((ev.result === 'short' ? stage.shortText : stage.overText) || fallback, 'sad');
        return;
      }
      done = true;
      wipe = null;
      scene.classList.add('lit');
      scene.querySelector('.sun').setAttribute('opacity', 1);
      if (tablet) { tablet.remove(); scene.querySelector('.tablet-caption')?.remove(); }
      const got = { n: cleaned.size, d: total };
      const reduced = R.parse(got);
      if (reduced.d !== total) {
        fraction(labels, got, LX - 44, LY, 40);
        el('text', { x: LX, y: LY + 14, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 800, text: '=' }, labels);
        fraction(labels, reduced, LX + 44, LY, 40);
      } else {
        fraction(labels, got, LX, LY, 54);
      }
      el('text', { x: LX, y: LY + 90, 'text-anchor': 'middle', 'font-size': 20, class: 'caption', text: `${cleaned.size} z ${total} szybek` }, labels);
      ctx.sound.play('success');
      const half = R.eq(reduced, R.parse('1/2')) && total === 4 ? ': dwie równe części, czysta i brudna' : '';
      const same = reduced.d !== total ? ` To tyle samo co ${R.str(reduced)}.` : '';
      ctx.say(stage.successText || `Jak jasno! ${cleaned.size} z ${total} szybek to ${cleaned.size}/${total} okna${half}.${same}`, 'happy');
      render();
      ctx.complete({ signature: ev.signature, diagonal: ev.diagonal });
    }

    ctx.setAction('Gotowe', check);
    render();
    return {
      destroy() {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
      },
    };
  };
})();
