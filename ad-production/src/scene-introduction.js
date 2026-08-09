/* ============================================================================
   SEEINGSTONE — AD 02 "THE INTRODUCTION"
   The M&A story from the pitch: five weeks chasing Tim, while the introduction
   sat in an attachment from 2019.

   Register borrowed from forensic news explainers: timestamps as the spine,
   flat numerals, no persuasion, and an argument built out of absence — show
   what is recorded beside what is not, and let the viewer close the gap.
   Opens and closes on the same timestamp.

   Same contract as ad 01: draw(ctx, frame, strings) is pure. No rAF, no clock,
   no Math.random().
   ============================================================================ */

const W = 1080;
const H = 1920;
const FPS = 30;

const ACT = {
  OPEN:     [0,    150],
  ATTEMPTS: [150,  500],
  KNOWN:    [500,  720],
  EXCAVATE: [720,  1000],
  RELATION: [1000, 1220],
  CLOSE:    [1220, 1440],
};
const TOTAL = ACT.CLOSE[1];

const C = {
  bg: '#000000', white: '#ffffff',
  g70: '#b3b3b3', g50: '#808080', g35: '#595959', g20: '#333333', g10: '#1a1a1a',
};

const MARGIN = 90;

const ROOK_D = 'M14 12 H22 V17 H26 V12 H38 V17 H42 V12 H50 V24 H46 V48 H52 V56 H12 V48 H18 V24 H14 V12 Z';
const ROOK_BOX = { x: 12, y: 12, w: 40, h: 44 };
let rookPath = null;

/* ---------------------------------------------------------------- utilities */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
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
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y + 0.5); ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

function vrule(ctx, x, y1, y2, color = C.g20, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 0.5, y1); ctx.lineTo(x + 0.5, y2);
  ctx.stroke();
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

/* Node marker: a hollow square, filled when the node is the live one. */
function node(ctx, x, y, size, filled, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (filled) {
    ctx.fillStyle = C.white;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  } else {
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
  }
  ctx.restore();
}

/* ---------------------------------------------------------------- ACT: OPEN */
/* A timestamp, alone, held long enough to become a fact. */

function actOpen(ctx, t, S) {
  const a = envelope(t, 150, 10, 0);

  mono(ctx, 170, 700, -4);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.globalAlpha = a * envelope(t, 150, 12, 0);
  ctx.fillText(S.openTime, W / 2, 860);

  ctx.globalAlpha = a * envelope(t - 14, 136, 12, 0);
  mono(ctx, 26, 500, 16);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.openDay, W / 2 + 8, 930);
  ctx.globalAlpha = 1;

  caption(ctx, S.capOpen1, envelope(t - 40, 46, 8, 8), 1180);
  caption(ctx, S.capOpen2, envelope(t - 96, 54, 8, 8), 1180);
}

/* ------------------------------------------------------------ ACT: ATTEMPTS */
/* The log builds. Nothing comes back. The reply counter never moves. */

const ROW_Y0 = 430;
const ROW_H = 96;
const ROW_IN = 20;      /* first row appears */
const ROW_GAP = 34;     /* frames between rows */

function actAttempts(ctx, t, S) {
  const n = S.attempts.length;
  const shown = clamp(Math.floor((t - ROW_IN) / ROW_GAP) + 1, 0, n);

  /* HUD */
  ctx.globalAlpha = envelope(t, 350, 10, 0);
  mono(ctx, 18, 500, 4);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.hudAttempts, MARGIN, 250);
  ctx.textAlign = 'right';
  ctx.fillText(S.hudReplies, W - MARGIN - 90, 250);

  mono(ctx, 40, 700, 0);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(String(shown).padStart(2, '0'), MARGIN + 130, 252);
  ctx.textAlign = 'right';
  ctx.fillText('00', W - MARGIN, 252);
  rule(ctx, MARGIN, 284, W - MARGIN, C.g20);
  ctx.globalAlpha = 1;

  /* Timeline spine, drawn only as far as the log has reached. */
  const spineX = MARGIN + 6;
  if (shown > 0) {
    const lastY = ROW_Y0 + (shown - 1) * ROW_H;
    vrule(ctx, spineX, ROW_Y0 - 26, lastY - 26, C.g20, 0.9);
  }

  for (let i = 0; i < n; i++) {
    const appear = ROW_IN + i * ROW_GAP;
    const age = t - appear;
    if (age < 0) continue;
    const [time, day, channel, status] = S.attempts[i];
    const y = ROW_Y0 + i * ROW_H;

    /* Rows dim as they age — the newest attempt is the only bright one,
       until the last one lands and they all go grey together. */
    const fresh = clamp(1 - age / 26);
    const a = envelope(age, 9999, 6, 0);
    const dim = lerp(0.42, 1, fresh);

    ctx.globalAlpha = a;
    node(ctx, spineX, y - 26, age < 26 ? 11 : 7, age < 26, a);

    mono(ctx, 38, 700, 0);
    ctx.fillStyle = C.white;
    ctx.globalAlpha = a * dim;
    ctx.textAlign = 'left';
    ctx.fillText(time, MARGIN + 42, y - 12);

    mono(ctx, 17, 400, 2);
    ctx.fillStyle = C.g50;
    ctx.globalAlpha = a * dim * 0.9;
    ctx.fillText(day, MARGIN + 42, y + 18);

    mono(ctx, 18, 500, 3);
    ctx.fillStyle = C.g70;
    ctx.globalAlpha = a * dim * 0.9;
    ctx.textAlign = 'left';
    ctx.fillText(channel, MARGIN + 250, y - 12);

    /* SENT, then the truth. */
    mono(ctx, 18, 500, 2);
    ctx.textAlign = 'right';
    if (age < 20) {
      ctx.fillStyle = C.white;
      ctx.globalAlpha = a * envelope(age, 20, 4, 6);
      ctx.fillText(S.statusSent, W - MARGIN, y - 12);
    } else {
      ctx.fillStyle = C.g50;
      ctx.globalAlpha = a * dim * envelope(age - 20, 9999, 6, 0);
      ctx.fillText(status, W - MARGIN, y - 12);
    }

    rule(ctx, MARGIN + 42, y + 40, W - MARGIN, C.g10, a * 0.8);
  }
  ctx.globalAlpha = 1;

  scrim(ctx, 1240, 1);
  caption(ctx, S.capAtt1, envelope(t - 60, 76, 8, 8), 1560);
  caption(ctx, S.capAtt2, envelope(t - 152, 70, 8, 8), 1560);
  caption(ctx, S.capAtt3, envelope(t - 236, 96, 8, 10), 1560);
}

/* --------------------------------------------------------------- ACT: KNOWN */
/* The whole argument is the asymmetry between these two columns. */

function actKnown(ctx, t, S) {
  const colY = 480;

  ctx.globalAlpha = envelope(t, 220, 10, 10);
  mono(ctx, 18, 500, 5);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.headerRecorded, MARGIN, colY - 40);
  rule(ctx, MARGIN, colY - 20, MARGIN + 400, C.g20);
  ctx.globalAlpha = 1;

  /* Left column fills up, line after line. */
  mono(ctx, 21, 400, 0);
  S.recorded.forEach((line, i) => {
    ctx.globalAlpha = envelope(t - (18 + i * 11), 220, 8, 10);
    ctx.fillStyle = C.g70;
    ctx.textAlign = 'left';
    ctx.fillText(line, MARGIN, colY + 24 + i * 44);
  });
  ctx.globalAlpha = 1;

  /* Right column holds one line, and arrives late. */
  const rx = 600;
  ctx.globalAlpha = envelope(t - 104, 116, 12, 10);
  mono(ctx, 18, 500, 5);
  ctx.fillStyle = C.g50;
  ctx.textAlign = 'left';
  ctx.fillText(S.headerNotRecorded, rx, colY - 40);
  rule(ctx, rx, colY - 20, W - MARGIN, C.g20);
  ctx.globalAlpha = 1;

  ctx.globalAlpha = envelope(t - 126, 94, 14, 10);
  sans(ctx, 30, 600, -0.1);
  ctx.fillStyle = C.white;
  const nrLines = wrap(ctx, S.notRecorded, W - MARGIN - rx);
  nrLines.forEach((ln, i) => ctx.fillText(ln, rx, colY + 28 + i * 40));
  ctx.globalAlpha = 1;

  caption(ctx, S.capKnown, envelope(t - 24, 180, 10, 12), 1400);
}

/* ------------------------------------------------------------ ACT: EXCAVATE */
/* A file, a page, one line. Nothing was hidden — it was simply never reopened. */

function pageBars(ctx, x, y, w, seed, count, hotIndex, hotAmount) {
  const r = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const bw = w * (0.42 + r() * 0.58);
    const by = y + i * 26;
    const hot = i === hotIndex;
    ctx.fillStyle = hot ? C.white : C.g20;
    ctx.globalAlpha = hot ? lerp(0.25, 1, hotAmount) : 0.85;
    ctx.fillRect(x, by, bw, 9);
  }
  ctx.globalAlpha = 1;
}

function actExcavate(ctx, t, S) {
  /* File header */
  ctx.globalAlpha = envelope(t, 280, 10, 0);
  mono(ctx, 30, 700, 0);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  ctx.fillText(S.fileName, MARGIN, 400);

  ctx.globalAlpha = envelope(t - 12, 268, 10, 0);
  mono(ctx, 19, 400, 1);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.fileMeta, MARGIN, 436);
  rule(ctx, MARGIN, 466, W - MARGIN, C.g20, envelope(t - 16, 264, 10, 0));
  ctx.globalAlpha = 1;

  /* The page, abstracted to bars. Line 4 is the one that matters. */
  const px = MARGIN, py = 520, pw = W - MARGIN * 2, ph = 440;
  const pa = envelope(t - 26, 254, 12, 0);
  ctx.globalAlpha = pa;
  ctx.strokeStyle = C.g20;
  ctx.lineWidth = 1;
  ctx.strokeRect(px + 0.5, py + 0.5, pw, ph);

  const hot = easeOut(seg(t, 96, 128));
  pageBars(ctx, px + 34, py + 44, pw - 68, 90211, 13, 3, hot);

  mono(ctx, 15, 500, 3);
  ctx.fillStyle = C.g50;
  ctx.textAlign = 'left';
  ctx.globalAlpha = pa * envelope(t - 96, 184, 12, 0);
  ctx.fillText(S.pageLabel, px + 34, py + ph - 24);
  ctx.globalAlpha = 1;

  /* The one line, traced out of the page and down to where it is read. */
  const lineY = py + 44 + 3 * 26 + 4;
  const conn = easeOut(seg(t, 122, 152));
  if (conn > 0) {
    vrule(ctx, px + 34, lineY + 10, lineY + 10 + (py + ph + 60 - lineY) * conn, C.white, 0.45);
  }

  /* The line itself. */
  ctx.globalAlpha = envelope(t - 140, 140, 12, 0);
  mono(ctx, 24, 500, 0);
  ctx.fillStyle = C.white;
  ctx.fillText(S.lineText, MARGIN, py + ph + 90);
  ctx.globalAlpha = 1;

  /* And the entity it resolves to. */
  ctx.globalAlpha = envelope(t - 178, 102, 12, 0);
  mono(ctx, 15, 500, 4);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.resolveLabel, MARGIN, py + ph + 146);
  mono(ctx, 24, 500, 0);
  ctx.fillStyle = C.white;
  ctx.fillText(S.resolveText, MARGIN, py + ph + 184);
  ctx.globalAlpha = 1;

  scrim(ctx, 1330, 1);
  caption(ctx, S.capExc1, envelope(t - 30, 70, 8, 8), 1580, 46);
  caption(ctx, S.capExc2, envelope(t - 118, 78, 8, 8), 1580, 46);
  caption(ctx, S.capExc3, envelope(t - 204, 76, 8, 10), 1580, 46);
}

/* ------------------------------------------------------------ ACT: RELATION */
/* Two nodes that never connected, and the one that was always between them. */

function actRelation(ctx, t, S) {
  const cx = 300;
  const yYou = 480, yMax = 800, yTim = 1120;

  /* YOU and TIM exist from the start; the gap between them is the point. */
  const aEnds = envelope(t, 220, 10, 0);
  node(ctx, cx, yYou, 16, true, aEnds);
  node(ctx, cx, yTim, 16, false, aEnds);

  ctx.globalAlpha = aEnds;
  mono(ctx, 24, 700, 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  ctx.fillText(S.nodeYou, cx + 44, yYou + 8);
  ctx.fillText(S.nodeTim, cx + 44, yTim + 2);
  mono(ctx, 16, 400, 2);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.nodeTimSub, cx + 44, yTim + 30);
  ctx.globalAlpha = 1;

  /* MAX arrives between them. */
  const aMax = envelope(t - 34, 186, 10, 0);
  if (aMax > 0) {
    node(ctx, cx, yMax, 16, true, aMax);
    ctx.globalAlpha = aMax;
    mono(ctx, 24, 700, 2);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText(S.nodeMax, cx + 44, yMax + 2);
    mono(ctx, 16, 400, 2);
    ctx.fillStyle = C.g50;
    ctx.fillText(S.nodeMaxSub, cx + 44, yMax + 30);
    ctx.globalAlpha = 1;
  }

  /* The edge that was in the archive all along. */
  const eFound = easeOut(seg(t, 62, 96));
  if (eFound > 0) {
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, yMax + 8);
    ctx.lineTo(cx + 0.5, yMax + 8 + (yTim - yMax - 16) * eFound);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = envelope(t - 84, 136, 10, 0);
    mono(ctx, 17, 500, 2);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText(S.edgeFounded, cx + 26, (yMax + yTim) / 2 + 6);
    /* Where the edge came from — the claim is only as good as its source. */
    mono(ctx, 15, 400, 1);
    ctx.fillStyle = C.g50;
    ctx.fillText(S.edgeSource, cx + 26, (yMax + yTim) / 2 + 32);
    ctx.globalAlpha = 1;
  }

  /* The edge you already had, and let go cold. */
  const eStale = easeOut(seg(t, 108, 140));
  if (eStale > 0) {
    ctx.save();
    ctx.strokeStyle = C.g35;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(cx + 0.5, yYou + 8);
    ctx.lineTo(cx + 0.5, yYou + 8 + (yMax - yYou - 16) * eStale);
    ctx.stroke();
    ctx.restore();

    ctx.globalAlpha = envelope(t - 128, 92, 10, 0);
    mono(ctx, 17, 400, 2);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'left';
    ctx.fillText(S.edgeStale, cx + 26, (yYou + yMax) / 2 + 6);
    ctx.globalAlpha = 1;
  }

  scrim(ctx, 1330, 1);
  caption(ctx, S.capRel, envelope(t - 150, 70, 10, 10), 1560);
}

/* --------------------------------------------------------------- ACT: CLOSE */
/* The conclusion, then back to the timestamp it opened on. */

function actClose(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 96, 12, 12);
  sans(ctx, 54, 600, -0.3);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  const lines = wrap(ctx, S.capClose, W - MARGIN * 2);
  const startY = 860 - (lines.length - 1) * 68;
  rule(ctx, MARGIN, startY - 56, MARGIN + 46, C.white, 0.85);
  lines.forEach((ln, i) => ctx.fillText(ln, MARGIN, startY + i * 68));
  ctx.globalAlpha = 1;

  /* Return to 09:12. */
  const aT = envelope(t - 116, 74, 12, 10);
  if (aT > 0) {
    ctx.globalAlpha = aT;
    mono(ctx, 170, 700, -4);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.white;
    ctx.fillText(S.openTime, W / 2, 880);
    mono(ctx, 26, 500, 16);
    ctx.fillStyle = C.g50;
    ctx.fillText(S.openDay, W / 2 + 8, 950);
    ctx.globalAlpha = 1;
  }

  /* End card. */
  const aE = envelope(t - 200, 20, 14, 0);
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
  if (f < ACT.OPEN[1])          actOpen(ctx, f - ACT.OPEN[0], S);
  else if (f < ACT.ATTEMPTS[1]) actAttempts(ctx, f - ACT.ATTEMPTS[0], S);
  else if (f < ACT.KNOWN[1])    actKnown(ctx, f - ACT.KNOWN[0], S);
  else if (f < ACT.EXCAVATE[1]) actExcavate(ctx, f - ACT.EXCAVATE[0], S);
  else if (f < ACT.RELATION[1]) actRelation(ctx, f - ACT.RELATION[0], S);
  else                          actClose(ctx, f - ACT.CLOSE[0], S);

  ctx.restore();
}

window.SS = { draw, W, H, FPS, TOTAL, ACT };
