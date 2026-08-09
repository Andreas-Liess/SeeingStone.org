/* ============================================================================
   Sound design, synthesised from code. No samples, no library, no licence.

   Same contract as the picture: everything is a pure function of a seeded PRNG
   and a cue list expressed in FRAMES, so the audio re-derives exactly and stays
   locked to the edit. Change an act boundary in the scene and change it here.

   The palette is deliberately thin — room tone, ticks, one sub thump, and a
   two-note signature. No music. Silence is a cue in its own right: the failure
   beat is the only moment in the film with nothing under it at all.

   Usage: node bin/sound.mjs --film 40-minutes --out out/40-minutes.wav
   ============================================================================ */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SR = 48000;
const FPS = 30;

function arg(name, fallback = null) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

/* Andreas' note after the first pass: the ticks and thumps work, the room tone
   and the audio logo do not. Both are now multipliers rather than constants —
   0 removes them entirely, so variants are a flag, not an edit. */
const ROOM = parseFloat(arg('roomtone', '0.25'));
const SIG = parseFloat(arg('signature', '0.3'));

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f2s = f => Math.round((f / FPS) * SR);       /* frame → sample */
const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);

/* --------------------------------------------------------------- generators */

/* Exponential decay envelope with a short attack, so nothing clicks. */
function env(i, len, attack, decay) {
  if (i < 0 || i >= len) return 0;
  const a = attack > 0 ? clamp(i / attack) : 1;
  return a * Math.exp(-i / decay);
}

function addSine(buf, startF, durF, freq, amp, decaySec, attackSec = 0.004) {
  const s0 = f2s(startF);
  const len = f2s(durF);
  const decay = decaySec * SR;
  const attack = attackSec * SR;
  for (let i = 0; i < len; i++) {
    const n = s0 + i;
    if (n >= buf.length) break;
    buf[n] += Math.sin((2 * Math.PI * freq * i) / SR) * amp * env(i, len, attack, decay);
  }
}

/* Filtered noise burst — the click/tick family. */
function addTick(buf, startF, amp, bright, rng, decaySec = 0.012) {
  const s0 = f2s(startF);
  const len = Math.round(decaySec * 4 * SR);
  const decay = decaySec * SR;
  let lp = 0;
  const k = clamp(bright, 0.02, 0.9);
  for (let i = 0; i < len; i++) {
    const n = s0 + i;
    if (n >= buf.length) break;
    const white = rng() * 2 - 1;
    lp += k * (white - lp);
    buf[n] += lp * amp * env(i, len, 0.0004 * SR, decay);
  }
}

/* Room tone: brown-ish noise, very low. Presence, not sound. */
function addRoomTone(buf, startF, endF, amp, rng) {
  const s0 = f2s(startF), s1 = Math.min(f2s(endF), buf.length);
  let lp = 0;
  const fadeS = Math.round(0.25 * SR);
  for (let n = s0; n < s1; n++) {
    const white = rng() * 2 - 1;
    lp += 0.006 * (white - lp);
    const inF = clamp((n - s0) / fadeS);
    const outF = clamp((s1 - n) / fadeS);
    buf[n] += lp * amp * Math.min(inF, outF) * 24;
  }
}

/* A sustained sub, level driven by a curve — the pressure under the search. */
function addSub(buf, startF, endF, freq, ampFn) {
  const s0 = f2s(startF), s1 = Math.min(f2s(endF), buf.length);
  const total = s1 - s0;
  for (let n = s0; n < s1; n++) {
    const p = (n - s0) / total;
    const fade = Math.min(clamp((n - s0) / (0.4 * SR)), clamp((s1 - n) / (0.3 * SR)));
    buf[n] += Math.sin((2 * Math.PI * freq * (n - s0)) / SR) * ampFn(p) * fade;
  }
}

/* ------------------------------------------------------------- the signature */
/* Two partials a fifth apart, struck together, long decay, with a sub under it.
   This is the audio mark — keep it identical across every film. */

function signature(buf, atF, amp = 0.5) {
  const a = amp * SIG;
  if (a <= 0) return;
  addSine(buf, atF, 90, 396, 0.34 * a, 0.62, 0.002);
  addSine(buf, atF, 90, 594, 0.20 * a, 0.46, 0.002);
  addSine(buf, atF, 60, 66, 0.40 * a, 0.24, 0.001);   /* body */
}

/* ------------------------------------------------------------------- films */

const FILMS = {
  /* Ad 01 "40 Minutes" — 990 frames.
     QUERY 0-135 · SEARCH 135-435 · FAIL 435-510 · MARK 510-570
     SYSTEM 570-810 · ANSWER 810-900 · END 900-990 */
  '40-minutes': (buf, rng) => {
    addRoomTone(buf, 0, 435, 0.10 * ROOM, rng);

    /* Typing, matched to the scene's 1.5-frames-per-character. */
    for (let f = 18; f < 84; f += 1.5) addTick(buf, f, 0.055, 0.5, rng, 0.008);

    /* The search: a sub that grows, and ticks that accelerate with the scroll. */
    addSub(buf, 135, 435, 47, p => 0.02 + 0.10 * Math.pow(p, 2.2));
    let f = 140;
    let gap = 9;
    while (f < 430) {
      addTick(buf, f, 0.030 + 0.02 * ((f - 140) / 290), 0.35, rng, 0.007);
      gap = Math.max(1.1, gap * 0.977);
      f += gap;
    }
    /* Six false positives, each a slightly brighter tick. */
    for (const h of [42, 96, 152, 206, 248, 284]) addTick(buf, 135 + h, 0.10, 0.72, rng, 0.02);

    /* Failure: one thump, then nothing. The only true silence in the film. */
    addSine(buf, 435, 40, 44, 0.30, 0.16, 0.001);

    /* The mark. */
    signature(buf, 512, 1.0);
    addRoomTone(buf, 545, 900, 0.07 * ROOM, rng);

    /* The system working: sparse, quiet, high. */
    const r2 = mulberry32(77123);
    for (let i = 0; i < 46; i++) {
      const at = 578 + r2() * 210;
      addTick(buf, at, 0.016 + r2() * 0.014, 0.85, rng, 0.005);
    }
    addSub(buf, 570, 810, 55, p => 0.030 * (1 - Math.pow(p, 3)));

    /* The answer: one clean tone. */
    addSine(buf, 812, 120, 528, 0.14, 1.05, 0.006);
    addSine(buf, 812, 120, 792, 0.05, 0.72, 0.006);

    /* End card: the signature again, quieter, and out. */
    signature(buf, 906, 0.42);
  },

  /* Ad 04 "The Anniversary" — 1300 frames.
     ASK 0-180 · MISSED 180-540 · PRICE 540-660 · MARK 660-720
     SYSTEM 720-960 · MESSAGE 960-1150 · END 1150-1300 */
  anniversary: (buf, rng) => {
    addRoomTone(buf, 0, 660, 0.10 * ROOM, rng);

    for (let f = 20; f < 104; f += 1.5) addTick(buf, f, 0.05, 0.5, rng, 0.008);

    /* Each missed moment lands as a single dry tick. Six of them. */
    for (let i = 0; i < 6; i++) {
      const at = 180 + 26 + i * 52;
      addTick(buf, at, 0.075 + i * 0.012, 0.55, rng, 0.018);
    }
    addSub(buf, 180, 540, 47, p => 0.022 + 0.075 * Math.pow(p, 2));

    /* The price: two thumps, one per number, then silence. */
    addSine(buf, 540, 40, 44, 0.30, 0.18, 0.001);
    addSine(buf, 566, 40, 40, 0.26, 0.18, 0.001);

    signature(buf, 662, 1.0);
    addRoomTone(buf, 700, 1150, 0.07 * ROOM, rng);

    const r2 = mulberry32(4451);
    for (let i = 0; i < 40; i++) addTick(buf, 730 + r2() * 200, 0.015 + r2() * 0.013, 0.85, rng, 0.005);
    addSub(buf, 720, 960, 55, p => 0.028 * (1 - Math.pow(p, 3)));

    /* The send is the human's action — it gets the one warm tone in the film. */
    addSine(buf, 1046, 130, 528, 0.15, 1.15, 0.006);
    addSine(buf, 1046, 130, 792, 0.055, 0.78, 0.006);

    signature(buf, 1156, 0.42);
  },

  /* Ad 05 "The Email You Cannot Send" — 1470 frames.
     ASK 0-300 · WHY 300-540 · PRICE 540-660 · MARK 660-720
     ROUTES 720-1140 · PAYOFF 1140-1320 · END 1320-1470 */
  permission: (buf, rng) => {
    addRoomTone(buf, 0, 660, 0.10 * ROOM, rng);

    /* The email being typed — 1.6 frames per character. */
    for (let f = 30; f < 206; f += 1.6) addTick(buf, f, 0.05, 0.5, rng, 0.008);

    /* Each of the client's three questions lands dry. */
    for (let i = 0; i < 3; i++) addTick(buf, 324 + i * 40, 0.085, 0.5, rng, 0.02);

    /* The price: two thumps, then nothing. */
    addSine(buf, 540, 40, 44, 0.30, 0.18, 0.001);
    addSine(buf, 568, 40, 40, 0.26, 0.18, 0.001);

    signature(buf, 662, 1.0);
    addRoomTone(buf, 700, 1320, 0.07 * ROOM, rng);

    /* Perimeter and archive drawing in. */
    addTick(buf, 726, 0.05, 0.3, rng, 0.03);
    addTick(buf, 738, 0.04, 0.3, rng, 0.03);
    /* Three routes. */
    for (let i = 0; i < 3; i++) addTick(buf, 780 + i * 40, 0.06, 0.5, rng, 0.018);
    /* The one line crossing the boundary — the only travelling sound. */
    addSub(buf, 930, 990, 62, p => 0.05 * Math.sin(Math.PI * p));
    addSine(buf, 970, 90, 528, 0.09, 0.8, 0.01);

    /* Payoff: consent requests, zero. */
    addSine(buf, 1158, 120, 396, 0.12, 1.1, 0.008);

    signature(buf, 1326, 0.42);
  },
};

/* ---------------------------------------------------------------- wav output */

function writeWav(path, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);          /* PCM */
  buf.writeUInt16LE(1, 22);          /* mono */
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(samples[i]));
  /* Fixed gain, NOT peak normalisation. Normalising would make the ticks grow
     louder whenever a quieter variant removes the signature — which would make
     the variants incomparable, the exact thing they exist to test. */
  const gain = 0.9;

  for (let i = 0; i < n; i++) {
    let v = samples[i] * gain;
    v = Math.tanh(v * 1.05);                       /* gentle ceiling */
    buf.writeInt16LE(Math.round(clamp(v, -1, 1) * 32767), 44 + i * 2);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buf);
  return { peak, gain };
}

/* --------------------------------------------------------------------- main */

const film = arg('film', '40-minutes');
const frames = parseInt(arg('frames', film === 'anniversary' ? '1300' : '990'), 10);
const out = resolve(ROOT, arg('out', `out/${film}.wav`));

if (!FILMS[film]) {
  console.error(`[sound] no cue map for film "${film}". Known: ${Object.keys(FILMS).join(', ')}`);
  process.exit(1);
}

const total = f2s(frames);
const buf = new Float64Array(total);
FILMS[film](buf, mulberry32(20260809));

const { peak, gain } = writeWav(out, buf);
console.log(`[sound] ${film} · ${(frames / FPS).toFixed(1)}s · peak ${peak.toFixed(3)} · gain ${gain.toFixed(3)} → ${out}`);
