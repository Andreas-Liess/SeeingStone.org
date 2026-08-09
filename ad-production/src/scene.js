/* ============================================================================
   SEEINGSTONE — AD 01 "40 MINUTES"
   Deterministic canvas renderer. draw(frame) is a pure function of `frame`:
   no rAF, no Date.now(), no Math.random(). The same frame always produces the
   same pixels, so renders are reproducible and resumable.
   ============================================================================ */

const W = 1080;
const H = 1920;
const FPS = 30;

/* Act boundaries, in frames. Change these and the whole edit re-times. */
const ACT = {
  QUERY:  [0,   135],
  SEARCH: [135, 435],
  FAIL:   [435, 510],
  MARK:   [510, 570],
  SYSTEM: [570, 810],
  ANSWER: [810, 900],
  END:    [900, 990],
};
const TOTAL = ACT.END[1];

/* Monochrome only. No brand colour anywhere — the rook is the only mark. */
const C = {
  bg:    '#000000',
  white: '#ffffff',
  g70:   '#b3b3b3',
  g50:   '#808080',
  g35:   '#595959',
  g20:   '#333333',
  g10:   '#1a1a1a',
};

const MARGIN = 90;

/* Rook path, lifted verbatim from the site nav logo. Bounds x:12..52 y:12..56 */
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
const easeIn = t => t * t * t;
const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* Normalised progress through a window, clamped at both ends. */
const seg = (f, a, b) => clamp((f - a) / (b - a));

/* Fade in over `inLen`, hold, fade out over `outLen`. */
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

function fmt(n, lang) {
  const s = Math.round(n).toString();
  const sepChar = lang === 'de' ? '.' : ',';
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, sepChar);
}

/* Wrap text to a pixel width. Returns an array of lines. */
function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? line + ' ' + word : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
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
  ctx.moveTo(x1, y + 0.5);
  ctx.lineTo(x2, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

/* Bottom scrim so captions stay legible over moving content. */
function scrim(ctx, top, alpha = 1) {
  const g = ctx.createLinearGradient(0, top, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.42, `rgba(0,0,0,${0.94 * alpha})`);
  g.addColorStop(1, `rgba(0,0,0,${0.99 * alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, top, W, H - top);
}

/* A caption: hairline tick, then the line(s). This carries the film when muted. */
function caption(ctx, text, alpha, baselineY) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  sans(ctx, 52, 600, -0.2);
  ctx.textAlign = 'left';
  ctx.fillStyle = C.white;
  const lines = wrap(ctx, text, W - MARGIN * 2);
  const lh = 66;
  const startY = baselineY - (lines.length - 1) * lh;
  rule(ctx, MARGIN, startY - 46, MARGIN + 46, C.white, 0.85);
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

/* ------------------------------------------------------- archive row corpus */
/* Deterministic from row index: same row content on every render. */

function archiveRow(i, S) {
  const r = mulberry32(i * 2654435761);
  const sender = S.senders[Math.floor(r() * S.senders.length)];
  const subject = S.subjects[Math.floor(r() * S.subjects.length)];
  /* Dates walk backwards from Feb 2026, ~0.9 days per row. */
  const day = new Date(Date.UTC(2026, 1, 10) - i * 0.9 * 86400000);
  const dd = String(day.getUTCDate()).padStart(2, '0');
  const mm = String(day.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = String(day.getUTCFullYear());
  const date = S.lang === 'de' ? `${dd}.${mm}.${yyyy}` : `${yyyy}-${mm}-${dd}`;
  /* Message ids count down as you walk backwards through the pile. */
  return { idx: 38417 - i, date, sender, subject };
}

/* Scroll position of the archive, in px, as a function of act progress.
   Slow enough to read at first, then accelerates past legibility. */
function archiveOffset(p) {
  return 900 * p + 14000 * Math.pow(p, 4);
}
function archiveSpeed(p, dur) {
  return (900 + 56000 * Math.pow(p, 3)) / dur;
}

/* False-positive events: frame within SEARCH when a row lights up, then dies. */
const FALSE_HITS = [42, 96, 152, 206, 248, 284];

/* --------------------------------------------------------------- ACT: QUERY */

function actQuery(ctx, t, S) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  mono(ctx, 22, 500, 8);
  ctx.fillStyle = C.g35;
  ctx.textAlign = 'left';
  ctx.globalAlpha = envelope(t, 135, 10, 0);
  ctx.fillText('QUERY', MARGIN, 150);
  rule(ctx, MARGIN, 178, MARGIN + 240 * easeOut(seg(t, 4, 26)), C.g20);
  ctx.globalAlpha = 1;

  /* Typed question. */
  mono(ctx, 52, 500, -0.5);
  ctx.fillStyle = C.white;
  const chars = Math.floor(clamp((t - 18) / 1.5, 0, S.query.length));
  const shown = S.query.slice(0, chars);
  const lines = wrap(ctx, S.query, W - MARGIN * 2);

  /* Lay out against the *full* string so the text never reflows mid-type. */
  let consumed = 0;
  let caretX = MARGIN, caretY = 790;
  lines.forEach((full, i) => {
    const y = 790 + i * 74;
    const visible = full.slice(0, clamp(chars - consumed, 0, full.length));
    ctx.fillText(visible, MARGIN, y);
    if (chars > consumed) {
      caretX = MARGIN + ctx.measureText(visible).width;
      caretY = y;
    }
    consumed += full.length + 1;
  });

  const typing = chars < S.query.length;
  const blink = typing || (t % 30) < 18;
  if (blink) {
    ctx.fillStyle = C.white;
    ctx.fillRect(caretX + 4, caretY - 38, 22, 48);
  }

  /* Scale of the problem, stated plainly. */
  ctx.globalAlpha = envelope(t - 104, 31, 14, 0);
  mono(ctx, 24, 400, 1);
  ctx.fillStyle = C.g50;
  ctx.fillText(S.corpusLine, MARGIN, 790 + lines.length * 74 + 66);
  ctx.globalAlpha = 1;
}

/* -------------------------------------------------------------- ACT: SEARCH */

function drawArchive(ctx, p, dur, S, dim, showHits, hitFreeze) {
  const offset = archiveOffset(p);
  const speed = archiveSpeed(p, dur);
  const rowH = 34;
  const top = 240;

  const first = Math.max(0, Math.floor((offset - 240) / rowH));
  const last = first + Math.ceil((H + 400) / rowH);

  /* Motion smear: ghost copies spread along the travel distance of one frame. */
  const ghosts = speed > 14 ? 4 : 1;
  const ghostAlpha = 1 / ghosts;

  mono(ctx, 20, 400, 0);
  ctx.textAlign = 'left';

  for (let i = first; i <= last; i++) {
    const baseY = top + i * rowH - offset;
    if (baseY < 236 || baseY > H + 40) continue;
    const row = archiveRow(i, S);

    /* Is this row one of the scripted false positives? */
    let hit = null;
    if (showHits) {
      for (let k = 0; k < FALSE_HITS.length; k++) {
        const ts = FALSE_HITS[k];
        const hp = ts / dur;
        const idxAtT = Math.floor((archiveOffset(hp) + 700 - top) / rowH);
        if (idxAtT === i) { hit = ts; break; }
      }
    }

    for (let g = 0; g < ghosts; g++) {
      const y = baseY + (g - (ghosts - 1) / 2) * (speed / ghosts);
      ctx.globalAlpha = ghostAlpha * dim;

      if (hit !== null) {
        const age = (hitFreeze !== null ? hitFreeze : p * dur) - hit;
        if (age >= 0) {
          const flash = age < 10 ? 1 : 0.5;
          ctx.fillStyle = age < 10 ? C.white : C.g35;
          ctx.globalAlpha = ghostAlpha * dim * flash;
        }
      }

      if (hit === null) ctx.fillStyle = C.g20;
      ctx.fillText(String(row.idx), MARGIN, y);

      if (hit === null) ctx.fillStyle = C.g35;
      ctx.fillText(row.date, MARGIN + 100, y);

      if (hit === null) ctx.fillStyle = C.g50;
      ctx.fillText(row.sender, MARGIN + 280, y);

      if (hit === null) ctx.fillStyle = C.g35;
      ctx.fillText(row.subject, MARGIN + 470, y);

      /* A discarded hit gets struck through. */
      if (hit !== null) {
        const age = (hitFreeze !== null ? hitFreeze : p * dur) - hit;
        if (age >= 10) {
          ctx.globalAlpha = ghostAlpha * dim * 0.5;
          ctx.strokeStyle = C.g35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(MARGIN + 260, y - 7.5);
          ctx.lineTo(MARGIN + 900, y - 7.5);
          ctx.stroke();
        }
      }
    }
  }
  ctx.globalAlpha = 1;
  return { offset, speed };
}

/* Elapsed clock: 0 → 40:00, weighted so most of the time evaporates late. */
function manualClock(p) {
  return 2400 * (0.15 * p + 0.85 * Math.pow(p, 3));
}
function mmss(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function searchHud(ctx, p, dur, S, alpha, clockOverride) {
  ctx.save();
  ctx.globalAlpha = alpha;

  mono(ctx, 24, 500, 6);
  ctx.fillStyle = C.g70;
  ctx.textAlign = 'left';
  ctx.fillText(S.hudManual, MARGIN, 118);

  /* Scanned tracks the whole corpus, not just rows drawn on screen. */
  const scanned = Math.floor(38417 * clamp(0.015 + 0.985 * Math.pow(p, 2.2)));
  const discarded = FALSE_HITS.filter(ts => ts <= p * dur).length;

  mono(ctx, 20, 400, 1);
  ctx.fillStyle = C.g50;
  ctx.fillText(`${S.hudScanned} ${fmt(scanned, S.lang)} / ${fmt(38417, S.lang)}`, MARGIN, 160);
  ctx.textAlign = 'right';
  ctx.fillText(`${S.hudDiscarded} ${discarded}`, W - MARGIN, 160);

  if (clockOverride === null) {
    mono(ctx, 44, 700, 1);
    ctx.fillStyle = C.white;
    ctx.fillText(mmss(manualClock(p)), W - MARGIN, 124);
  }

  rule(ctx, MARGIN, 196, W - MARGIN, C.g20);
  ctx.restore();
}

function actSearch(ctx, t, S) {
  const dur = ACT.SEARCH[1] - ACT.SEARCH[0];
  const p = t / dur;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  drawArchive(ctx, p, dur, S, 1, true, null);
  searchHud(ctx, p, dur, S, 1, null);

  scrim(ctx, 1140, 1);

  caption(ctx, S.capSearch1, envelope(t - 30, 95, 10, 10), 1520);
  caption(ctx, S.capSearch2, envelope(t - 135, 100, 10, 10), 1520);
  caption(ctx, S.capSearch3, envelope(t - 245, 55, 10, 6), 1520);
}

/* ---------------------------------------------------------------- ACT: FAIL */
/* The archive stops dead. The clock detaches from the HUD and takes the frame. */

function actFail(ctx, t, S) {
  const searchDur = ACT.SEARCH[1] - ACT.SEARCH[0];

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const dim = 1 - easeOut(seg(t, 0, 26)) * 0.94;
  const gone = easeOut(seg(t, 10, 34));

  ctx.save();
  ctx.globalAlpha = (1 - gone);
  drawArchive(ctx, 1, searchDur, S, dim, true, searchDur);
  ctx.restore();

  searchHud(ctx, 1, searchDur, S, (1 - gone) * 0.6, 'moved');

  /* Clock travels from its HUD slot to centre frame and grows. */
  const m = easeInOut(seg(t, 0, 30));
  const size = lerp(44, 210, m);
  const x = lerp(W - MARGIN, W / 2, m);
  const y = lerp(124, 900, m);

  mono(ctx, size, 700, m > 0.5 ? -2 : 1);
  ctx.fillStyle = C.white;
  ctx.textAlign = m > 0.02 ? 'center' : 'right';
  ctx.globalAlpha = 1;
  ctx.fillText('40:00', m > 0.02 ? x : W - MARGIN, y);

  ctx.globalAlpha = envelope(t - 40, 35, 12, 0);
  mono(ctx, 26, 500, 14);
  ctx.fillStyle = C.g70;
  ctx.textAlign = 'center';
  ctx.fillText(S.notFound, W / 2, 1010);
  ctx.globalAlpha = 1;

  /* Fade the whole frame out — the silence before the mark. */
  const out = seg(t, 60, 75);
  if (out > 0) {
    ctx.fillStyle = `rgba(0,0,0,${out})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* ---------------------------------------------------------------- ACT: MARK */

function actMark(ctx, t, S) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2, cy = 880, h = 260;
  const reveal = easeOut(seg(t, 8, 34));
  if (reveal > 0) {
    /* Bottom-up wipe. */
    ctx.save();
    ctx.beginPath();
    const top = cy + h / 2 - h * reveal;
    ctx.rect(0, top, W, H - top);
    ctx.clip();
    drawRook(ctx, cx, cy, h, 1);
    ctx.restore();

    /* Hairline riding the reveal edge. */
    if (reveal < 1) {
      const yEdge = cy + h / 2 - h * reveal;
      rule(ctx, cx - 150, yEdge, cx + 150, C.white, 0.5 * (1 - reveal));
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
/* Three honest layers: a semantic space settling, raw text being labelled,
   and counters over the user's own corpus. EGRESS never moves off zero. */

const CLOUD_N = 900;
let cloud = null;
function buildCloud() {
  if (cloud) return cloud;
  const r = mulberry32(20260214);
  /* The field owns a full-width band; panels sit below it, not over it. */
  const centers = [];
  for (let c = 0; c < 7; c++) {
    centers.push({ x: 170 + r() * 740, y: 380 + r() * 340 });
  }
  const pts = [];
  for (let i = 0; i < CLOUD_N; i++) {
    const c = Math.floor(r() * centers.length);
    const ang = r() * Math.PI * 2;
    const rad = Math.pow(r(), 0.65) * 110;
    pts.push({
      sx: 90 + r() * (W - 180),
      sy: 320 + r() * 440,
      tx: centers[c].x + Math.cos(ang) * rad,
      ty: centers[c].y + Math.sin(ang) * rad * 0.8,
      c,
      bright: r() < 0.05,
      d: r(),
    });
  }
  const pairs = [];
  for (let i = 0; i < CLOUD_N; i++) {
    for (let j = i + 1; j < Math.min(i + 14, CLOUD_N); j++) {
      if (pts[i].c !== pts[j].c) continue;
      const dx = pts[i].tx - pts[j].tx, dy = pts[i].ty - pts[j].ty;
      if (dx * dx + dy * dy < 2600) pairs.push([i, j]);
    }
  }
  cloud = { pts, pairs: pairs.slice(0, 420) };
  return cloud;
}

/* Stream lines use [[n|text]] to mark an entity span of type n. */
function parseSpans(raw) {
  const parts = [];
  let rest = raw;
  const re = /\[\[(\d+)\|([^\]]+)\]\]/;
  let m;
  while ((m = re.exec(rest))) {
    if (m.index > 0) parts.push({ text: rest.slice(0, m.index), label: null });
    parts.push({ text: m[2], label: parseInt(m[1], 10) });
    rest = rest.slice(m.index + m[0].length);
  }
  if (rest) parts.push({ text: rest, label: null });
  return parts;
}

function drawStream(ctx, t, S, alpha) {
  if (alpha <= 0) return;
  const lines = S.stream;
  const rowH = 52;
  const top = 860, bottom = 1190;
  const offset = t * 3.1;

  ctx.save();
  ctx.beginPath();
  ctx.rect(MARGIN - 20, top - 30, 640, bottom - top + 40);
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(MARGIN - 20, top - 30, 640, bottom - top + 40);
  ctx.globalAlpha = alpha;

  const first = Math.floor(offset / rowH);
  for (let i = first; i < first + 20; i++) {
    const y = top + i * rowH - offset;
    if (y < top - 40 || y > bottom + 20) continue;
    const raw = lines[((i % lines.length) + lines.length) % lines.length];
    const parts = parseSpans(raw);

    let x = MARGIN;
    mono(ctx, 20, 400, 0);
    ctx.textAlign = 'left';

    /* Entity ignites as the line enters the upper third of the panel. */
    const igniteAt = top + 150;
    const age = (igniteAt - y) / 3.1;
    const hot = age >= 0 && age < 12;
    const settled = age >= 12;

    for (const part of parts) {
      const wpx = ctx.measureText(part.text).width;
      if (part.label === null) {
        ctx.fillStyle = C.g35;
        ctx.fillText(part.text, x, y);
      } else {
        const on = hot ? 1 : settled ? 0.55 : 0.16;
        ctx.fillStyle = hot ? C.white : settled ? C.g70 : C.g20;
        ctx.globalAlpha = alpha;
        ctx.fillText(part.text, x, y);

        ctx.strokeStyle = C.white;
        ctx.globalAlpha = alpha * on * 0.85;
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 5.5, y - 22.5, wpx + 11, 30);

        mono(ctx, 11, 500, 2);
        ctx.fillStyle = C.white;
        ctx.globalAlpha = alpha * on;
        ctx.fillText(S.entityLabels[part.label % S.entityLabels.length], x - 4, y - 28);
        mono(ctx, 20, 400, 0);
        ctx.globalAlpha = alpha;
      }
      x += wpx;
    }
  }

  /* Soften the panel edges so lines enter and leave instead of being sliced. */
  ctx.globalAlpha = 1;
  const fadeH = 44;
  let g = ctx.createLinearGradient(0, top - 30, 0, top - 30 + fadeH);
  g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(MARGIN - 20, top - 30, 640, fadeH);

  g = ctx.createLinearGradient(0, bottom + 10 - fadeH, 0, bottom + 10);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000');
  ctx.fillStyle = g;
  ctx.fillRect(MARGIN - 20, bottom + 10 - fadeH, 640, fadeH);

  ctx.restore();
}

function drawCloud(ctx, t, S, alpha, collapse) {
  if (alpha <= 0) return;
  const cl = buildCloud();
  const q = easeInOut(clamp((t - 20) / 150));
  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = W / 2, cy = 550;

  const pos = cl.pts.map(p => {
    let x = lerp(p.sx, p.tx, q);
    let y = lerp(p.sy, p.ty, q);
    if (collapse > 0) {
      x = lerp(x, cx, collapse);
      y = lerp(y, cy, collapse);
    }
    return { x, y };
  });

  if (q > 0.55) {
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 1;
    ctx.globalAlpha = alpha * (q - 0.55) * 0.9;
    ctx.beginPath();
    for (const [i, j] of cl.pairs) {
      ctx.moveTo(pos[i].x, pos[i].y);
      ctx.lineTo(pos[j].x, pos[j].y);
    }
    ctx.stroke();
  }

  for (let i = 0; i < cl.pts.length; i++) {
    const p = cl.pts[i];
    ctx.globalAlpha = alpha * (p.bright ? 1 : 0.42 + p.d * 0.5);
    ctx.fillStyle = p.bright ? C.white : C.g70;
    const s = p.bright ? 3.4 : 2.2;
    ctx.fillRect(pos[i].x - s / 2, pos[i].y - s / 2, s, s);
  }
  ctx.restore();
}

function drawReadout(ctx, t, S, alpha) {
  if (alpha <= 0) return;
  const x0 = 720, x1 = W - MARGIN;
  let y = 900;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(x0 - 26, 846, x1 - x0 + 52, 344);

  S.readout.forEach((row, i) => {
    const [label, target] = row;
    const isEgress = i === S.readout.length - 1;
    const start = 24 + i * 10;
    const prog = easeOut(clamp((t - start) / 110));
    /* Counters race, then settle. EGRESS is not a counter — it is a constant. */
    const value = isEgress ? 0 : Math.round(target * prog);

    mono(ctx, 16, 500, 3);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'left';
    ctx.fillText(label, x0, y);

    mono(ctx, 30, 700, 0);
    ctx.fillStyle = C.white;
    ctx.textAlign = 'right';
    ctx.fillText(fmt(value, S.lang), x1, y + 2);

    if (isEgress) {
      ctx.globalAlpha = alpha * envelope(t - 148, 200, 18, 0);
      mono(ctx, 15, 400, 1);
      ctx.fillStyle = C.g50;
      ctx.textAlign = 'right';
      ctx.fillText(S.readoutEgressNote, x1, y + 42);
      ctx.globalAlpha = alpha;
    }

    rule(ctx, x0, y + 20, x1, C.g20, 0.9);
    y += 64;
  });
  ctx.restore();
}

function actSystem(ctx, t, S) {
  const dur = ACT.SYSTEM[1] - ACT.SYSTEM[0];

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  const collapse = easeInOut(seg(t, 198, 236));
  const fadeLayers = 1 - seg(t, 206, 238);

  drawCloud(ctx, t, S, 0.9, collapse);

  /* Name the field, so it reads as a structure rather than decoration. */
  ctx.globalAlpha = fadeLayers * envelope(t - 26, 220, 16, 0);
  mono(ctx, 16, 500, 4);
  ctx.fillStyle = C.g50;
  ctx.textAlign = 'left';
  ctx.fillText(S.labelSpace, MARGIN, 324);
  ctx.globalAlpha = 1;

  drawStream(ctx, t, S, fadeLayers);
  drawReadout(ctx, t, S, fadeLayers);

  /* HUD */
  ctx.globalAlpha = envelope(t, dur, 8, 0);
  mono(ctx, 22, 500, 6);
  ctx.fillStyle = C.g70;
  ctx.textAlign = 'left';
  ctx.fillText(S.hudSystem, MARGIN + 46, 118);
  drawRook(ctx, MARGIN + 14, 108, 34, 0.9);

  const secs = clamp(t / 60, 0, 4);
  mono(ctx, 40, 700, 1);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'right';
  ctx.fillText(`00:0${Math.floor(secs)}.${Math.floor((secs % 1) * 10)}`, W - MARGIN, 124);
  rule(ctx, MARGIN, 196, W - MARGIN, C.g20);

  /* Query echo, retyped fast. */
  const echo = '> ' + S.query;
  const n = Math.floor(clamp(t / 0.9, 0, echo.length));
  mono(ctx, 26, 400, 0);
  ctx.fillStyle = C.g70;
  ctx.textAlign = 'left';
  ctx.fillText(echo.slice(0, n), MARGIN, 262);
  ctx.globalAlpha = 1;

  scrim(ctx, 1230, 0.95);
  caption(ctx, S.capSystem1, envelope(t - 40, 88, 10, 10), 1560);
  caption(ctx, S.capSystem2, envelope(t - 140, 84, 10, 10), 1560);

  const out = seg(t, 228, dur);
  if (out > 0) {
    ctx.fillStyle = `rgba(0,0,0,${out})`;
    ctx.fillRect(0, 0, W, H);
  }
}

/* -------------------------------------------------------------- ACT: ANSWER */

function actAnswer(ctx, t, S) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.globalAlpha = envelope(t - 4, 90, 10, 0);
  mono(ctx, 20, 500, 8);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'left';
  ctx.fillText(S.matchLabel, MARGIN, 430);
  ctx.globalAlpha = 1;

  rule(ctx, MARGIN, 466, MARGIN + (W - MARGIN * 2) * easeOut(seg(t, 6, 22)), C.white, 0.55);

  /* The sentence itself. */
  sans(ctx, 46, 600, -0.2);
  ctx.fillStyle = C.white;
  const qLines = wrap(ctx, S.quote, W - MARGIN * 2);
  qLines.forEach((ln, i) => {
    ctx.globalAlpha = envelope(t - (16 + i * 5), 90, 10, 0);
    ctx.fillText(ln, MARGIN, 570 + i * 62);
  });
  ctx.globalAlpha = 1;

  /* Provenance. Every line here is the kind of thing the system can actually
     bind: file, position in thread, author, date, where it is stored. */
  let y = 570 + qLines.length * 62 + 96;
  S.meta.forEach((row, i) => {
    const a = envelope(t - (36 + i * 6), 90, 10, 0);
    ctx.globalAlpha = a;
    mono(ctx, 18, 500, 4);
    ctx.fillStyle = C.g50;
    ctx.textAlign = 'left';
    ctx.fillText(row[0], MARGIN, y);
    mono(ctx, 20, 400, 0);
    ctx.fillStyle = i === S.meta.length - 1 ? C.white : C.g70;
    ctx.fillText(row[1], MARGIN + 300, y);
    rule(ctx, MARGIN, y + 20, W - MARGIN, C.g10, a);
    y += 58;
  });
  ctx.globalAlpha = 1;

  ctx.globalAlpha = envelope(t - 56, 90, 12, 0);
  mono(ctx, 96, 700, -2);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'right';
  ctx.fillText('00:04', W - MARGIN, y + 130);
  ctx.globalAlpha = 1;

  caption(ctx, S.capAnswer, envelope(t - 64, 26, 10, 0), 1620);
}

/* ----------------------------------------------------------------- ACT: END */

function actEnd(ctx, t, S) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  drawRook(ctx, W / 2, 740, 150, envelope(t, 90, 12, 0));

  ctx.globalAlpha = envelope(t - 10, 80, 14, 0);
  sans(ctx, 48, 600, -0.2);
  ctx.fillStyle = C.white;
  ctx.textAlign = 'center';
  const lines = wrap(ctx, S.tagline, 900);
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, 980 + i * 62));

  const yb = 980 + lines.length * 62;
  rule(ctx, W / 2 - 60, yb + 34, W / 2 + 60, C.g35);

  ctx.globalAlpha = envelope(t - 26, 64, 14, 0);
  mono(ctx, 28, 500, 6);
  ctx.fillStyle = C.g70;
  ctx.fillText(S.url, W / 2 + 3, yb + 110);
  ctx.globalAlpha = 1;

  const out = seg(t, 78, 90);
  if (out > 0) {
    ctx.fillStyle = `rgba(0,0,0,${out})`;
    ctx.fillRect(0, 0, W, H);
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
  if (f < ACT.QUERY[1])       actQuery(ctx, f - ACT.QUERY[0], S);
  else if (f < ACT.SEARCH[1]) actSearch(ctx, f - ACT.SEARCH[0], S);
  else if (f < ACT.FAIL[1])   actFail(ctx, f - ACT.FAIL[0], S);
  else if (f < ACT.MARK[1])   actMark(ctx, f - ACT.MARK[0], S);
  else if (f < ACT.SYSTEM[1]) actSystem(ctx, f - ACT.SYSTEM[0], S);
  else if (f < ACT.ANSWER[1]) actAnswer(ctx, f - ACT.ANSWER[0], S);
  else                        actEnd(ctx, f - ACT.END[0], S);

  ctx.restore();
}

window.SS = { draw, W, H, FPS, TOTAL, ACT };
