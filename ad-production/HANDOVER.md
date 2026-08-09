# HANDOVER — read this first

You are picking up an ad-production project with **no memory of the previous
sessions**. This file is the whole context. Read it, then `LOG.md` sections
D3, D4, D9, D12. That is enough to work.

The person you are working with is **Andreas Liess**, founder of SeeingStone.
He is not an engineer on this — he is the client and the art director. He gives
feedback fast, in fragments, sometimes mid-task. Take it seriously and act on it.

---

## 1. The mission

Make advertising films for SeeingStone **entirely from code** — no After
Effects, no stock footage, no video editor. The pilot question was whether that
can produce work good enough to put in front of paying clients.

**It can.** Five films exist. Andreas' reaction to the first was
*"WOOOW I LOVE THE FIRST CLIP AMAZING!!"*. That is the bar.

## 2. What SeeingStone is

Relationship and document intelligence for professionals who cannot send their
data anywhere — mediators, lawyers, M&A advisors, then German SMEs. It reads
the client's own archive (mail, calendar, PDFs, decks, attachments), binds every
claim to a person, a date and a source, and surfaces what they already had but
could not find.

**The differentiator is not the intelligence. It is the permission.** A lawyer
cannot paste privileged material into a cloud AI without asking the client for
consent — and asking is itself a trust cost. Competitors are not worse for this
buyer, they are *unusable*. From Andreas' pitch, a real prospect said:
*"This is exactly what I need. [...] call me when you solve GDPR compliance."*

Data stays on the client's device or their own server. Only a query ever
travels, and only on a route they choose: an EU-hosted GDPR API, a local model,
or their own infrastructure.

## 3. The rules these films follow — do not break these

1. **Monochrome only.** Black, white, greys. No orange, no product palette.
   The rook is the only mark. (Andreas' explicit direction.)
2. **Price the loss in act one.** The single most important rule — it is the
   difference between the film that worked and the one that failed. See D3.
3. **One measurable binary spans the film.** Ad 01: 40:00 → 00:04.
   Ad 04: 2,247 days → 0. Ad 05: consent emails 0 → consent required 0.
4. **Nothing on screen the product cannot plausibly do.** No invented accuracy
   figures, confidence scores, benchmarks, or customer logos. Impressiveness
   comes from density and speed of *real-shaped* work.
5. **Everything derives from the client's own archive.** Never surveillance of
   a counterparty. This is an honesty constraint and it shapes the stories.
6. **Sovereignty is shown, not said.** Ad 01 does it with `EGRESS 0` sitting
   still while the other counters race.
7. **Captions carry the film.** It will be watched muted on LinkedIn.
8. **Determinism.** No `Math.random()`, no wall-clock. Seeded PRNG only.

## 4. The films

| # | Film key | Length | Status |
|---|---|---|---|
| 01 | `40-minutes` | 33s | **Validated.** EN + DE + sound. Andreas loved it. The template. |
| 02 | `introduction` | 48s | **Failed** (D2). Kept as evidence, not a candidate. Do not ship. |
| 03 | `chain` | 53s | Built, rescued with a priced first act. **Not yet reviewed.** |
| 04 | `anniversary` | 43s | Built EN + sound. **Not yet reviewed. This is the open experiment.** |
| 05 | `permission` | 49s | The sovereignty film. Built. **Not yet reviewed.** |

**Ad 01's template** (the seven beats every later film uses):
question typed → pain escalating with a live counter → hard stop on a number
that prices the loss → black beat + rook → the system doing the same work
honestly → the answer with provenance → end card.

## 5. THE OPEN QUESTION — ask Andreas early

**Does ad 01's template transfer, or did ad 01 win on its measurable binary?**

Ad 04 was built specifically to answer this and **Andreas has not yet given a
verdict**. Everything downstream depends on it:

- If ad 04 lands → the template is confirmed, and the rest is production.
- If ad 04 fails → the lesson was never "stakes", it was that ad 01 ran on a
  hard measurable binary. Drop the emotional register; only build stories with
  a measurable before/after.

Do not build more films before getting this verdict. See D12 — building four
films on one validated data point was the process error of the last session.

## 6. Feedback already given — honour it

- Monochrome, rook only, drop the site palette.
- "Cryptically high tech, but no bullshit."
- Present tense. Describe what the system does. No roadmaps or ship dates.
- Reference he admires: **polar.news on Instagram** — timestamps as spine, flat
  numerals, arguments built from absence, ambient sound with subtle beeps and
  clicks, an audio signature. Ad 02 copied this register and failed; the
  *technique* is still useful, the wholesale register is not (D2).
- **Sound:** he likes the ticks and thumps. He does **not** like the room tone
  or the audio logo — "maybe less loud, maybe very silent, yes, silent." Two
  variants were produced for him to choose between (`sound-A-quiet.mp4`,
  `sound-B-bare.mp4`); **his choice is not yet recorded — ask.**
- **Sovereignty film bluntness:** he first wanted competitors hit hard, then
  said "maybe that is too blunt". Settled on: **no names, and the doubt voiced
  by the client** — "Where is my file? Who is allowed to read it? What happens
  if you are wrong?" Do not name ChatGPT/DeepSeek and do not claim providers
  train on your data (false by default for the API; UWG §6 risk; his audience
  litigates for a living). See D10.
- He dislikes long replies. **Be brief.** He has said so twice.
- He wants to be asked for feedback more often. **Ask early, ask small.**

## 7. Still open

- Ad 04 verdict (blocking — see §5).
- Sound variant choice (A quiet vs B bare).
- Reviews of ads 03 and 05.
- **Voiceover.** None recorded. Silent-first by decision. Two routes: write the
  script to the existing cut (no re-render), or drive the cut from word-level
  TTS timestamps (~3 min re-render, and re-recording then re-syncs itself).
  Andreas leans toward a calm female voice — low, unhurried, slightly dry,
  closer to air-traffic control than a brand narrator. Native German speaker
  for the German versions, not a multilingual model.
- German for ads 03, 04, 05 (ad 01's German is done and verified).
- 1:1 and 16:9 recompositions (layout variants, not crops).
- **His GDPR analysis** at `~/Coding Projects/SeeingStone/docs/Analysis of GDPR/`
  was never readable from the cloud container. On local it should be — read it
  and check ad 05's routing claims against it.
- Pitch gaps not yet filmed: employee departure / institutional memory loss
  (the SME segment's real fear), access control (the only technical difference
  between solo and team tiers, so the whole upsell path).

## 8. How to run it

```bash
node bin/capture.mjs --film anniversary --lang en   # omit --film for ad 01
bin/encode.sh .frames/anniversary/en out/x.mp4
node bin/sound.mjs --film anniversary --frames 1300 --out out/x.wav \
     --roomtone 0.25 --signature 0.3                # 0 disables either
bin/mux.sh out/x.mp4 out/x.wav out/x-sound.mp4
```

Films live in `src/scene-<film>.js` + `src/strings-<film>.<lang>.json` +
`src/render-<film>.html`. Ad 01 is the unsuffixed `scene.js` / `strings.*.json`
/ `render.html`. All copy is in the strings files — a language is a data swap,
not a second edit.

Helpers are **deliberately duplicated** per film rather than shared. These are
artworks; letting them diverge is worth more than the reuse.

**Local setup notes:** needs Node 22+, Playwright with Chromium, and ffmpeg
**with libx264**. Frames land in `.frames/` (gitignored, ~260 MB, disposable).
If Playwright is global, symlink it into `node_modules/` — ESM ignores
`NODE_PATH`.

## 9. First thing to do when you spawn

1. Confirm the toolchain runs: render a few frames of ad 01 and look at them.
2. Ask Andreas the §5 question and the sound-variant question. Small, two
   questions, not eight.
3. Do not start a new film until you have his verdict.
