/* Mechanika: cięcie wody w zbiorniku i rozlewanie porcji do grządek (model miary). */
(function () {
  'use strict';
  const GF = window.GF;
  GF.mechanics = GF.mechanics || {};
  const R = GF.rules;
  const { el, fraction, fractionHTML, tween, wait, svgPoint, drawPlant } = GF.svg;

  const COLORS = ['#e76f51', '#8e5bd6', '#2a9d8f', '#e9a23b', '#3d7dd8'];
  const TX = 340, TY = 58, TW = 400, TH = 92;   // zbiornik; TW to skala całości także dla grządek
  const MANIFOLD_Y = 236, VALVE_Y = 276, GAUGE_Y = 368, BED_Y = 455;
  const FLOOR_Y = 540;

  function layoutTargets(stage) {
    const widths = stage.targets.map((t) => {
      if (t.kind === 'barrel') return 100;
      if (t.width) return t.width;
      if (stage.cue === 'size') return R.val(R.parse(t.need)) * TW * 1.1;
      return 160;
    });
    const area = { from: 200, to: 990 };
    const span = area.to - area.from;
    const sum = widths.reduce((a, b) => a + b, 0);
    const gap = Math.min(60, Math.max(14, (span - sum) / Math.max(1, widths.length - 1)));
    let x = area.from + (span - sum - gap * (widths.length - 1)) / 2;
    return stage.targets.map((t, i) => {
      const out = { ...t, x, w: widths[i], cx: x + widths[i] / 2, color: t.kind === 'barrel' ? '#8d6e63' : COLORS[i % COLORS.length] };
      x += widths[i] + gap;
      return out;
    });
  }

  GF.mechanics.water = function mountWater(ctx) {
    const { stage, layer, stats, svg } = ctx;
    const parts = stage.parts;
    const PW = TW / parts;
    const targets = layoutTargets(stage);
    const byId = Object.fromEntries(targets.map((t) => [t.id, t]));
    let cuts = [];
    let assign = {};
    let selected = null;
    let phase = 'plan'; // plan | flowing | result | question | done
    let tutorialStep = 0;

    // --- Statyczne elementy ---------------------------------------------------

    const pipes = el('g', { class: 'pipes' }, layer);
    const xs = targets.map((t) => t.cx);
    const TCX = TX + TW / 2;
    const minX = Math.min(TCX, ...xs), maxX = Math.max(TCX, ...xs);
    const pipePath = `M${TCX} ${TY + TH + 10} V${MANIFOLD_Y} M${minX} ${MANIFOLD_Y} H${maxX} ` + xs.map((x) => `M${x} ${MANIFOLD_Y} V${VALVE_Y}`).join(' ');
    el('path', { d: pipePath, class: 'pipe' }, pipes);
    const mainWater = el('path', { d: `M${TCX} ${TY + TH + 10} V${MANIFOLD_Y}`, class: 'pipe-water' }, pipes);
    const branchWater = {};
    for (const t of targets) {
      branchWater[t.id] = el('path', { d: `M${TCX} ${MANIFOLD_Y} H${t.cx} V${VALVE_Y}`, class: 'pipe-water' }, pipes);
    }

    el('rect', { x: TX - 30, y: TY - 12, width: TW + 60, height: TH + 24, rx: 22, class: 'tank-frame' }, layer);
    const tankG = el('g', { class: 'tank' }, layer);
    const portionsG = el('g', {}, tankG);
    const guidesG = el('g', {}, tankG);
    const scissorsG = el('g', {}, layer);
    const compareG = el('g', {}, layer);
    const trail = el('line', { class: 'gesture-trail', x1: 0, y1: 0, x2: 0, y2: 0, visibility: 'hidden' }, layer);
    const demo = el('g', { class: 'gesture-demo hint-only', 'data-hint': 'gesture' }, layer);
    el('circle', { cx: TX + 2 * PW, cy: TY + 4, r: 16 }, demo);

    const targetG = {};
    const previewG = el('g', {}, layer);
    const gaugeG = el('g', {}, layer);
    const labelsG = el('g', {}, layer);
    const barrelWater = {};

    for (const t of targets) {
      const g = el('g', { class: `target ${t.kind} clickable`, 'data-hint': `target-${t.id}` }, layer);
      targetG[t.id] = g;
      const valve = el('g', { class: 'valve glow', 'data-hint': `target-${t.id}` }, g);
      el('circle', { cx: t.cx, cy: VALVE_Y, r: 22, class: 'valve-wheel' }, valve);
      el('path', { d: `M${t.cx - 14} ${VALVE_Y} h28 M${t.cx} ${VALVE_Y - 14} v28`, class: 'spokes' }, valve);
      el('circle', { cx: t.cx + 18, cy: VALVE_Y - 18, r: 9, fill: t.color, class: 'badge' }, valve);

      if (t.kind === 'barrel') {
        const by = 400;
        el('rect', { x: t.x + 8, y: by, width: t.w - 16, height: 130, rx: 22, class: 'barrel-body glow' }, g);
        barrelWater[t.id] = el('rect', { x: t.x + 16, y: by + 122, width: t.w - 32, height: 0, rx: 10, class: 'barrel-water' }, g);
        for (const y of [by + 28, by + 102]) el('line', { x1: t.x + 8, y1: y, x2: t.x + t.w - 8, y2: y, class: 'barrel-hoop' }, g);
        el('text', { x: t.cx, y: by + 72, 'text-anchor': 'middle', 'font-size': 16, fill: '#fff', 'font-weight': 700, text: 'zapas' }, g);
      } else {
        el('rect', { x: t.x, y: BED_Y, width: t.w, height: 70, rx: 8, class: 'bed-box glow' }, g);
        el('rect', { x: t.x + 6, y: BED_Y + 6, width: t.w - 12, height: 16, rx: 4, class: 'bed-soil' }, g);
        el('rect', { x: t.x + 10, y: BED_Y + 40, width: 18, height: 18, rx: 4, fill: t.color, class: 'bed-flag' }, g);
        const n = Math.max(2, Math.floor(t.w / 55));
        for (let k = 0; k < n; k++) drawPlant(g, t.plant, t.x + (t.w / n) * (k + 0.5), BED_Y + 12, k);
        drawCue(g, t);
      }
      g.addEventListener('click', () => onTarget(t.id));
    }

    function drawCue(g, t) {
      const need = R.parse(t.need);
      if (stage.cue === 'icon') {
        const c = el('g', { class: 'cue-icon glow', 'data-hint': `cue cue-${t.id}` }, g);
        const w = 96, h = 30, x = t.cx - w / 2, y = 312;
        el('rect', { x, y, width: w, height: h, rx: 7, class: 'mini-tank' }, c);
        el('rect', { x: x + 3, y: y + 3, width: (w - 6) * R.val(need), height: h - 6, rx: 4, class: 'mini-water' }, c);
        for (let k = 1; k < parts; k++) el('line', { x1: x + (w / parts) * k, y1: y + 3, x2: x + (w / parts) * k, y2: y + h - 3, class: 'mini-line' }, c);
      } else if (stage.cue === 'label') {
        const c = el('g', { class: 'cue-label glow', 'data-hint': `cue cue-${t.id}` }, g);
        el('rect', { x: t.cx - 30, y: 302, width: 60, height: 58, rx: 8, class: 'tablet' }, c);
        fraction(c, need, t.cx, 330, 22);
      }
    }

    // --- Rysowanie stanu --------------------------------------------------------

    const portionList = () => R.portions(parts, cuts);
    const shiftOf = (i, n) => (n > 1 ? (i - (n - 1) / 2) * 16 : 0);
    const assignedTo = (tid) => Object.keys(assign).filter((pid) => assign[pid] === tid);

    function render() {
      const ps = portionList();
      portionsG.textContent = '';
      guidesG.textContent = '';
      scissorsG.textContent = '';
      previewG.textContent = '';

      ps.forEach((p, i) => {
        const dx = shiftOf(i, ps.length);
        const tid = assign[p.id];
        const g = el('g', { class: `portion clickable${selected === p.id ? ' selected' : ''}`, 'data-hint': `portion-${p.start}`, 'data-pid': p.id, transform: `translate(${dx} ${selected === p.id ? -8 : 0})` }, portionsG);
        const x = TX + p.start * PW + 3, w = (p.end - p.start) * PW - 6;
        el('rect', { x, y: TY, width: w, height: TH, rx: 12, class: 'water-body' }, g);
        el('rect', { x: x + 6, y: TY + 6, width: w - 12, height: 8, rx: 4, class: 'wave' }, g);
        for (let k = p.start + 1; k < p.end; k++) el('line', { x1: TX + k * PW, y1: TY + 18, x2: TX + k * PW, y2: TY + TH - 6, class: 'unit-line' }, g);
        if (tid) el('circle', { cx: x + w - 14, cy: TY + TH - 14, r: 10, fill: byId[tid].color, stroke: '#fff', 'stroke-width': 3 }, g);
        g.addEventListener('click', (e) => { e.stopPropagation(); onPortion(p.id); });
      });

      for (let k = 1; k < parts; k++) {
        if (cuts.includes(k)) continue;
        const idx = ps.findIndex((p) => p.start < k && k < p.end);
        const x = TX + k * PW + shiftOf(idx, ps.length);
        const pulse = stage.pulseLine === k && ctx.firstVisit && cuts.length === 0;
        el('line', { x1: x, y1: TY + 6, x2: x, y2: TY + TH - 6, class: `cut-guide${pulse ? ' pulse' : ''}`, 'data-hint': `line-${k}` }, guidesG);
        const s = el('g', { class: 'scissors clickable glow', 'data-hint': `line-${k}`, role: 'button', 'aria-label': 'Przetnij tutaj' }, scissorsG);
        el('circle', { cx: x, cy: TY + TH + 38, r: 21 }, s);
        el('text', { x, y: TY + TH + 39, text: '✂' }, s);
        s.addEventListener('click', () => cut(k, false));
      }

      for (const k of cuts) {
        const i = ps.findIndex((p) => p.start === k);
        const x = TX + k * PW + (shiftOf(i - 1, ps.length) + shiftOf(i, ps.length)) / 2;
        const b = el('g', { class: 'glue clickable', role: 'button', 'aria-label': 'Sklej wodę' }, scissorsG);
        el('circle', { cx: x, cy: TY + TH + 38, r: 21 }, b);
        const plaster = el('g', { transform: `rotate(-35 ${x} ${TY + TH + 38})` }, b);
        el('rect', { x: x - 15, y: TY + TH + 31, width: 30, height: 14, rx: 7, class: 'plaster' }, plaster);
        el('rect', { x: x - 5, y: TY + TH + 31, width: 10, height: 14, class: 'plaster-pad' }, plaster);
        b.addEventListener('click', () => glue(k));
      }

      for (const t of targets) {
        targetG[t.id].classList.toggle('pick', Boolean(selected));
        const pids = assignedTo(t.id);
        targetG[t.id].querySelector('.valve').classList.toggle('open', pids.length > 0);
        let x = t.cx - pids.reduce((a, pid) => a + R.val(ps.find((p) => p.id === pid).value) * TW, 0) / 2;
        for (const pid of pids) {
          const w = R.val(ps.find((p) => p.id === pid).value) * TW;
          el('rect', { x: x + 2, y: GAUGE_Y, width: w - 4, height: 18, rx: 8, class: 'preview' }, previewG);
          x += w;
        }
      }
      ctx.applyHints();
    }

    // --- Działania gracza ---------------------------------------------------------

    function tutorial(event) {
      if (!stage.tutorial) return;
      if (event === 'cut' && tutorialStep === 0) {
        tutorialStep = 1;
        ctx.say('Świetnie! Teraz przeciągnij palcem porcję wody na grządkę. Plasterek pod zbiornikiem skleja wodę z powrotem.', 'happy');
      } else if (event === 'assign' && tutorialStep <= 1) {
        tutorialStep = 2;
        ctx.say('Tak trzymaj! Druga porcja do drugiej grządki.', 'happy');
      }
      if (event === 'assign' && R.waterReadiness(stage, cuts, assign).ok && tutorialStep < 3) {
        tutorialStep = 3;
        ctx.say('Gotowe? Naciśnij „Puść wodę”!', 'happy');
      }
    }

    function cut(k, byGesture) {
      if (phase !== 'plan' || cuts.includes(k)) return;
      cuts.push(k);
      stats.cutsTotal++;
      if (byGesture) stats.gestureCuts++;
      if (stats.firstCut === undefined) stats.firstCut = k;
      pruneAssign();
      ctx.sound.play('cut');
      render();
      tutorial('cut');
    }

    function pruneAssign() {
      const ids = new Set(portionList().map((p) => p.id));
      for (const pid of Object.keys(assign)) if (!ids.has(pid)) delete assign[pid];
      if (selected && !ids.has(selected)) selected = null;
    }

    function glue(k) {
      if (phase !== 'plan') return;
      cuts = cuts.filter((c) => c !== k);
      pruneAssign();
      ctx.sound.play('clunk');
      render();
    }

    function onPortion(pid) {
      if (swiped) { swiped = false; return; }
      if (phase !== 'plan') return;
      selected = selected === pid ? null : pid;
      ctx.sound.play('tap');
      render();
    }

    function onTarget(tid) {
      if (phase !== 'plan') return;
      if (!selected) {
        const mine = assignedTo(tid);
        if (mine.length) {
          for (const pid of mine) delete assign[pid];
          stats.reassigns++;
          ctx.sound.play('tap');
          render();
        } else {
          ctx.say('Przeciągnij porcję wody ze zbiornika na grządkę. Możesz też dotknąć porcji, a potem grządki.', 'think');
        }
        return;
      }
      assignTo(selected, tid);
    }

    function assignTo(pid, tid) {
      if (assign[pid] && assign[pid] !== tid) stats.reassigns++;
      if (byId[tid].kind === 'bed') {
        for (const other of assignedTo(tid)) {
          if (other !== pid) { delete assign[other]; stats.reassigns++; }
        }
      }
      assign[pid] = tid;
      selected = null;
      ctx.sound.play('clunk');
      render();
      tutorial('assign');
    }

    // Dotyk zbiornika. Pionowy ruch po linii, który kończy się przy zbiorniku, tnie wodę.
    // Każdy inny ruch zaczęty na porcji przeciąga ją; puszczona nad grządką trafia do niej.
    let gesture = null;
    let swiped = false;
    const ghostG = el('g', { class: 'drag-ghost' }, layer);
    const CUT_ZONE_Y = TY + TH + 50;

    function nearestLine(x) {
      const ps = portionList();
      let best = null;
      for (let k = 1; k < parts; k++) {
        if (cuts.includes(k)) continue;
        const idx = ps.findIndex((q) => q.start < k && k < q.end);
        const d = Math.abs(x - (TX + k * PW + shiftOf(idx, ps.length)));
        if (!best || d < best.d) best = { k, d };
      }
      return best;
    }

    function targetAt(p) {
      return targets.find((t) => p.x >= t.x - 20 && p.x <= t.x + t.w + 20 && p.y >= VALVE_Y - 45 && p.y <= 560);
    }

    function startDrag(pid) {
      const p = portionList().find((q) => q.id === pid);
      if (!p) return false;
      const w = R.val(p.value) * TW - 6;
      ghostG.textContent = '';
      el('rect', { x: 0, y: 0, width: w, height: 54, rx: 12, class: 'water-body' }, ghostG);
      ghostG.dataset.w = w;
      portionsG.querySelector(`[data-pid="${pid}"]`)?.classList.add('dragging');
      return true;
    }

    function moveDrag(p) {
      const w = Number(ghostG.dataset.w);
      ghostG.setAttribute('transform', `translate(${p.x - w / 2} ${p.y - 27})`);
      const over = targetAt(p);
      for (const t of targets) targetG[t.id].classList.toggle('drop-hover', over === t);
    }

    function endDrag() {
      ghostG.textContent = '';
      for (const t of targets) targetG[t.id].classList.remove('drop-hover');
      portionsG.querySelector('.dragging')?.classList.remove('dragging');
    }

    tankG.addEventListener('pointerdown', (e) => {
      if (phase !== 'plan' || !e.isPrimary) return;
      const p = svgPoint(svg, e);
      const pg = e.target.closest('[data-pid]');
      gesture = { id: e.pointerId, x: p.x, y: p.y, pid: pg ? pg.dataset.pid : null, mode: null };
      swiped = false;
    });
    const moveSwipe = (e) => {
      if (!gesture || gesture.id !== e.pointerId) return;
      const p = svgPoint(svg, e);
      const dx = p.x - gesture.x, dy = p.y - gesture.y;
      if (!gesture.mode) {
        if (Math.hypot(dx, dy) < 12) return;
        const line = nearestLine(gesture.x);
        const vertical = Math.abs(dy) > Math.abs(dx) * 1.5;
        if (vertical && line && line.d <= PW * 0.3) gesture.mode = 'cut';
        else if (gesture.pid && startDrag(gesture.pid)) gesture.mode = 'drag';
        else gesture.mode = 'none';
      }
      // Ruch w dół daleko poza zbiornik to przeciąganie porcji, a nie cięcie.
      if (gesture.mode === 'cut' && p.y > CUT_ZONE_Y && gesture.pid && startDrag(gesture.pid)) {
        gesture.mode = 'drag';
        trail.setAttribute('visibility', 'hidden');
      }
      if (gesture.mode === 'cut') {
        trail.setAttribute('x1', gesture.x); trail.setAttribute('y1', gesture.y);
        trail.setAttribute('x2', p.x); trail.setAttribute('y2', Math.min(p.y, CUT_ZONE_Y));
        trail.setAttribute('visibility', 'visible');
      } else if (gesture.mode === 'drag') {
        moveDrag(p);
      }
    };
    const endSwipe = (e) => {
      if (!gesture || gesture.id !== e.pointerId) return;
      const g = gesture;
      gesture = null;
      trail.setAttribute('visibility', 'hidden');
      if (g.mode) { swiped = true; setTimeout(() => { swiped = false; }, 400); }
      const p = svgPoint(svg, e);
      if (g.mode === 'drag') {
        endDrag();
        const t = e.type === 'pointerup' && phase === 'plan' ? targetAt(p) : null;
        if (t) assignTo(g.pid, t.id);
        return;
      }
      if (g.mode !== 'cut' || e.type !== 'pointerup' || phase !== 'plan') return;
      if (Math.abs(p.y - g.y) < 30) return;
      const line = nearestLine((p.x + g.x) / 2);
      if (line && line.d <= PW * 0.35) cut(line.k, true);
    };
    window.addEventListener('pointermove', moveSwipe);
    window.addEventListener('pointerup', endSwipe);
    window.addEventListener('pointercancel', endSwipe);

    // --- Puszczenie wody ------------------------------------------------------------

    function failMessage(ev) {
      if (stage.failText) return stage.failText;
      const over = ev.results.find((r) => r.result === 'over');
      if (over) return byId[over.id].overText || 'Ta grządka dostała za dużo wody i się przelała. Kałuża pokazuje, ile było za dużo.';
      const short = ev.results.find((r) => r.result === 'short');
      if (short) return byId[short.id].shortText || 'Tej grządce zabrakło wody. Przerywana ramka pokazuje, ile brakuje.';
      return 'Coś poszło nie tak. Spróbuj jeszcze raz!';
    }

    async function release() {
      if (phase !== 'plan') return;
      const ready = R.waterReadiness(stage, cuts, assign);
      if (!ready.ok) {
        ctx.sound.play('tap');
        ctx.say(ready.reason === 'leftover' ? 'Resztę wody wlej do beczki na zapas.' : 'Każda grządka musi dostać swoją porcję wody.', 'think');
        return;
      }
      phase = 'flowing';
      selected = null;
      ctx.setAction(null);
      const ev = R.evaluateWater(stage, cuts, assign);
      const ps = portionList();
      render();
      guidesG.textContent = '';
      scissorsG.textContent = '';

      ctx.sound.play('splash');
      mainWater.classList.add('flowing');
      for (const t of targets) if (assignedTo(t.id).length) branchWater[t.id].classList.add('flowing');
      const drained = [...portionsG.children].filter((_, i) => assign[ps[i].id]);
      await tween(900, (k) => drained.forEach((g) => g.setAttribute('opacity', 1 - k)));
      previewG.textContent = '';

      // Wskaźnik przy każdej grządce: ramka potrzeby, wlana woda, ewentualne przelanie.
      const anims = [];
      for (const r of ev.results) {
        const t = byId[r.id];
        if (r.kind === 'barrel') {
          const h = R.val(r.got) * 106;
          const rect = barrelWater[t.id];
          anims.push(tween(1100, (k) => { rect.setAttribute('height', h * k); rect.setAttribute('y', 522 - h * k); }));
          continue;
        }
        const needW = R.val(r.need) * TW, gotW = R.val(r.got) * TW;
        const x0 = t.cx - needW / 2;
        const g = el('g', { class: `gauge ${r.result}` }, gaugeG);
        el('rect', { x: x0, y: GAUGE_Y - 4, width: needW, height: 26, rx: 9, class: 'gauge-need' }, g);
        const fill = el('rect', { x: x0, y: GAUGE_Y, width: 0, height: 18, rx: 7, class: 'gauge-fill' }, g);
        const spill = el('rect', { x: x0 + needW, y: GAUGE_Y, width: 0, height: 18, rx: 7, class: 'gauge-spill' }, g);
        const puddle = el('ellipse', { cx: t.cx, cy: FLOOR_Y + 24, rx: 0, ry: 0, class: 'puddle' }, g);
        const stream = el('line', { x1: t.cx, y1: VALVE_Y + 22, x2: t.cx, y2: BED_Y, class: 'stream' }, g);
        anims.push(tween(1100, (k) => {
          fill.setAttribute('width', Math.min(gotW, needW) * k);
          if (gotW > needW) {
            const over = (gotW - needW) * k;
            spill.setAttribute('width', over);
            puddle.setAttribute('rx', over / 2);
            puddle.setAttribute('ry', Math.min(14, over / 6));
          }
        }).then(() => stream.remove()));
      }
      await Promise.all(anims);
      mainWater.classList.remove('flowing');
      Object.values(branchWater).forEach((w) => w.classList.remove('flowing'));

      for (const r of ev.results) {
        if (r.kind !== 'bed') continue;
        const g = targetG[r.id];
        g.classList.add(r.result === 'ok' ? 'happy' : r.result === 'over' ? 'drowned' : 'short');
      }
      if (ev.results.some((r) => r.result === 'ok')) ctx.sound.play('grow');

      if (!ev.ok) {
        phase = 'result';
        stats.fails++;
        ctx.sound.play('fail');
        ctx.say(failMessage(ev), 'sad');
        ctx.setAction('↺ Jeszcze raz', resetTank);
        return;
      }

      showLabels(ev);
      if (stage.question) { askQuestion(ev); return; }
      finish(ev);
    }

    function showLabels(ev) {
      for (const r of ev.results) {
        const t = byId[r.id];
        if (r.kind === 'barrel') continue;
        if (stage.notation === 'after') fraction(labelsG, r.got, stage.cue === 'icon' ? t.cx + 68 : t.cx, 322, 22);
      }
    }

    function finish(ev) {
      phase = 'done';
      ctx.sound.play('success');
      ctx.say(stage.successText || ctx.level.successText || 'Brawo! Rośliny piją i rosną.', 'happy');
      ctx.complete({ signature: ev.signature });
    }

    function askQuestion(ev) {
      phase = 'question';
      const q = stage.question;
      const box = ctx.overlay;
      box.hidden = false;
      box.innerHTML = `<p>${q.text}</p><div class="answers"></div>`;
      const answers = box.querySelector('.answers');
      for (const opt of q.options) {
        const f = R.parse(opt);
        const b = document.createElement('button');
        b.type = 'button';
        b.innerHTML = fractionHTML(f);
        b.setAttribute('aria-label', R.str(f));
        b.addEventListener('click', () => {
          if (phase !== 'question') return;
          if (R.eq(f, ev.barrel)) {
            box.hidden = true;
            finish(ev);
          } else {
            stats.answerFails++;
            ctx.sound.play('fail');
            b.classList.add('wrong');
            b.disabled = true;
            ctx.say(q.wrongText, 'think');
            showCompare(ev.barrel);
          }
        });
        answers.append(b);
      }
      ctx.say(q.text, 'think');
    }

    // Woda z beczki pokazana w pustym zbiorniku, na tle podziałki.
    function showCompare(amount) {
      compareG.textContent = '';
      el('rect', { x: TX + 3, y: TY + 10, width: R.val(amount) * TW - 6, height: TH - 20, rx: 10, class: 'compare-bar' }, compareG);
      for (let k = 1; k < parts; k++) el('line', { x1: TX + k * PW, y1: TY + 4, x2: TX + k * PW, y2: TY + TH - 4, class: 'cut-guide', style: 'stroke:#6fb5c9' }, compareG);
    }

    function resetTank() {
      cuts = [];
      assign = {};
      selected = null;
      phase = 'plan';
      gaugeG.textContent = '';
      labelsG.textContent = '';
      compareG.textContent = '';
      for (const t of targets) {
        targetG[t.id].classList.remove('happy', 'drowned', 'short');
        if (barrelWater[t.id]) { barrelWater[t.id].setAttribute('height', 0); barrelWater[t.id].setAttribute('y', 522); }
      }
      ctx.sound.play('splash');
      ctx.say('Robot wpompował wodę z powrotem. Spróbuj jeszcze raz!', 'happy');
      ctx.setAction('💧 Puść wodę', release);
      render();
    }

    ctx.setAction('💧 Puść wodę', release);
    render();
    return {
      destroy() {
        window.removeEventListener('pointermove', moveSwipe);
        window.removeEventListener('pointerup', endSwipe);
        window.removeEventListener('pointercancel', endSwipe);
      },
    };
  };
})();
