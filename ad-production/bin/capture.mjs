/* ============================================================================
   Frame capture: drives src/render.html in headless Chromium and writes one
   PNG per frame. Pure function of frame index, so this is resumable and
   parallelisable — nothing carries state between frames.

   Usage: node bin/capture.mjs --lang en --out /path/to/frames [--only 120,430]
   ============================================================================ */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function arg(name, fallback = null) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const lang = arg('lang', 'en');
const outDir = arg('out', resolve(ROOT, '.frames', lang));
const only = arg('only', null);
const scale = parseFloat(arg('scale', '1'));

const strings = JSON.parse(readFileSync(resolve(ROOT, `src/strings.${lang}.json`), 'utf8'));

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
});
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: scale,
});

page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });

await page.goto('file://' + resolve(ROOT, 'src/render.html'));
await page.evaluate(() => window.ready);
await page.evaluate(s => window.setStrings(s), strings);

const meta = await page.evaluate(() => window.meta());
console.log(`[capture] ${lang} · ${meta.W}x${meta.H} · ${meta.FPS}fps · ${meta.TOTAL} frames`);

const frames = only
  ? only.split(',').map(n => parseInt(n.trim(), 10))
  : Array.from({ length: meta.TOTAL }, (_, i) => i);

const el = await page.$('#stage');
const t0 = Date.now();

for (let k = 0; k < frames.length; k++) {
  const f = frames[k];
  const file = resolve(outDir, String(f).padStart(5, '0') + '.png');
  if (!only && existsSync(file)) continue;      // resume support
  await page.evaluate(n => window.renderFrame(n), f);
  const buf = await el.screenshot({ type: 'png' });
  writeFileSync(file, buf);

  if (k % 60 === 0 || k === frames.length - 1) {
    const done = k + 1;
    const rate = done / ((Date.now() - t0) / 1000);
    const eta = Math.round((frames.length - done) / rate);
    console.log(`[capture] ${done}/${frames.length}  ${rate.toFixed(1)} fps  eta ${eta}s`);
  }
}

await browser.close();
console.log(`[capture] done → ${outDir}`);
