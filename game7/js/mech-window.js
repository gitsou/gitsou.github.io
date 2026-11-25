/* Mechanika: mycie szyb (model pola). */
(function () {
  'use strict';
  const GF = window.GF;
  GF.mechanics = GF.mechanics || {};
  const R = GF.rules;
  const { el, fraction } = GF.svg;

  GF.mechanics.window = function mountWindow(ctx) {
    const { stage, layer, stats } = ctx;
    const X = 380, Y = 70, W = 320, H = 320;
    const pw = W / stage.cols, ph = H / stage.rows;
    const cleaned = new Set();
    let done = false;

    const scene = el('g', { class: 'window-scene' }, layer);
    el('circle', { cx: X + W * 0.7, cy: Y + H * 0.3, r: 70, class: 'sun', opacity: 0.35 }, scene);
    const beams = el('g', { class: 'beams' }, scene);
    const panesG = el('g', { class: 'panes glow', 'data-hint': 'window' }, scene);
    const panes = [];
    for (let i = 0; i < stage.rows * stage.cols; i++) {
      const r = Math.floor(i / stage.cols), c = i % stage.cols;
      const x = X + c * pw, y = Y + r * ph;
      const g = el('g', { class: 'pane clickable glow', 'data-hint': `pane-${i} window`, role: 'button', 'aria-label': `Szybka ${i + 1}` }, panesG);
      el('rect', { x, y, width: pw, height: ph, class: 'glass' }, g);
      const dirt = el('g', { class: 'dirt' }, g);
      el('rect', { x: x + 4, y: y + 4, width: pw - 8, height: ph - 8 }, dirt);
      const seed = (i * 37) % 11;
      for (let k = 0; k < 6; k++) {
        el('circle', {
          cx: x + 20 + ((k * 53 + seed * 13) % (pw - 40)),
          cy: y + 20 + ((k * 71 + seed * 29) % (ph - 40)),
          r: 9 + ((k + seed) % 4) * 5,
        }, dirt);
      }
      el('path', { d: `M${x + 18} ${y + ph * 0.45} l ${pw * 0.25} -${ph * 0.25} M${x + 22} ${y + ph * 0.65} l ${pw * 0.4} -${ph * 0.4}`, class: 'shine' }, g);
      el('polygon', { points: `${x} ${y} ${x + pw} ${y} ${x + pw + 60} 540 ${x + 60} 540`, class: 'beam' }, beams);
      g.addEventListener('click', () => toggle(i));
      panes.push(g);
    }
    el('rect', { x: X, y: Y, width: W, height: H, rx: 6, class: 'window-frame' }, scene);
    el('line', { x1: X + W / 2, y1: Y - 20, x2: X + W / 2, y2: Y + H + 20, class: 'half-line hint-only', 'data-hint': 'half-line' }, scene);
    const labels = el('g', {}, scene);

    function render() {
      panes.forEach((g, i) => g.classList.toggle('clean', cleaned.has(i)));
      [...beams.children].forEach((b, i) => b.style.opacity = done && cleaned.has(i) ? 1 : 0);
      ctx.applyHints();
    }

    function toggle(i) {
      if (done) return;
      if (cleaned.has(i)) cleaned.delete(i); else cleaned.add(i);
      ctx.sound.play('squeak');
      render();
    }

    function check() {
      if (cleaned.size === 0) { ctx.say('Dotknij szybek, żeby je umyć.', 'think'); return; }
      const ev = R.checkWindow(stage, [...cleaned]);
      if (!ev.ok) {
        stats.fails++;
        ctx.sound.play('fail');
        ctx.say(ev.result === 'short' ? stage.shortText : stage.overText, 'sad');
        return;
      }
      done = true;
      scene.classList.add('lit');
      scene.querySelector('.sun').setAttribute('opacity', 1);
      fraction(labels, ev.target, X + W + 70, Y + H / 2, 54);
      el('text', { x: X + W + 70, y: Y + H / 2 + 90, 'text-anchor': 'middle', 'font-size': 20, class: 'caption', text: `${cleaned.size} z ${stage.rows * stage.cols} szybek` }, labels);
      ctx.sound.play('success');
      ctx.say(`Jak jasno! ${cleaned.size} z ${stage.rows * stage.cols} szybek to ${R.str(ev.target)} okna: dwie równe części, czysta i brudna.`, 'happy');
      render();
      ctx.complete({ signature: ev.signature, diagonal: ev.diagonal });
    }

    ctx.setAction('Gotowe', check);
    render();
    return {};
  };
})();
