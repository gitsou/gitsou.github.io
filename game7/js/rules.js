/*
 * Reguły gry: czyste funkcje bez DOM i animacji.
 * W przeglądarce dostępne jako GF.rules, w Node przez require().
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.GF = root.GF || {}; root.GF.rules = api; }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Ułamki -------------------------------------------------------------

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }
  function frac(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function parse(x) {
    if (x && typeof x === 'object') return frac(x.n, x.d);
    if (typeof x === 'number') return frac(x, 1);
    const [n, d] = String(x).split('/').map(Number);
    return frac(n, d === undefined ? 1 : d);
  }
  const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
  const sub = (a, b) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
  const cmp = (a, b) => a.n * b.d - b.n * a.d;
  const eq = (a, b) => cmp(a, b) === 0;
  const sum = (list) => list.reduce(add, frac(0));
  const str = (f) => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
  const val = (f) => f.n / f.d;
  const outcome = (c) => (c === 0 ? 'ok' : c < 0 ? 'short' : 'over');

  // --- Szyby (model pola) -------------------------------------------------

  function isDiagonal(stage, cleaned) {
    if (cleaned.length < 2) return false;
    const rows = new Set(cleaned.map((i) => Math.floor(i / stage.cols)));
    const cols = new Set(cleaned.map((i) => i % stage.cols));
    return rows.size === cleaned.length && cols.size === cleaned.length;
  }

  function checkWindow(stage, cleaned) {
    const got = frac(cleaned.length, stage.rows * stage.cols);
    const target = parse(stage.target);
    const c = cmp(got, target);
    return {
      ok: c === 0,
      result: outcome(c),
      got,
      target,
      signature: [...cleaned].sort((a, b) => a - b).join(','),
      diagonal: isDiagonal(stage, cleaned),
    };
  }

  // --- Rura (model długości) ----------------------------------------------

  const pipeTotal = (stage, placed) => sum(placed.map((i) => parse(stage.pieces[i])));

  function pipeFits(stage, placed, index) {
    return cmp(add(pipeTotal(stage, placed), parse(stage.pieces[index])), parse(stage.gap)) <= 0;
  }

  function checkPipe(stage, placed) {
    const total = pipeTotal(stage, placed);
    const gap = parse(stage.gap);
    const c = cmp(total, gap);
    return {
      ok: c === 0,
      result: outcome(c),
      total,
      gap,
      missing: c < 0 ? sub(gap, total) : frac(0),
      pieces: placed.length,
      signature: placed.map((i) => str(parse(stage.pieces[i]))).sort().join('+'),
    };
  }

  // --- Woda (model miary) -------------------------------------------------
  // Zbiornik ma `parts` równych części. Cięcia to pozycje 1..parts-1.
  // Przypisanie to obiekt { idPorcji: idCelu }. Grządka dostaje jedną porcję,
  // beczka może dostać kilka.

  function cutPositions(parts, cuts) {
    return [...new Set(cuts)]
      .filter((c) => Number.isInteger(c) && c > 0 && c < parts)
      .sort((a, b) => a - b);
  }

  function portions(parts, cuts) {
    const pos = [0, ...cutPositions(parts, cuts), parts];
    const out = [];
    for (let i = 0; i < pos.length - 1; i++) {
      out.push({
        id: `${pos[i]}-${pos[i + 1]}`,
        start: pos[i],
        end: pos[i + 1],
        value: frac(pos[i + 1] - pos[i], parts),
      });
    }
    return out;
  }

  function liveAssign(stage, cuts, assign) {
    const ids = new Set(portions(stage.parts, cuts).map((p) => p.id));
    const out = {};
    for (const [pid, tid] of Object.entries(assign)) if (ids.has(pid)) out[pid] = tid;
    return out;
  }

  function waterReadiness(stage, cuts, assign) {
    const live = liveAssign(stage, cuts, assign);
    const used = new Set(Object.values(live));
    const beds = stage.targets.filter((t) => t.kind !== 'barrel');
    if (beds.some((b) => !used.has(b.id))) return { ok: false, reason: 'bedEmpty' };
    const hasBarrel = stage.targets.some((t) => t.kind === 'barrel');
    const ps = portions(stage.parts, cuts);
    if (hasBarrel && ps.some((p) => !live[p.id])) return { ok: false, reason: 'leftover' };
    return { ok: true };
  }

  function evaluateWater(stage, cuts, assign) {
    const ps = portions(stage.parts, cuts);
    const live = liveAssign(stage, cuts, assign);
    const results = stage.targets.map((t) => {
      const got = sum(ps.filter((p) => live[p.id] === t.id).map((p) => p.value));
      if (t.kind === 'barrel') return { id: t.id, kind: 'barrel', got };
      const need = parse(t.need);
      const c = cmp(got, need);
      return {
        id: t.id, kind: 'bed', got, need, result: outcome(c),
        diff: c < 0 ? sub(need, got) : sub(got, need),
      };
    });
    const leftover = sum(ps.filter((p) => !live[p.id]).map((p) => p.value));
    const barrel = sum(results.filter((r) => r.kind === 'barrel').map((r) => r.got));
    const ok = results.every((r) => r.kind === 'barrel' || r.result === 'ok') && leftover.n === 0;
    return {
      ok, results, leftover, barrel,
      signature: cutPositions(stage.parts, cuts).join(','),
    };
  }

  // --- Gwiazdki -------------------------------------------------------------

  const COUNTERS = ['fails', 'hintsUsed', 'cutsTotal', 'gestureCuts', 'reassigns', 'answerFails'];

  const STAR_CHECKS = {
    noFail: (s) => s.fails === 0,
    noHint: (s) => s.hintsUsed === 0,
    minCuts: (s, n) => s.cutsTotal <= n,
    gesture: (s) => s.gestureCuts > 0,
    secondWay: (s, _, prev) => {
      const sol = (prev && prev.solutions) || [];
      return sol.length > 0 && !sol.includes(s.signature);
    },
    diagonal: (s) => s.diagonal === true,
    noReassign: (s) => s.reassigns === 0,
    firstAnswer: (s) => s.answerFails === 0,
    firstCut: (s, n) => s.firstCut === n,
    pieces: (s, n) => s.pieces === n,
  };

  function newStats() {
    const s = {};
    for (const k of COUNTERS) s[k] = 0;
    return s;
  }

  // Liczniki się sumują; pozostałe pola bierzemy z pierwszego etapu, który je ustawił.
  function mergeStats(list) {
    const m = newStats();
    for (const s of list) {
      for (const [k, v] of Object.entries(s)) {
        if (COUNTERS.includes(k)) m[k] += v;
        else if (m[k] === undefined && v !== undefined && v !== null) m[k] = v;
      }
    }
    return m;
  }

  function evaluateStars(defs, stats, prev) {
    return defs.map((d) => {
      const check = STAR_CHECKS[d.check];
      if (!check) throw new Error(`Nieznany warunek gwiazdki: ${d.check}`);
      return Boolean(check(stats, d.arg, prev || {}));
    });
  }

  return {
    frac, parse, add, sub, cmp, eq, sum, str, val,
    checkWindow, isDiagonal,
    pipeFits, checkPipe, pipeTotal,
    cutPositions, portions, waterReadiness, evaluateWater,
    STAR_CHECKS, COUNTERS, newStats, mergeStats, evaluateStars,
  };
});
