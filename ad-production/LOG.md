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

### Ad 03 "The Chain" — WRITTEN BUT UNVERIFIED

`src/scene-chain.js` and `src/strings-chain.en.json` are committed, but the
film has **never been rendered**. There is no `render-chain.html`, not one frame
has been captured, and nothing has been looked at. Treat it as a draft that has
not met a compiler, let alone an eye — on both previous films the first render
needed several rounds of correction, and this one has had none.

Design intent: six fragments, six sources, fourteen months, walked backwards
from the newest, with the chain jumping to a rejection fourteen months earlier.
The honesty constraint is load-bearing — every fragment arrives in the user's
own archive; nothing observes the counterparty.

To pick it up: copy `src/render-introduction.html` to `src/render-chain.html`,
point its script tag at `scene-chain.js`, then
`node bin/capture.mjs --film chain --lang en --only 80,300,500,700,900,1000,1200`
and look at the frames before rendering all 1440.

---

## 2026-08-09 (later) — Direction, reviews, and the backlog

Andreas' input arrives fast and unstructured. This section keeps it in order,
with the reasoning behind each experiment, so nothing is lost between sessions.

### D1 · Reference brought in: polar.news (Instagram)

Andreas supplied a transcript and asked for the Tim story in that register.
What that account actually does, extracted:

1. **Timestamps as the spine.** Not "weeks of chasing" but 03:45:30, 03:46,
   03:50. Precision manufactures authority before any claim is made.
2. **Flat numerals, no adjectives.** "290,000 hectares." "358 missiles."
3. **Comparative framing.** "In Europe, it ranks 19th." "Everything you have
   just watched is 36% of it."
4. **The argument from absence.** Show what is recorded beside what is not, and
   let the viewer close the gap. "It knows the minute it stopped seeing the
   missile. It has never said what time the missile hit the ground."
5. **Circular close.** Ends on the timestamp it opened on.
6. Audio: ambient, no music, subtle beeps and clicks, plus a signature sting.

### D2 · Experiment: ad 02 "The Introduction" in that register — FAILED

Built and delivered. Andreas' review, in his words: *hard to follow, a little
too random; so many unread emails just looks avoidable; were the emails sent by
you? What was the point — what was the pain? Unclear.*

**He is right, and the diagnosis matters more than the film.**

- **No stake.** The film never says what it costs to not reach Tim. No deal
  size, no deadline, no consequence. Ad 01 prices its pain exactly — forty
  minutes, in front of a client, credibility gone. Ad 02 prices nothing.
- **Therefore the viewer blames the protagonist.** Seven unanswered messages
  with no stake attached reads as "this person is bad at their job," not as
  suffering. Sympathy inverts.
- **Root cause: the borrowed structure was misapplied.** Argument-from-absence
  works in journalism because the stake is already established — a missile
  landed in a NATO country. It is a **second-act device**. Used as a first act
  it has nothing to bite on. The register was right; the position was wrong.
- The discovery (Max co-founded with Tim) therefore lands as trivia rather than
  as relief.

### D3 · Principle extracted — applies to every film from here

**Pain must be a loss the viewer can price.** A number, a deadline, or a
humiliation in front of someone whose opinion matters. If a film cannot state
in one sentence what is lost and when, it has no first act. Show the pain
before anything else, then let structure and restraint do their work.

Corollary: the polar register is earned, not free. Deploy it *after* the stake
lands, never instead of it.

### D4 · Biggest selling point, reasoned backwards

Not the intelligence — the **permission**. The pitch already contains the sale:
*"This is exactly what I need. [...] call me when you solve GDPR compliance."*
The product is wanted; the blocker is data sovereignty. A mediator or lawyer
cannot put privileged client material into a cloud AI without asking the client
for permission, and the asking is itself a trust cost (the pitch names this:
*"Sorge, Mandanten um Erlaubnis für externe Datenverarbeitung bitten zu
müssen"*).

So competitors are not worse for this buyer. They are **unusable**. That is a
permission advantage, not a feature advantage.

**Consequence for the films: value and sovereignty must land in the same
breath, never in separate films.** Ad 01 does this correctly and wordlessly by
pinning EGRESS at 0 while the counters race.

### D5 · Gaps found on a re-read of the pitch

Not yet covered by any film, ranked by how much of the pitch leans on them:

1. **Sovereignty as its own film.** "It Never Leaves" is storyboarded, unbuilt,
   and by D4 it is the most important one.
2. **Employee departure.** *"Mitarbeiterabgang — Kontext geht dauerhaft
   verloren."* The KMU segment's central fear; nothing touches it. Strong
   priced pain available: the person leaves, the context leaves, and the cost
   is paid months later by someone who never met them.
3. **Access control.** The pitch states it is the *only* technical difference
   between solo and team product. It is the entire upsell path, and invisible.
4. **Breadth of sources.** Notes, paper, PDFs, PowerPoints sent as attachments,
   calendar entries. The 55% dark-data claim needs to be *seen*.
5. **Proposed follow-ups.** *"ohne vom System vorgeschlagene Follow-ups
   verpufft soziales Kapital ungenutzt."*

### D6 · Andreas' requested films (his numbering preserved)

1. **Keep old contacts warm.** Wish a colleague from six years ago a happy
   anniversary because the system remembered. **The human triggers the message**
   — this is a hard constraint, not a detail; the product must never look like
   an autopilot that fakes warmth. His framing: as automation rises, human
   capital — relationships, trust — becomes *more* valuable, not less.
2. **An agent combing vast data for an opening.**
   - 2.1 find a new lead nobody was looking for;
   - 2.2 "I already know this person — help me actually reach them" via an old
     colleague or a shared project.
   Both should show breadth: internal PDFs, PowerPoints sent as attachments,
   old calendar entries.
3. Re-read pitch and website for what is missing → answered in D5.

**Observation worth flagging:** his (1) and the existing ad 02 are the same
story from opposite ends — one keeps a relationship warm, the other cashes in a
relationship already gone cold. Ad 02 is the "cold" version and it failed on
stakes. The "warm" version has an easier emotional job and a clearer stake
(*this person mattered to you and you forgot*), so it is likely the better film
and should probably be built first.

### D7 · Backlog, in build order

| # | Film | Why here |
|---|---|---|
| 1 | **Rebuild ad 02** with a priced stake in the first act | Known failure, known fix, material already built |
| 2 | **"It Never Leaves"** — sovereignty | D4 says it is the biggest selling point and it does not exist |
| 3 | **"The Anniversary"** — warm contacts, human-triggered | Andreas (1); easiest clear stake |
| 4 | **Ad 03 "The Chain"** — finish and verify | Written, never rendered, unverified |
| 5 | **"When Someone Leaves"** — institutional memory | Biggest uncovered pitch gap, whole KMU segment |
| 6 | **"The Opening"** — agent finds a lead across mixed sources | Andreas (2.1/2.2); also carries breadth-of-sources |

### D8 · Still unresolved

- **Sound.** Andreas likes the polar.news treatment: ambient, no music, subtle
  beeps and clicks, plus a signature audio sting. Nothing built yet. Plan is to
  synthesise it in ffmpeg so it stays original and licence-free.
- **German renders.** Strings exist for ads 01 and 02; neither has been captured
  in German, so the one-edit/two-languages claim is designed but unproven.
- **1:1 and 16:9** recompositions — layout variants, not crops.

### Ad 03 "The Chain" — WRITTEN BUT UNVERIFIED

`src/scene-chain.js` and `src/strings-chain.en.json` are committed, but the
film has **never been rendered**. There is no `render-chain.html`, not one frame
has been captured, and nothing has been looked at. Treat it as a draft that has
not met a compiler, let alone an eye — on both previous films the first render
needed several rounds of correction, and this one has had none.

Design intent: six fragments, six sources, fourteen months, walked backwards
from the newest, with the chain jumping to a rejection fourteen months earlier.
The honesty constraint is load-bearing — every fragment arrives in the user's
own archive; nothing observes the counterparty.

Note it inherits ad 02's risk: it too opens on process rather than on a priced
stake. Apply D3 before rendering it.

To pick it up: copy `src/render-introduction.html` to `src/render-chain.html`,
point its script tag at `scene-chain.js`, then
`node bin/capture.mjs --film chain --lang en --only 80,300,500,700,900,1000,1200`
and look at the frames before rendering all 1440.

### Honest assessment

The pipeline is proven and the look is right. The unproven part is whether this
converts — that needs the film in front of actual mediators and lawyers, not
more polish. The main artistic risk is that the film is *restrained to the point
of cold*; that is deliberate for this audience, but it is a bet, not a fact.
