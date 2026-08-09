# ad-production

> **Picking this up fresh, or as a new agent session? Read [`HANDOVER.md`](HANDOVER.md) first.**
> It carries the mission, the rules, the client feedback so far, and the one
> open question that blocks further work. `LOG.md` is the full R&D record.


Code-generated advertising for SeeingStone. Self-contained: this directory
imports nothing from the website and the website imports nothing from it.

Films are rendered from a deterministic canvas scene — one pure function of
frame number — captured frame by frame in headless Chromium, then encoded with
ffmpeg. Changing a word, a number, or the language is a text edit plus a
re-render.

## Requirements

- Node 22+ and Playwright with Chromium
- `ffmpeg` **with libx264** (the Playwright-bundled ffmpeg is VP8-only and
  cannot produce the MP4 that LinkedIn needs — see `LOG.md`)

```
apt-get install -y --no-install-recommends ffmpeg
```

## Render

```bash
# 1. capture frames (resumable — existing frames are skipped)
node bin/capture.mjs --lang en

# 2. encode
bin/encode.sh .frames/en out/seeingstone-40-minutes-en-9x16.mp4
```

German is the same edit with different strings:

```bash
node bin/capture.mjs --lang de
bin/encode.sh .frames/de out/seeingstone-40-minutes-de-9x16.mp4
```

Render a few frames to inspect the look without a full pass:

```bash
node bin/capture.mjs --lang en --out /tmp/keys --only 60,200,460,545,740,880,960
```

## Layout

```
src/scene.js          the film: draw(ctx, frame, strings), pure and seeded
src/render.html       canvas surface + font loading
src/strings.en.json   every word, plus archive pools and entity-tagged lines
src/strings.de.json   German equivalent — a data swap, not a second edit
bin/capture.mjs       headless Chromium → numbered PNGs
bin/encode.sh         PNGs → H.264 MP4
assets/fonts/         vendored Inter + JetBrains Mono (renders never hit network)
LOG.md                R&D record: findings, dead ends, decisions
```

## Editing the film

- **Words** — `src/strings.*.json`. Nothing else needs to change.
- **Timing** — the `ACT` table at the top of `src/scene.js`. Act boundaries are
  frame numbers at 30fps; changing them re-times everything downstream.
- **Entity spans** in the text stream use `[[typeIndex|text]]`, where
  `typeIndex` selects from `entityLabels` in the same strings file.

## House rules for these films

1. Monochrome. Black, white, greys. The rook is the only mark.
2. Present tense. Describe what the system does. No roadmaps, no ship dates.
3. Nothing on screen that the product cannot plausibly do. No invented accuracy
   figures, confidence scores, benchmarks, or customer logos.
4. Captions carry the film. It has to work with the sound off, because it will
   be watched with the sound off.
5. Determinism is not optional: no `Math.random()`, no wall-clock time. Seeded
   PRNG only, so any frame can be reproduced exactly.
