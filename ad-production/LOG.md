# R&D Log — code-generated advertising

Running record of what was tried, what worked, and what did not. Kept so the
next run (human or agent) starts from evidence instead of guesswork.

---

## 2026-08-09 — Pilot: can we generate broadcast-quality ads from code?

**Question being tested:** can a repo produce finished video ads — no After
Effects, no stock footage, no video editor — such that changing a number or a
language is a text edit and a re-render?

**Answer so far: yes.** Pipeline runs end to end. See findings below.

### Brief as agreed

- Monochrome only. Black, white, greys. No product palette, no orange.
  The rook is the only mark.
- "Cryptically high tech, but no bullshit." Hard rule adopted: everything on
  screen must be something the system plausibly does — parse a thread, bind a
  claim to a person/date/source, resolve relations, run locally. Explicitly
  banned: invented accuracy figures, fake confidence scores, fake benchmarks,
  customer logos, Matrix-style decorative glyphs. The impressive feeling has to
  come from density and speed of real-shaped work.
- Present tense. Describe what the system does, never a roadmap or ship date.
- Silent-first: captions must carry the whole film, because LinkedIn and
  Instagram autoplay muted.
- English master, German version from the same edit.

### Source material used

Two sources, per instruction: the pitch PDF and the public website. Code was
deliberately not studied in depth — the task was art direction, not engineering.

- Pitch supplied the two usable stories: the mediator's 40 minutes of email
  archaeology, and the M&A advisor who misses the Tim/Max connection buried in
  a CV attachment.
- Website supplied the register (Bloomberg-terminal restraint, mono type,
  data density) and the rook mark. Its colour system was then deliberately
  dropped on direction.

### Environment findings (these cost time; recorded so they don't again)

| Finding | Detail |
|---|---|
| PDF text extraction is broken in this container | `pdftoppm` absent; installing `pypdf` then fails at import because the system `cryptography` package panics (`_cffi_backend` missing, pyo3 PanicException). Do not burn time here — ask for the text, or fix `cryptography` first. |
| The bundled ffmpeg is not usable for delivery | Playwright ships one at `/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux`, but it has **only** VP8 + PNG encoders and webm/image2 muxers. No H.264, no AAC, no MP4 muxer. LinkedIn needs MP4. |
| Fix: install the real one | `apt-get update && apt-get install -y --no-install-recommends ffmpeg` → 6.1.1 with libx264 and aac. `--no-install-recommends` matters: the full install pulls i965-va-driver / va-driver-all, which 404 on this mirror and abort the transaction. |
| Google Fonts is reachable through the agent proxy | Needs a browser User-Agent, otherwise the CSS comes back without woff2 URLs. Fonts are vendored into `assets/fonts/` so renders never depend on the network. |
| Inter and JetBrains Mono are variable fonts | The css2 API returns the *same* file for every requested weight. Storing one file per weight is waste — vendor one file per family and declare `font-weight: 100 900`. |
| ESM ignores `NODE_PATH` | Playwright is installed globally at `/opt/node22/lib/node_modules`, but `import { chromium } from 'playwright'` in an `.mjs` cannot see it. Symlink into a local `node_modules/` instead. |
| Frame capture throughput | ~7 fps at 1080×1920 via `page.screenshot()`. 990 frames ≈ 2m20s. Fast enough that optimising it is not worth doing yet. |

### Architecture decisions

**Canvas 2D, driven by a pure `draw(ctx, frame, strings)` function.**
Considered and rejected:

- *Remotion* — the obvious choice and genuinely good, but it is a large npm
  install for a pipeline whose only real needs are "draw pixels" and "encode".
  Revisit if the ads start needing React component reuse from the site.
- *Manim* — wrong idiom. Built for mathematical exposition, not UI and type.
- *DOM + CSS animation* — better typography ergonomics, much worse determinism,
  and screenshotting hundreds of animated DOM nodes is slower than canvas.

The decisive property is **purity**: no `requestAnimationFrame`, no `Date.now()`,
no `Math.random()`. Frame *n* always produces identical pixels. This buys
resumable renders, trivially parallel renders, and the ability to re-render a
single frame to inspect it. All randomness goes through a seeded `mulberry32`.

**Strings fully externalised.** `strings.en.json` / `strings.de.json` hold every
word, plus the archive sender/subject pools and the entity-tagged stream lines.
The German version is a data swap, not a second edit. Entity spans use an
inline `[[typeIndex|text]]` syntax so a non-programmer can edit them.

### What the film does (Ad 01, "40 Minutes", 33s, 1080×1920)

| Act | Frames | Content |
|---|---|---|
| QUERY | 0–135 | The question typed against black. Scale of the archive stated. |
| SEARCH | 135–435 | Archive scrolls, accelerating past legibility. Clock runs to 40:00. False positives light up and are struck through. |
| FAIL | 435–510 | Everything stops. The clock detaches, takes the frame: **40:00 · NOT FOUND**. |
| MARK | 510–570 | Black beat, then the rook wipes in. |
| SYSTEM | 570–810 | Semantic space settles into clusters with edges; raw text streams with entity spans igniting and labelling; counters over the user's own corpus. EGRESS is pinned at 0 — the privacy claim made without a sentence. |
| ANSWER | 810–900 | One quote, with full provenance: thread, position, author, date, and that it never left the machine. Clock reads 00:04. |
| END | 900–990 | Rook, tagline, URL. |

The whole film hangs on one cut: **40:00 → 00:04**.

### Iterations that were needed (first render was not right)

1. Query text sat too high in a 9:16 frame — moved down ~230px for optical
   centring. Vertical composition is not landscape composition.
2. `SCANNED` counter was derived from rows drawn on screen, so it read "6" while
   the clock said 01:38. Nonsense. Rebound to the whole 38,417-document corpus.
3. Archive row numbers now count *down* from 38,417, matching the walk backwards
   in time, instead of counting up from zero.
4. Dates went from 2-digit to full ISO years — reads as an archive, not a UI.
5. The semantic point cloud was drawn behind panels that covered ~80% of it, so
   it read as dust. Given its own full-width band with the panels moved below;
   points brightened and enlarged, edges strengthened. This was the single
   biggest quality jump in the film.
6. Panels got 0.9-opacity backings plus top/bottom gradient fades, so streaming
   lines enter and leave rather than being sliced mid-glyph.
7. Counters used `Math.floor`, so RELATIONS settled on 12,393 instead of 12,394.
   Off-by-one on a number held on screen for seconds is exactly the kind of
   detail that reads as sloppy. Now `Math.round`.

### Open / not yet done

- **Encode step not yet run.** 990 English frames are captured; `bin/encode.sh`
  exists but had not been executed when work was halted. No MP4 exists yet.
- German render not yet captured.
- 1:1 and 16:9 recompositions not built (they need layout variants, not crops).
- Voiceover: none. Silent-first by decision. Script and a drop-in TTS step are
  still to be written. Intended design is that the TTS call returns *word-level
  timestamps*, and captions/cuts are driven from those, so re-recording the VO
  in another voice or language re-syncs the edit automatically.
- Concepts ② "Two Degrees" (the Tim/Max weak-tie graph) and ③ "It Never Leaves"
  (the GDPR objection piece) are storyboarded but unbuilt.

### Honest assessment

The pipeline is proven and the look is right. The unproven part is whether this
converts — that needs the film in front of actual mediators and lawyers, not
more polish. The main artistic risk is that the film is *restrained to the point
of cold*; that is deliberate for this audience, but it is a bet, not a fact.
