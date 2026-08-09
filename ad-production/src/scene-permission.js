/* ============================================================================
   SEEINGSTONE — AD 05 "THE EMAIL YOU CANNOT SEND"
   The sovereignty film, built on the ad 01 skeleton (D9 template).

   Direction settled with Andreas: no competitor is named, and no claim is made
   about what any provider does with your data. The doubt is voiced by the
   client instead — "Where is my file? Who is allowed to read it? What happens
   if you are wrong?" — which asserts nothing about anyone and is the question
   a lawyer actually has to answer, in writing.

   The argument is the permission asymmetry (D4): every external tool needs an
   email you cannot send. SeeingStone needs no such email, because the archive
   never moves. Only the question ever travels, and only on the route you pick.
   ============================================================================ */

const W = 1080;
const H = 1920;
const FPS = 30;

const ACT = {
  ASK:    [0,    300],
  WHY:    [300,  540],
  PRICE:  [540,  660],
  MARK:   [660,  720],
  ROUTES: [720,  1140],
  PAYOFF: [1140, 1320],
  END:    [1320, 1470],
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
/* The stake: the one email that stands between this profession and any AI. */

function actAsk(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 300, 10, 0);
  mono(ctx, 20, 500, 8);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g35;
  ctx.fillText(S.askLabel, MARGIN, 320);
  rule(ctx, MARGIN, 350, W - MARGIN, C.g20);

  mono(ctx, 22, 400, 0);
  ctx.fillStyle = C.g70;
  ctx.fillText(S.emailTo, MARGIN, 406);
  ctx.fillText(S.emailSubject, MARGIN, 444);
  rule(ctx, MARGIN, 472, W - MARGIN, C.g10);
  ctx.globalAlpha = 1;

  /* Types out, then stops. It is never finished and never sent. */
  mono(ctx, 32, 400, 0);
  ctx.fillStyle = C.white;
  const chars = Math.floor(clamp((t - 30) / 1.6, 0, S.emailBody.length));
  const lines = wrap(ctx, S.emailBody, W - MARGIN * 2);
  let consumed = 0, caretX = MARGIN, caretY = 550;
  lines.forEach((full, i) => {
    const y = 550 + i * 48;
    const visible = full.slice(0, clamp(chars - consumed, 0, full.length));
    ctx.fillText(visible, MARGIN, y);
    if (chars > consumed) { caretX = MARGIN + ctx.measureText(visible).width; caretY = y; }
    consumed += full.length + 1;
  });
  if (chars < S.emailBody.length || (t % 30) < 18) {
    ctx.fillStyle = C.white;
    ctx.fillRect(caretX + 4, caretY - 24, 14, 32);
  }

  /* The counter that never moves. */
  const mA = envelope(t - 150, 150, 14, 0);
  if (mA > 0) {
    const my = 830;
    ctx.globalAlpha = mA;
    rule(ctx, MARGIN, my - 46, W - MARGIN, C.g20);
    mono(ctx, 17, 500, 4);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'left';
    ctx.fillText(S.sentLabel, MARGIN, my);
    mono(ctx, 96, 700, -2);
    ctx.fillStyle = C.white;
    ctx.fillText(S.sentValue, MARGIN, my + 92);
    ctx.globalAlpha = 1;
  }

  caption(ctx, S.capAsk1, envelope(t - 176, 74, 10, 10), 1330, 46);
  caption(ctx, S.capAsk2, envelope(t - 258, 42, 10, 8), 1330, 46);
}

/* ----------------------------------------------------------------- ACT: WHY */
/* The client's questions. Asserts nothing about anyone — and is unanswerable
   the moment the file has left the building. */

function actWhy(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 240, 12, 0);
  mono(ctx, 18, 500, 6);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.whyLabel, MARGIN, 480);
  rule(ctx, MARGIN, 510, W - MARGIN, C.g20);
  ctx.globalAlpha = 1;

  S.why.forEach((q, i) => {
    ctx.globalAlpha = envelope(t - (24 + i * 40), 216 - i * 40, 12, 0);
    sans(ctx, 46, 600, -0.2);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'left';
    ctx.fillText(q, MARGIN, 610 + i * 92);
    ctx.globalAlpha = 1;
  });

  caption(ctx, S.capWhy1, envelope(t - 150, 60, 10, 10), 1180, 44);
  caption(ctx, S.capWhy2, envelope(t - 200, 40, 10, 8), 1180, 44);
}

/* --------------------------------------------------------------- ACT: PRICE */

function actPrice(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 120, 8, 0);
  mono(ctx, 150, 700, -5);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  ctx.fillText(S.priceBig, W / 2, 720);
  mono(ctx, 20, 500, 10);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.priceBigLabel, W / 2 + 5, 776);

  ctx.globalAlpha = envelope(t - 28, 92, 10, 0);
  mono(ctx, 150, 700, -5);
  ctx.fillStyle = C.white;
  ctx.fillText(S.priceZero, W / 2, 1000);
  mono(ctx, 20, 500, 10);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.priceZeroLabel, W / 2 + 5, 1056);
  ctx.globalAlpha = 1;

  caption(ctx, S.capPrice, envelope(t - 56, 50, 10, 8), 1400, 44);

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
    if (reveal < 1) rule(ctx, cx - 150, cy + h / 2 - h * reveal, cx + 150, C.white, 0.5 * (1 - reveal));
  }
  ctx.globalAlpha = envelope(t - 28, 32, 12, 0);
  mono(ctx, 28, 500, 14);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  ctx.fillText(S.wordmark, W / 2 + 7, 1070);
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------- ACT: ROUTES */
/* The perimeter is the argument. The archive sits inside it and does not move.
   Exactly one thin line crosses the boundary, and it carries a question. */

const PX0 = 70, PY0 = 430, PX1 = 1010, PY1 = 1150;

function actRoutes(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 420, 10, 0);
  mono(ctx, 17, 500, 5);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.routesLabel, MARGIN, 380);
  ctx.globalAlpha = 1;

  /* The perimeter. */
  const pA = envelope(t - 6, 414, 14, 0);
  ctx.save();
  ctx.globalAlpha = pA * 0.9;
  ctx.strokeStyle = C.g35;
  ctx.lineWidth = 1;
  ctx.setLineDash([7, 9]);
  ctx.strokeRect(PX0 + 0.5, PY0 + 0.5, PX1 - PX0, PY1 - PY0);
  ctx.restore();

  /* The archive, anchored. */
  const aA = envelope(t - 18, 402, 12, 0);
  ctx.save();
  ctx.globalAlpha = aA;
  ctx.strokeStyle = C.g20;
  ctx.lineWidth = 1;
  ctx.strokeRect(110.5, 480.5, 860, 150);
  const r = mulberry32(5150);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = C.g20;
    ctx.fillRect(140, 512 + i * 22, 300 + r() * 480, 7);
  }
  mono(ctx, 20, 700, 2);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(S.archiveLabel, 140, 470);
  mono(ctx, 15, 400, 1);
  ctx.fillStyle = C.g50;
  ctx.textAlign = 'right';
  ctx.fillText(S.archiveSub, 970, 470);
  ctx.restore();

  /* Three routes, inside the line. */
  const rowY = [720, 840, 960];
  S.routes.forEach((rt, i) => {
    const a = envelope(t - (60 + i * 40), 360 - i * 40, 12, 0);
    if (a <= 0) return;
    const y = rowY[i];
    ctx.globalAlpha = a;

    mono(ctx, 22, 700, 2);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.white;
    ctx.fillText(rt[0], 140, y);

    mono(ctx, 22, 500, 2);
    ctx.fillText(rt[1], 190, y);

    mono(ctx, 15, 400, 1);
    ctx.fillStyle = C.g50;
    ctx.fillText(rt[2], 190, y + 26);

    mono(ctx, 15, 500, 1);
    ctx.fillStyle = rt[3].includes('nothing') ? C.white : C.g70;
    ctx.textAlign = 'right';
    ctx.fillText(rt[3], 970, y);
    ctx.fillStyle = C.g50;
    ctx.fillText(rt[4], 970, y + 26);

    rule(ctx, 140, y + 48, 970, C.g10, a);
    ctx.globalAlpha = 1;
  });

  /* Route A is the only thing that ever crosses the boundary. */
  const cross = easeOut(seg(t, 210, 268));
  if (cross > 0) {
    /* Runs down the left gutter so it plainly belongs to route A alone,
       rather than appearing to touch B and C on the way past. */
    const x = 112;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(136, 714.5);
    ctx.lineTo(x + 0.5, 714.5);
    ctx.lineTo(x + 0.5, 714 + (1300 - 714) * cross);
    if (cross >= 1) ctx.lineTo(160, 1300.5);
    ctx.stroke();
    ctx.restore();

    if (cross > 0.55) {
      const a = envelope(t - 250, 170, 12, 0);
      ctx.globalAlpha = a;
      ctx.strokeStyle = C.g35;
      ctx.lineWidth = 1;
      ctx.strokeRect(140.5, 1270.5, 700, 96);
      mono(ctx, 19, 700, 2);
      ctx.fillStyle = C.white;
      ctx.textAlign = 'left';
      ctx.fillText('EU DATACENTRE', 170, 1312);
      mono(ctx, 15, 400, 1);
      ctx.fillStyle = C.g50;
      ctx.fillText('GDPR terms · your choice of provider', 170, 1340);

      /* Name what crosses, right on the line. */
      mono(ctx, 16, 500, 1);
      ctx.fillStyle = C.white;
      ctx.fillText('the question — and only the question', x + 26, 1212);
      ctx.globalAlpha = 1;
    }
  }

  ctx.globalAlpha = envelope(t - 120, 300, 12, 0);
  mono(ctx, 15, 400, 1);
  ctx.fillStyle = C.g35;
  ctx.textAlign = 'right';
  ctx.fillText(S.routeNote, 970, 1110);
  ctx.globalAlpha = 1;

  /* The archive label that is the whole point. */
  ctx.globalAlpha = envelope(t - 40, 380, 12, 0);
  mono(ctx, 15, 700, 4);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(S.archiveStays, 140, 660);
  ctx.globalAlpha = 1;

  scrim(ctx, 1420, 1);
  caption(ctx, S.capRoutes, envelope(t - 300, 110, 12, 12), 1700, 40);

  const out = seg(t, 408, 420);
  if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, W, H); }
}

/* -------------------------------------------------------------- ACT: PAYOFF */

function actPayoff(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 180, 12, 0);
  mono(ctx, 18, 500, 6);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.g50;
  ctx.fillText(S.payoffLabel, W / 2 + 6, 700);

  ctx.globalAlpha = envelope(t - 18, 162, 12, 0);
  mono(ctx, 210, 700, -6);
  ctx.fillStyle = C.white;
  ctx.fillText(S.payoffValue, W / 2, 900);

  ctx.globalAlpha = envelope(t - 44, 136, 12, 0);
  mono(ctx, 18, 400, 2);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.payoffNote, W / 2 + 4, 960);
  ctx.globalAlpha = 1;

  caption(ctx, S.capPayoff, envelope(t - 78, 96, 12, 12), 1300, 44);
}

/* ----------------------------------------------------------------- ACT: END */

function actEnd(ctx, t, S) {
  ctx.globalAlpha = envelope(t, 86, 12, 12);
  sans(ctx, 46, 600, -0.2);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.white;
  const cl = wrap(ctx, S.closing, 880);
  cl.forEach((ln, i) => ctx.fillText(ln, W / 2, 880 + i * 60));
  ctx.globalAlpha = 1;

  const aE = envelope(t - 88, 62, 14, 0);
  if (aE > 0) {
    ctx.globalAlpha = aE;
    drawRook(ctx, W / 2, 760, 150, 1);
    sans(ctx, 48, 600, -0.2);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'center';
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
  if (f < ACT.ASK[1])         actAsk(ctx, f - ACT.ASK[0], S);
  else if (f < ACT.WHY[1])    actWhy(ctx, f - ACT.WHY[0], S);
  else if (f < ACT.PRICE[1])  actPrice(ctx, f - ACT.PRICE[0], S);
  else if (f < ACT.MARK[1])   actMark(ctx, f - ACT.MARK[0], S);
  else if (f < ACT.ROUTES[1]) actRoutes(ctx, f - ACT.ROUTES[0], S);
  else if (f < ACT.PAYOFF[1]) actPayoff(ctx, f - ACT.PAYOFF[0], S);
  else                        actEnd(ctx, f - ACT.END[0], S);

  ctx.restore();
}

window.SS = { draw, W, H, FPS, TOTAL, ACT };
