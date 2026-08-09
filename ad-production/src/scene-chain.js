/* ============================================================================
   SEEINGSTONE — AD 03 "THE CHAIN"
   Link analysis on a commercial detail: six fragments, six sources, fourteen
   months. The system walks backwards from the newest and jumps to a rejection
   from fourteen months earlier.

   Honesty constraint, load-bearing: every fragment arrived in the user's own
   archive. Nothing here observes the counterparty. The chain is inference over
   material you already hold, which is the only claim the product can make.
   ============================================================================ */

const W = 1080;
const H = 1920;
const FPS = 30;

const ACT = {
  OPEN:       [0,    150],
  FRAGMENTS:  [150,  870],
  CONCLUSION: [870,  1140],
  ACTION:     [1140, 1320],
  CLOSE:      [1320, 1440],
};
const TOTAL = ACT.CLOSE[1];

const C = {
  bg: '#000000', white: '#ffffff',
  g70: '#b3b3b3', g50: '#808080', g35: '#595959', g20: '#333333', g10: '#1a1a1a',
};

const MARGIN = 90;
const AXIS_X = 150;         /* the time axis */
const CARD_X = 214;         /* fragment cards start here */
const AXIS_TOP = 380;
const AXIS_BOTTOM = 1420;
const BREAK_Y = 530;        /* the fourteen-month gap in the scale */

const FRAG_IN = 24;         /* first fragment appears */
const FRAG_GAP = 116;       /* frames between fragments */

const ROOK_D = 'M14 12 H22 V17 H26 V12 H38 V17 H42 V12 H50 V24 H46 V48 H52 V56 H12 V48 H18 V24 H14 V12 Z';
const ROOK_BOX = { x: 12, y: 12, w: 40, h: 44 };
let rookPath = null;

/* ---------------------------------------------------------------- utilities */

const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - t, 3);
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

function vrule(ctx, x, y1, y2, color = C.g20, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 0.5, y1); ctx.lineTo(x + 0.5, y2); ctx.stroke();
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

function caption(ctx, text, alpha, baselineY, size = 48) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  sans(ctx, size, 600, -0.2);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  const lines = wrap(ctx, text, W - MARGIN * 2);
  const lh = size * 1.27;
  const startY = baselineY - (lines.length - 1) * lh;
  rule(ctx, MARGIN, startY - 42, MARGIN + 46, C.white, 0.85);
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

/* Partial quadratic curve, sampled — lets the hop draw itself hop by hop. */
function partialQuad(ctx, x0, y0, cx, cy, x1, y1, p, alpha, width) {
  if (p <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = C.white;
  ctx.lineWidth = width;
  ctx.beginPath();
  const steps = 48;
  for (let i = 0; i <= steps * p; i++) {
    const u = i / steps;
    const mu = 1 - u;
    const x = mu * mu * x0 + 2 * mu * u * cx + u * u * x1;
    const y = mu * mu * y0 + 2 * mu * u * cy + u * u * y1;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/* The axis: time, oldest at the top, with a visible break for the long gap. */
function drawAxis(ctx, S, alpha, revealP) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;

  const end = lerp(AXIS_TOP, AXIS_BOTTOM, revealP);
  vrule(ctx, AXIS_X, AXIS_TOP, Math.min(end, BREAK_Y - 14), C.g20, 1);
  if (end > BREAK_Y + 14) vrule(ctx, AXIS_X, BREAK_Y + 14, end, C.g20, 1);

  /* Break glyph: the fourteen months that are not to scale. */
  if (revealP > 0.2) {
    ctx.strokeStyle = C.g35;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(AXIS_X - 10, BREAK_Y - 6); ctx.lineTo(AXIS_X + 10, BREAK_Y - 14);
    ctx.moveTo(AXIS_X - 10, BREAK_Y + 12); ctx.lineTo(AXIS_X + 10, BREAK_Y + 4);
    ctx.stroke();
  }

  mono(ctx, 14, 500, 3);
  ctx.fillStyle = C.g35;
  ctx.textAlign = 'left';
  ctx.fillText(S.axisTop, AXIS_X + 18, AXIS_TOP - 18);
  ctx.fillText(S.axisBottom, AXIS_X + 18, AXIS_BOTTOM + 30);
  ctx.restore();
}

/* ---------------------------------------------------------------- ACT: OPEN */

function actOpen(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 150, 12, 14);
  mono(ctx, 64, 700, -1);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  ctx.fillText(S.titleTop, MARGIN, 760);

  mono(ctx, 21, 400, 1);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.titleSub, MARGIN, 806);
  ctx.globalAlpha = 1;

  caption(ctx, S.capOpen, envelope(t - 54, 92, 10, 12), 1180);
}

/* ----------------------------------------------------------- ACT: FRAGMENTS */

function fragmentCard(ctx, F, y, a, live) {
  const dim = live ? 1 : 0.4;

  ctx.globalAlpha = a * dim;
  mono(ctx, 15, 700, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = live ? C.white : C.g50;
  ctx.fillText(F.id, CARD_X, y - 44);

  mono(ctx, 15, 500, 3);
  ctx.fillStyle = C.g50;
  ctx.fillText(F.date, CARD_X + 50, y - 44);

  mono(ctx, 15, 400, 1);
  ctx.fillStyle = C.g35;
  ctx.textAlign = 'right';
  ctx.fillText(F.source, W - MARGIN, y - 44);

  ctx.textAlign = 'left';
  mono(ctx, 22, 500, 0);
  ctx.fillStyle = live ? C.white : C.g50;
  ctx.fillText(F.quote, CARD_X, y - 6);

  mono(ctx, 16, 400, 1);
  ctx.fillStyle = C.g50;
  ctx.globalAlpha = a * dim * 0.95;
  ctx.fillText(F.means, CARD_X, y + 26);

  rule(ctx, CARD_X, y + 48, W - MARGIN, C.g10, a * dim);
  ctx.globalAlpha = 1;
}

function actFragments(ctx, t, S) {
  const F = S.fragments;
  const n = F.length;

  drawAxis(ctx, S, envelope(t, 720, 10, 0), easeOut(clamp(t / 60)));

  /* HUD */
  ctx.globalAlpha = envelope(t, 720, 10, 0);
  mono(ctx, 16, 500, 4);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.hudLabel, MARGIN, 250);
  const found = clamp(Math.floor((t - FRAG_IN) / FRAG_GAP) + 1, 0, n);
  mono(ctx, 32, 700, 0);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'right';
  ctx.fillText(`${String(found).padStart(2, '0')} / ${n}`, W - MARGIN, 256);
  rule(ctx, MARGIN, 282, W - MARGIN, C.g20);
  ctx.globalAlpha = 1;

  /* Hops, drawn between consecutive fragments in inference order. */
  for (let i = 1; i < n; i++) {
    const at = FRAG_IN + i * FRAG_GAP;
    const p = easeOut(seg(t, at - 26, at + 16));
    if (p <= 0) continue;
    const y0 = F[i - 1].y, y1 = F[i].y;
    const span = Math.abs(y1 - y0);
    const bulge = 40 + span * 0.22;
    partialQuad(ctx, AXIS_X, y0, AXIS_X - bulge, (y0 + y1) / 2, AXIS_X, y1, p,
      t - at < 40 ? 0.95 : 0.5, t - at < 40 ? 2 : 1);
  }

  /* Fragments themselves. */
  for (let i = 0; i < n; i++) {
    const at = FRAG_IN + i * FRAG_GAP;
    const age = t - at;
    if (age < 0) continue;
    const a = envelope(age, 9999, 10, 0);
    const live = age < FRAG_GAP;

    /* node on the axis */
    ctx.save();
    ctx.globalAlpha = a;
    const s = live ? 13 : 9;
    ctx.fillStyle = live ? C.white : C.g50;
    ctx.fillRect(AXIS_X - s / 2, F[i].y - s / 2, s, s);
    ctx.restore();

    fragmentCard(ctx, F[i], F[i].y, a, live);
  }

  scrim(ctx, 1520, 1);
  caption(ctx, S.capFrag2, envelope(t - 150, 76, 10, 10), 1760, 44);
  caption(ctx, S.capFrag5, envelope(t - 494, 82, 10, 10), 1760, 44);
}

/* ---------------------------------------------------------- ACT: CONCLUSION */

function actConclusion(ctx, t, S) {
  /* The chain persists, dimmed, while the reading of it arrives. */
  const fade = 1 - easeOut(seg(t, 0, 40)) * 0.86;
  const F = S.fragments;

  drawAxis(ctx, S, fade * 0.6, 1);
  for (let i = 1; i < F.length; i++) {
    const y0 = F[i - 1].y, y1 = F[i].y;
    const bulge = 40 + Math.abs(y1 - y0) * 0.22;
    partialQuad(ctx, AXIS_X, y0, AXIS_X - bulge, (y0 + y1) / 2, AXIS_X, y1, 1, fade * 0.5, 1);
  }
  for (let i = 0; i < F.length; i++) {
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = C.g50;
    ctx.fillRect(AXIS_X - 4.5, F[i].y - 4.5, 9, 9);
    ctx.restore();
  }

  /* Backing so the conclusion sits on solid black. */
  ctx.fillStyle = `rgba(0,0,0,${easeOut(seg(t, 10, 46)) * 0.97})`;
  ctx.fillRect(0, 480, W, 900);

  ctx.globalAlpha = envelope(t - 34, 236, 12, 0);
  mono(ctx, 17, 500, 6);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.conclusionLabel, MARGIN, 600);
  rule(ctx, MARGIN, 626, W - MARGIN, C.white, 0.5);
  ctx.globalAlpha = 1;

  sans(ctx, 40, 600, -0.2);
  let y = 700;
  S.conclusion.forEach((line, i) => {
    ctx.globalAlpha = envelope(t - (52 + i * 26), 218 - i * 26, 12, 0);
    ctx.fillStyle = C.white;
    const lines = wrap(ctx, line, W - MARGIN * 2);
    lines.forEach(ln => { ctx.fillText(ln, MARGIN, y); y += 52; });
    y += 26;
  });
  ctx.globalAlpha = 1;

  caption(ctx, S.capConclusion, envelope(t - 150, 110, 12, 12), 1500, 44);
}

/* -------------------------------------------------------------- ACT: ACTION */

function actAction(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 180, 12, 0);
  mono(ctx, 17, 500, 6);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  ctx.fillText(S.actionLabel, MARGIN, 700);
  rule(ctx, MARGIN, 726, W - MARGIN, C.white, 0.5);
  ctx.globalAlpha = 1;

  mono(ctx, 26, 500, 0);
  let y = 800;
  S.action.forEach((line, i) => {
    ctx.globalAlpha = envelope(t - (16 + i * 20), 164 - i * 20, 10, 0);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText('→  ' + line, MARGIN, y);
    y += 56;
  });
  ctx.globalAlpha = 1;
}

/* --------------------------------------------------------------- ACT: CLOSE */

function actClose(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 62, 12, 10);
  sans(ctx, 50, 600, -0.2);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.fillText(S.closing, W / 2, 900);
  ctx.globalAlpha = 1;

  const aE = envelope(t - 64, 56, 14, 0);
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
  if (f < ACT.OPEN[1])            actOpen(ctx, f - ACT.OPEN[0], S);
  else if (f < ACT.FRAGMENTS[1])  actFragments(ctx, f - ACT.FRAGMENTS[0], S);
  else if (f < ACT.CONCLUSION[1]) actConclusion(ctx, f - ACT.CONCLUSION[0], S);
  else if (f < ACT.ACTION[1])     actAction(ctx, f - ACT.ACTION[0], S);
  else                            actClose(ctx, f - ACT.CLOSE[0], S);

  ctx.restore();
}

window.SS = { draw, W, H, FPS, TOTAL, ACT };
