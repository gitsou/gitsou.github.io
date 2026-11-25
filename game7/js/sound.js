/* Efekty dźwiękowe syntezowane w Web Audio: bez plików dźwiękowych. */
(function () {
  'use strict';
  const GF = (window.GF = window.GF || {});
  const KEY = 'gf-muted';
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch { /* brak localStorage */ }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, { type = 'sine', gain = 0.12, at = 0, slide } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + at;
    const osc = a.createOscillator();
    const g = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }

  function noise(dur, { freq = 1000, q = 0.8, gain = 0.2, at = 0, type = 'bandpass' } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + at;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const filter = a.createBiquadFilter();
    filter.type = type; filter.frequency.value = freq; filter.Q.value = q;
    const g = a.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter).connect(g).connect(a.destination);
    src.start(t);
  }

  const sounds = {
    tap: () => tone(660, 0.07, { type: 'triangle', gain: 0.07 }),
    squeak: () => { tone(1500, 0.07, { gain: 0.05, slide: 2200 }); tone(1900, 0.06, { gain: 0.04, at: 0.07, slide: 1400 }); },
    cut: () => { noise(0.09, { freq: 4000, gain: 0.25 }); tone(1300, 0.05, { type: 'square', gain: 0.03, at: 0.03 }); },
    clunk: () => { tone(160, 0.12, { type: 'square', gain: 0.06 }); noise(0.05, { freq: 600, gain: 0.12 }); },
    splash: () => { noise(0.7, { freq: 900, q: 0.6, gain: 0.22 }); noise(0.4, { freq: 2500, gain: 0.08, at: 0.1 }); },
    drip: () => tone(1100, 0.16, { gain: 0.1, slide: 420 }),
    bounce: () => { tone(260, 0.1, { type: 'triangle', gain: 0.1, slide: 380 }); tone(380, 0.1, { type: 'triangle', gain: 0.08, at: 0.1, slide: 260 }); },
    fail: () => { tone(330, 0.22, { type: 'triangle', gain: 0.1, slide: 250 }); tone(250, 0.3, { type: 'triangle', gain: 0.1, at: 0.2, slide: 190 }); },
    success: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, { type: 'triangle', gain: 0.1, at: i * 0.1 })),
    star: () => tone(1320, 0.2, { gain: 0.08, slide: 1760 }),
    grow: () => tone(400, 0.4, { gain: 0.06, slide: 900 }),
  };

  GF.sound = {
    play(name) {
      if (muted || !sounds[name]) return;
      try { sounds[name](); } catch { /* dźwięk nie jest krytyczny */ }
    },
    get muted() { return muted; },
    toggle() {
      muted = !muted;
      try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch { /* brak localStorage */ }
      return muted;
    },
  };
})();
