/* Powłoka gry: mapa, przebieg poziomu, robot, podpowiedzi, gwiazdki i zapis postępu. */
(function () {
  'use strict';
  const GF = window.GF;
  const R = GF.rules;
  const { el, drawBackground, drawRobot, setMood } = GF.svg;
  const DATA = GF.levels;
  const STORE = 'gf-progress-v1';

  const $ = (s) => document.querySelector(s);
  const screens = { map: $('#map-screen'), play: $('#play-screen') };
  const bubble = $('#bubble');
  const actionBtn = $('#btn-action');
  const overlay = $('#overlay');
  const svg = $('#scene-svg');

  // --- Postęp -----------------------------------------------------------------

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORE)) || { levels: {} }; } catch { return { levels: {} }; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORE, JSON.stringify(progress)); } catch { /* brak zapisu */ }
  }
  let progress = loadProgress();
  const record = (id) => progress.levels[id] || { done: false, stars: [false, false, false], solutions: [] };

  const chapterOf = (levelId) => DATA.chapters.find((c) => c.levels.some((l) => l.id === levelId));
  const chapterClean = (chapter) => chapter.levels.filter((l) => record(l.id).done).length / chapter.levels.length;
  const isUnlocked = (chapter, i) => i === 0 || record(chapter.levels[i - 1].id).done;

  function show(name) {
    for (const [k, v] of Object.entries(screens)) v.hidden = k !== name;
  }

  // --- Mapa -------------------------------------------------------------------

  function starsHTML(stars) {
    return stars.map((s) => `<span class="${s ? 'on' : ''}">★</span>`).join('');
  }

  function renderMap() {
    const root = $('#map');
    root.textContent = '';
    let total = 0;
    let max = 0;
    for (const room of DATA.rooms) {
      const card = document.createElement('section');
      card.className = 'room';
      const chapter = DATA.chapters.find((c) => c.id === room.chapter);
      if (!chapter) {
        card.classList.add('locked');
        card.innerHTML = `<h2>${room.name}</h2><p class="room-state">W ruinie · wkrótce</p>`;
        root.append(card);
        continue;
      }
      const done = chapter.levels.filter((l) => record(l.id).done).length;
      const renewed = done === chapter.levels.length;
      card.classList.toggle('renewed', renewed);
      card.innerHTML = `<h2>${room.name}</h2><p class="room-state">${renewed ? 'Odnowiony! 🌿' : `W ruinie · ${done}/${chapter.levels.length}`}</p>`;
      const list = document.createElement('ol');
      list.className = 'level-list';
      chapter.levels.forEach((level, i) => {
        const rec = record(level.id);
        total += rec.stars.filter(Boolean).length;
        max += 3;
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'level-btn';
        btn.disabled = !isUnlocked(chapter, i);
        btn.classList.toggle('done', rec.done);
        btn.setAttribute('aria-label', `Poziom ${i + 1}: ${level.title}`);
        btn.innerHTML = `<span class="num">${i + 1}</span><span class="mini-stars">${starsHTML(rec.stars)}</span>`;
        btn.title = level.title;
        btn.addEventListener('click', () => { GF.sound.play('tap'); startLevel(chapter, i); });
        li.append(btn);
        list.append(li);
      });
      card.append(list);
      root.append(card);
    }
    $('#map-total').textContent = `★ ${total} / ${max}`;
  }

  // --- Poziom -----------------------------------------------------------------

  let play = null;
  let robot = null;

  function startLevel(chapter, index) {
    const level = chapter.levels[index];
    play = {
      chapter, index, level,
      prev: JSON.parse(JSON.stringify(record(level.id))),
      stageIdx: 0, stageStats: [], stats: null, hintStep: 0, activeHints: [], locked: false,
      controller: null,
    };
    $('#level-stars').innerHTML = starsHTML(play.prev.stars);
    show('play');
    mountStage(true);
  }

  function mountStage(fresh) {
    const stage = play.level.stages[play.stageIdx];
    if (play.controller && play.controller.destroy) play.controller.destroy();
    const n = play.level.stages.length;
    $('#level-title').textContent = `${play.index + 1}. ${play.level.title}` + (n > 1 ? ` · etap ${play.stageIdx + 1} z ${n}` : '');
    if (fresh) { play.stats = R.newStats(); play.hintStep = 0; }
    play.activeHints = [];
    play.locked = false;
    updateHintButton();
    svg.textContent = '';
    overlay.textContent = '';
    overlay.hidden = true;
    drawBackground(svg, chapterClean(play.chapter));
    robot = drawRobot(svg, 40, 400);
    const layer = el('g', { class: 'mech' }, svg);
    const ctx = {
      svg, layer, overlay, stage, level: play.level, stats: play.stats,
      sound: GF.sound,
      firstVisit: !play.prev.done,
      say, setAction, applyHints,
      complete: stageComplete,
    };
    play.controller = GF.mechanics[stage.type](ctx);
    say(stage.intro, 'happy');
    applyHints();
  }

  function say(text, mood) {
    bubble.textContent = text;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
    if (robot) setMood(robot, mood);
  }

  function setAction(label, handler) {
    if (!label) { actionBtn.hidden = true; actionBtn.onclick = null; return; }
    actionBtn.hidden = false;
    actionBtn.textContent = label;
    actionBtn.onclick = () => { if (!play.locked) handler(); };
  }

  function applyHints() {
    svg.querySelectorAll('.hint-pulse').forEach((e) => e.classList.remove('hint-pulse'));
    for (const key of play ? play.activeHints : []) {
      svg.querySelectorAll(`[data-hint~="${key}"]`).forEach((e) => e.classList.add('hint-pulse'));
    }
  }

  function updateHintButton() {
    const stage = play.level.stages[play.stageIdx];
    const left = Math.max(0, stage.hints.length - play.hintStep);
    $('#hint-count').textContent = left ? String(left) : '';
  }

  function showHint() {
    if (!play || play.locked) return;
    const hints = play.level.stages[play.stageIdx].hints;
    const step = Math.min(play.hintStep, hints.length - 1);
    const hint = hints[step];
    play.stats.hintsUsed++;
    if (play.hintStep < hints.length) play.hintStep++;
    play.activeHints = hint.show || [];
    GF.sound.play('tap');
    say(hint.text, 'think');
    applyHints();
    updateHintButton();
  }

  function stageComplete(info) {
    if (play.locked) return;
    play.locked = true;
    Object.assign(play.stats, info || {});
    play.stageStats.push(play.stats);
    setAction(null);
    play.activeHints = [];
    applyHints();
    // Wynik zostaje na ekranie, dopóki gracz sam nie przejdzie dalej:
    // wyjaśnienie robota jest częścią nauki i nie może zniknąć pod oknem.
    const last = play.stageIdx >= play.level.stages.length - 1;
    const current = play;
    setTimeout(() => {
      if (play !== current) return;
      actionBtn.hidden = false;
      actionBtn.textContent = last ? 'Dalej ›' : 'Następny etap ›';
      actionBtn.onclick = () => {
        actionBtn.onclick = null;
        GF.sound.play('tap');
        if (last) finishLevel();
        else { play.stageIdx++; mountStage(true); }
      };
    }, 900);
  }

  function finishLevel() {
    const { level, chapter, index, prev } = play;
    const merged = R.mergeStats(play.stageStats);
    const earned = R.evaluateStars(level.stars, merged, prev);
    const wasRenewed = chapterClean(chapter) === 1;
    const rec = record(level.id);
    const solutions = new Set(rec.solutions);
    if (merged.signature !== undefined) solutions.add(merged.signature);
    progress.levels[level.id] = {
      done: true,
      stars: rec.stars.map((s, i) => s || earned[i]),
      solutions: [...solutions],
    };
    saveProgress();
    const nowRenewed = chapterClean(chapter) === 1;

    $('#result-title').textContent = earned.every(Boolean) ? 'Wspaniale!' : 'Brawo!';
    let text = level.successText;
    if (nowRenewed && !wasRenewed) text += ` ${chapter.name} odnowiony! Zajrzyj na mapę szklarni.`;
    $('#result-text').textContent = text;
    const list = $('#result-stars');
    list.textContent = '';
    level.stars.forEach((s, i) => {
      const li = document.createElement('li');
      const state = earned[i] ? 'now' : prev.stars[i] ? 'before' : 'empty';
      li.className = `star-${state}`;
      li.style.setProperty('--i', i);
      li.innerHTML = `<span class="big-star">★</span><span>${s.label}</span>`;
      list.append(li);
    });
    const hasNext = index < chapter.levels.length - 1;
    $('#result [data-act="next"]').textContent = hasNext ? 'Dalej' : 'Na mapę';
    $('#result').hidden = false;
    GF.sound.play('success');
    earned.forEach((e, i) => { if (e) setTimeout(() => GF.sound.play('star'), 500 + i * 280); });
  }

  $('#result').addEventListener('click', (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    $('#result').hidden = true;
    GF.sound.play('tap');
    const { chapter, index } = play;
    if (act === 'again') startLevel(chapter, index);
    else if (act === 'next' && index < chapter.levels.length - 1) startLevel(chapter, index + 1);
    else goMap();
  });

  function goMap() {
    if (play && play.controller && play.controller.destroy) play.controller.destroy();
    play = null;
    renderMap();
    show('map');
  }

  // --- Przyciski ----------------------------------------------------------------

  function renderSoundButton() {
    $('#btn-sound').textContent = GF.sound.muted ? '🔇' : '🔊';
    $('#btn-sound').setAttribute('aria-pressed', String(!GF.sound.muted));
  }
  $('#btn-sound').addEventListener('click', () => { GF.sound.toggle(); renderSoundButton(); GF.sound.play('tap'); });
  $('#btn-map').addEventListener('click', () => { GF.sound.play('tap'); goMap(); });
  $('#btn-hint').addEventListener('click', showHint);
  $('#btn-reset').addEventListener('click', () => {
    if (!play || play.locked) return;
    GF.sound.play('tap');
    mountStage(false);
  });

  renderSoundButton();
  goMap();
})();
