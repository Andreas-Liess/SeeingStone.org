/* ============================================================================
   SEEINGSTONE — AD 04 "THE ANNIVERSARY"
   Built on the ad 01 skeleton to test whether that template transfers (see D9).

   Structure inherited from ad 01: price the pain in act one, escalate it,
   cut hard on a measurable binary, then answer it. Here the binary is
   2,247 days of silence → 0.

   Hard constraint from Andreas: the human sends the message. The system may
   remember and draft, never send. That is stated on screen, not implied.
   ============================================================================ */

const W = 1080;
const H = 1920;
const FPS = 30;

const ACT = {
  ASK:     [0,    180],
  MISSED:  [180,  540],
  PRICE:   [540,  660],
  MARK:    [660,  720],
  SYSTEM:  [720,  960],
  MESSAGE: [960,  1150],
  END:     [1150, 1300],
};
const TOTAL = ACT.END[1];

const C = {
  bg: '#000000', white: '#ffffff',
  g70: '#b3b3b3', g50: '#808080', g35: '#595959', g20: '#333333', g10: '#1a1a1a',
};

const MARGIN = 90;

const ROOK_D = 'M14 12 H22 V17 H26 V12 H38 V17 H42 V12 H50 V24 H46 V48 H52 V56 H12 V48 H18 V24 H14 V12 Z';
const ROOK_BOX = { x: 12, y: 12, w: 40, h: 44 };
let rookPath = null;

/* ---------------------------------------------------------------- utilities */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const seg = (f, a, b) => clamp((f - a) / (b - a));

function envelope(t, dur, inLen = 8, outLen = 8) {
  if (t < 0 || t > dur) return 0;
  return Math.min(clamp(t / inLen), clamp((dur - t) / outLen));
}

function mono(ctx, size, weight = 400, spacing = 0) {
  ctx.font = `${weight} ${size}px "JetBrains Mono", monospace`;
  ctx.letterSpacing = `${spacing}px`;
}
function sans(ctx, size, weight = 400, spacing = 0) {
  ctx.font = `${weight} ${size}px "Inter", sans-serif`;
  ctx.letterSpacing = `${spacing}px`;
}

function fmt(n) {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function rule(ctx, x1, y, x2, color = C.g20, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x1, y + 0.5); ctx.lineTo(x2, y + 0.5); ctx.stroke();
  ctx.restore();
}

function scrim(ctx, top, alpha = 1) {
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.42, `rgba(0,0,0,${0.94 * alpha})`);
  g.addColorStop(1, `rgba(0,0,0,${0.99 * alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, H - top);
}

function caption(ctx, text, alpha, baselineY, size = 50) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  sans(ctx, size, 600, -0.2);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  const lines = wrap(ctx, text, W - MARGIN * 2);
  const lh = size * 1.27;
  const startY = baselineY - (lines.length - 1) * lh;
  rule(ctx, MARGIN, startY - 44, MARGIN + 46, C.white, 0.85);
  lines.forEach((ln, i) => ctx.fillText(ln, MARGIN, startY + i * lh));
  ctx.restore();
}

function drawRook(ctx, cx, cy, height, alpha = 1) {
  if (!rookPath) rookPath = new Path2D(ROOK_D);
  const s = height / ROOK_BOX.h;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = C.white;
  ctx.translate(cx - (ROOK_BOX.x + ROOK_BOX.w / 2) * s, cy - (ROOK_BOX.y + ROOK_BOX.h / 2) * s);
  ctx.scale(s, s);
  ctx.fill(rookPath);
  ctx.restore();
}

/* ----------------------------------------------------------------- ACT: ASK */
/* The stake, stated in the first six seconds: you are about to be that person. */

function actAsk(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 180, 10, 0);
  mono(ctx, 20, 500, 8);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g35;
  ctx.fillText(S.askLabel, MARGIN, 300);
  rule(ctx, MARGIN, 330, W - MARGIN, C.g20);

  mono(ctx, 24, 400, 0);
  ctx.fillStyle = C.g70;
  ctx.fillText(S.askTo, MARGIN, 388);
  rule(ctx, MARGIN, 414, W - MARGIN, C.g10);
  ctx.globalAlpha = 1;

  /* The message types itself, then stops mid-sentence. */
  mono(ctx, 34, 400, 0);
  ctx.fillStyle = C.white;
  const chars = Math.floor(clamp((t - 20) / 1.5, 0, S.askDraft.length));
  const lines = wrap(ctx, S.askDraft, W - MARGIN * 2);
  let consumed = 0;
  let caretX = MARGIN, caretY = 500;
  lines.forEach((full, i) => {
    const y = 500 + i * 50;
    const visible = full.slice(0, clamp(chars - consumed, 0, full.length));
    ctx.fillText(visible, MARGIN, y);
    if (chars > consumed) { caretX = MARGIN + ctx.measureText(visible).width; caretY = y; }
    consumed += full.length + 1;
  });
  const typing = chars < S.askDraft.length;
  if (typing || (t % 30) < 18) {
    ctx.fillStyle = C.white;
    ctx.fillRect(caretX + 4, caretY - 26, 15, 34);
  }

  /* The two numbers that make it shameful. */
  const mA = envelope(t - 84, 96, 14, 0);
  if (mA > 0) {
    ctx.globalAlpha = mA;
    const my = 760;
    rule(ctx, MARGIN, my - 44, W - MARGIN, C.g20);

    mono(ctx, 17, 500, 4);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'left';
    ctx.fillText(S.meterLast, MARGIN, my);
    mono(ctx, 40, 700, 0);
    ctx.fillStyle = C.white;
    ctx.fillText(S.meterLastValue, MARGIN, my + 56);

    mono(ctx, 17, 500, 4);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'right';
    ctx.fillText(S.meterSince, W - MARGIN, my);
    mono(ctx, 40, 700, 0);
    ctx.fillStyle = C.white;
    ctx.fillText(S.meterSinceValue, W - MARGIN, my + 56);
    ctx.globalAlpha = 1;
  }

  caption(ctx, S.capAsk1, envelope(t - 104, 42, 10, 8), 1300);
  caption(ctx, S.capAsk2, envelope(t - 150, 30, 10, 6), 1300);
}

/* -------------------------------------------------------------- ACT: MISSED */
/* Six years of his life, each item sourced from something you already had. */

const MISS_IN = 26;
const MISS_GAP = 52;

function actMissed(ctx, t, S) {
  const n = S.missed.length;
  const shown = clamp(Math.floor((t - MISS_IN) / MISS_GAP) + 1, 0, n);

  ctx.globalAlpha = envelope(t, 360, 10, 0);
  mono(ctx, 18, 500, 5);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.missedLabel, MARGIN, 250);
  rule(ctx, MARGIN, 278, W - MARGIN, C.g20);

  /* Counters: chances kept climbing, taken never moved. */
  const moments = Math.min(14, Math.floor(shown * 2.4));
  mono(ctx, 16, 500, 4);
  ctx.fillStyle = C.g50;
  ctx.textAlign = 'left';
  ctx.fillText(S.hudMoments, MARGIN, 1420);
  ctx.textAlign = 'right';
  ctx.fillText(S.hudTaken, W - MARGIN - 70, 1420);
  mono(ctx, 34, 700, 0);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(String(moments).padStart(2, '0'), MARGIN + 330, 1422);
  ctx.textAlign = 'right';
  ctx.fillText('00', W - MARGIN, 1422);
  rule(ctx, MARGIN, 1444, W - MARGIN, C.g20);
  ctx.globalAlpha = 1;

  for (let i = 0; i < n; i++) {
    const at = MISS_IN + i * MISS_GAP;
    const age = t - at;
    if (age < 0) continue;
    const a = envelope(age, 9999, 8, 0);
    const y = 360 + i * 172;
    const last = i === n - 1;

    ctx.globalAlpha = a;
    mono(ctx, 17, 500, 3);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.g50;
    ctx.fillText(S.missed[i][0], MARGIN, y);

    /* The final item is the one that costs money — it stays white. */
    sans(ctx, 34, 600, -0.1);
    ctx.fillStyle = last ? C.white : C.g70;
    ctx.globalAlpha = a * (last ? 1 : 0.92);
    ctx.fillText(S.missed[i][1], MARGIN, y + 46);

    mono(ctx, 16, 400, 1);
    ctx.fillStyle = C.g35;
    ctx.globalAlpha = a * 0.95;
    ctx.fillText('from  ' + S.missed[i][2], MARGIN, y + 82);

    rule(ctx, MARGIN, y + 108, W - MARGIN, C.g10, a);
    ctx.globalAlpha = 1;
  }
}

/* --------------------------------------------------------------- ACT: PRICE */
/* Ad 01's move: stop everything, and put the number on the screen alone. */

function actPrice(ctx, t, S) {
  const a = envelope(t, 120, 8, 0);

  ctx.globalAlpha = a;
  mono(ctx, 190, 700, -6);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.fillText(S.priceDays, W / 2, 720);
  mono(ctx, 22, 500, 12);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.priceDaysLabel, W / 2 + 6, 780);

  const a2 = envelope(t - 26, 94, 10, 0);
  ctx.globalAlpha = a2;
  mono(ctx, 190, 700, -6);
  ctx.fillStyle = C.white;
  ctx.fillText(S.priceMessages, W / 2, 1010);
  mono(ctx, 22, 500, 12);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.priceMessagesLabel, W / 2 + 6, 1070);
  ctx.globalAlpha = 1;

  caption(ctx, S.capPrice, envelope(t - 54, 52, 10, 8), 1420, 46);

  const out = seg(t, 104, 120);
  if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
}

/* ---------------------------------------------------------------- ACT: MARK */

function actMark(ctx, t, S) {
  const cx = W / 2, cy = 880, h = 260;
  const reveal = easeOut(seg(t, 8, 34));
  if (reveal > 0) {
    ctx.save();
    ctx.beginPath();
    const top = cy + h / 2 - h * reveal;
    ctx.rect(0, top, W, H - top);
    ctx.clip();
    drawRook(ctx, cx, cy, h, 1);
    ctx.restore();
    if (reveal < 1) {
      rule(ctx, cx - 150, cy + h / 2 - h * reveal, cx + 150, C.white, 0.5 * (1 - reveal));
    }
  }
  ctx.globalAlpha = envelope(t - 28, 32, 12, 0);
  mono(ctx, 28, 500, 14);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.fillText(S.wordmark, W / 2 + 7, 1070);
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------- ACT: SYSTEM */
/* Breadth of sources, then the person assembled out of them — each fact
   carrying the file it came from. */

function actSystem(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 240, 8, 0);
  mono(ctx, 22, 500, 6);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g70;
  ctx.fillText(S.hudSystem, MARGIN + 46, 118);
  drawRook(ctx, MARGIN + 14, 108, 34, 0.9);
  rule(ctx, MARGIN, 196, W - MARGIN, C.g20);

  mono(ctx, 15, 500, 4);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.sourcesLabel, MARGIN, 254);
  ctx.globalAlpha = 1;

  /* Source counters — the 55% dark-data claim, made visible. */
  let sx = MARGIN;
  S.sources.forEach((row, i) => {
    const p = easeOut(clamp((t - (10 + i * 8)) / 70));
    ctx.globalAlpha = envelope(t - (10 + i * 8), 230, 10, 0);
    mono(ctx, 14, 500, 2);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'left';
    ctx.fillText(row[0], sx, 302);
    mono(ctx, 30, 700, 0);
    ctx.fillStyle = C.white;
    ctx.fillText(fmt(row[1] * p), sx, 344);
    sx += 232;
  });
  ctx.globalAlpha = envelope(t - 44, 196, 12, 0);
  mono(ctx, 15, 400, 1);
  ctx.fillStyle = C.g35;
  ctx.textAlign = 'left';
  ctx.fillText(S.sourceNote, MARGIN, 380);
  rule(ctx, MARGIN, 412, W - MARGIN, C.g20);
  ctx.globalAlpha = 1;

  /* The person. */
  ctx.globalAlpha = envelope(t - 70, 170, 12, 0);
  mono(ctx, 38, 700, 1);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(S.personName, MARGIN, 640);
  mono(ctx, 18, 400, 2);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.personRole, MARGIN, 676);
  ctx.globalAlpha = 1;

  /* Facts, each bound to the file it came out of. */
  let y = 762;
  S.facts.forEach((f, i) => {
    const a = envelope(t - (86 + i * 20), 154 - i * 20, 10, 0);
    ctx.globalAlpha = a;
    sans(ctx, 30, 600, -0.1);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText(f[0], MARGIN, y);
    mono(ctx, 15, 400, 1);
    ctx.fillStyle = C.g35;
    ctx.fillText('from  ' + f[1], MARGIN, y + 30);
    rule(ctx, MARGIN, y + 54, W - MARGIN, C.g10, a);
    y += 96;
    ctx.globalAlpha = 1;
  });

  scrim(ctx, 1240, 1);
  caption(ctx, S.capSystem, envelope(t - 150, 84, 12, 12), 1560);

  const out = seg(t, 228, 240);
  if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
}

/* ------------------------------------------------------------- ACT: MESSAGE */
/* The constraint, on screen: the system drafts, the human sends. */

function actMessage(ctx, t, S) {
  const sent = t >= 86;

  ctx.globalAlpha = envelope(t, 190, 10, 0);
  mono(ctx, 17, 500, 6);
  ctx.textAlign = 'left';
  ctx.fillStyle = sent ? C.g50 : C.white;
  ctx.fillText(sent ? S.msgSent : S.msgLabel, MARGIN, 560);
  rule(ctx, MARGIN, 590, W - MARGIN, C.white, 0.5);
  ctx.globalAlpha = 1;

  sans(ctx, 36, 400, -0.1);
  ctx.fillStyle = C.white;
  const lines = wrap(ctx, S.msgBody, W - MARGIN * 2);
  lines.forEach((ln, i) => {
    ctx.globalAlpha = envelope(t - (10 + i * 5), 140, 10, 0);
    ctx.fillText(ln, MARGIN, 664 + i * 50);
  });
  ctx.globalAlpha = 1;

  const yb = 664 + lines.length * 50 + 40;

  /* The line that keeps the product honest. Held long enough to be read —
     this is the constraint the whole film exists to protect. */
  ctx.globalAlpha = envelope(t - 22, 64, 10, 8) * (sent ? 0 : 1);
  sans(ctx, 30, 600, -0.1);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(S.msgHold, MARGIN, yb + 40);
  ctx.globalAlpha = 1;

  if (sent) {
    ctx.globalAlpha = envelope(t - 86, 104, 10, 0);
    mono(ctx, 20, 500, 2);
    ctx.fillStyle = C.white;
    ctx.fillText(S.msgReply, MARGIN, yb + 40);

    /* The counter that was 2,247 is now nothing. */
    const my = yb + 140;
    rule(ctx, MARGIN, my - 44, W - MARGIN, C.g20);
    mono(ctx, 17, 500, 4);
    ctx.fillStyle = C.g50;
    ctx.fillText(S.meterAfter, MARGIN, my);
    mono(ctx, 80, 700, -2);
    ctx.fillStyle = C.white;
    ctx.fillText(S.meterAfterValue, MARGIN, my + 84);
    ctx.globalAlpha = 1;
  }

  caption(ctx, S.capMessage, envelope(t - 116, 66, 10, 10), 1560);
}

/* ----------------------------------------------------------------- ACT: END */

function actEnd(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 84, 12, 12);
  sans(ctx, 46, 600, -0.2);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  const cl = wrap(ctx, S.closing, 880);
  cl.forEach((ln, i) => ctx.fillText(ln, W / 2, 860 + i * 60));
  ctx.globalAlpha = 1;

  const aE = envelope(t - 86, 64, 14, 0);
  if (aE > 0) {
    ctx.globalAlpha = aE;
    drawRook(ctx, W / 2, 760, 150, 1);
    sans(ctx, 48, 600, -0.2);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.white;
    const tl = wrap(ctx, S.tagline, 900);
    tl.forEach((ln, i) => ctx.fillText(ln, W / 2, 1000 + i * 62));
    const yb = 1000 + tl.length * 62;
    rule(ctx, W / 2 - 60, yb + 34, W / 2 + 60, C.g35);
    mono(ctx, 28, 500, 6);
    ctx.fillStyle = C.g70;
    ctx.fillText(S.url, W / 2 + 3, yb + 110);
    ctx.globalAlpha = 1;
  }
}

/* -------------------------------------------------------------------- driver */

function draw(ctx, frame, S) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const f = clamp(frame, 0, TOTAL - 1);
  if (f < ACT.ASK[1])          actAsk(ctx, f - ACT.ASK[0], S);
  else if (f < ACT.MISSED[1])  actMissed(ctx, f - ACT.MISSED[0], S);
  else if (f < ACT.PRICE[1])   actPrice(ctx, f - ACT.PRICE[0], S);
  else if (f < ACT.MARK[1])    actMark(ctx, f - ACT.MARK[0], S);
  else if (f < ACT.SYSTEM[1])  actSystem(ctx, f - ACT.SYSTEM[0], S);
  else if (f < ACT.MESSAGE[1]) actMessage(ctx, f - ACT.MESSAGE[0], S);
  else                         actEnd(ctx, f - ACT.END[0], S);

  ctx.restore();
}

window.SS = { draw, W, H, FPS, TOTAL, ACT };
