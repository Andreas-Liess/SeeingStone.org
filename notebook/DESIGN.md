---
name: Black Notebook
description: "Near-black notebook pages, one gold ink, ruled writing lines. Every question is set in an editorial serif; everything around it stays quiet."
built-from:
  - "Linear: near-black canvas, surface ladder, 1px hairlines instead of shadows"
  - "Wired and Oura: high-contrast editorial serif for the words that matter"
  - "Bugatti: small uppercase letterspaced labels"
  - "The 10 'black notebook' slides: gold ink, ruled paper, the wording of every question"
colors:
  canvas: "#050506"
  surface-1: "#0e0e10"
  surface-2: "#151517"
  hairline: "#232327"
  hairline-strong: "#323238"
  rule: "rgba(255,255,255,0.07)"
  ink: "#f4f2ec"
  ink-muted: "#a9a69d"
  ink-subtle: "#85837b"
  gold: "#e2bf4f"
  on-gold: "#141005"
  danger: "#ef7b70"
colors-light:
  canvas: "#f5f3ec"
  surface-1: "#fffdf8"
  hairline: "#dcd8cc"
  ink: "#121214"
  ink-muted: "#4f4d47"
  ink-subtle: "#6b6860"
  gold: "#866700"
typography:
  display: "Instrument Serif 400, italic for prefixes such as 'Specific goals:'"
  text: "Inter (variable)"
  label: "Inter 600, 11.5px, uppercase, letter-spacing 0.14em"
  scale: { app-title: 48, question: 35, info-title: 50, quote: 36, today-question: 30, history-question: 19, body: 16, writing: "17 on a 32px line", label: 11.5 }
radius: { card: 18, button: 12, entry: 16 }
---

## Overview

A black notebook you write in. The page is almost black, the only colour is gold ink, and the writing area has
ruled lines. The questions from the method are the most important thing on every screen, so they get the
strongest type: a tall editorial serif. Everything else (labels, counters, dates) is small, letterspaced and quiet.

## Rules

1. **Questions are the hero.** Every question uses the serif: 35px on the question screen, 30px on Today,
   19px italic in History. Nothing else on the screen is that large.
2. **Gold means "this matters" or "do this".** Step names, the primary button, the progress ribbon, answered dots.
   Never for decoration.
3. **No shadows on cards.** Separate with 1px hairlines and the surface ladder (canvas → surface-1 → surface-2).
   The only shadow is under the floating Note button.
4. **Writing happens on ruled lines.** 17px Inter on a 32px line pitch, hairline rules that scroll with the text.
5. **Labels whisper.** Dates, "Write down:", "Question 2 of 4": uppercase, letterspaced, subtle ink.
6. **The method's wording stays verbatim.** Questions, step titles and goals are copied from the slides word for word.

## Components

| Component | Spec |
| --- | --- |
| Primary button | gold fill, on-gold text, 52px high, radius 12, weight 600 |
| Secondary button | transparent, 1px hairline-strong border, ink text |
| Card | surface-1, 1px hairline, radius 18, padding 22/20 |
| Progress ribbon | 2px hairline track, gold fill |
| Ruled paper | textarea without border, rules every 32px, gold caret |
| Info screen | step name in gold, title in serif 50px gold, or the text as a 36px serif quote |
| Tab bar | surface-1, hairline top border, uppercase 10.5px labels, gold when active |

## Don't

- Don't add a second accent colour.
- Don't put the serif on buttons, labels or the writing area.
- Don't paraphrase the questions.
