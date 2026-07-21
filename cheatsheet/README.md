# Dynamical Systems — structural cheatsheet

A visual cheatsheet for the TUM Dynamical Systems course (lecture notes by C. Kühn),
designed in the style of the "algebraic structures" poster: numbered **property rows**
with pastel **notion columns** whose vertical span encodes exactly which properties hold
(e.g. stable ⊂ asymptotically stable, ergodic ⊂ weak mixing ⊂ strong mixing), plus the
big bridging theorems (Hartman–Grobman, Smale–Birkhoff, Birkhoff ergodic) drawn as
connections between panels.

## Outputs (in `out/`)

- `dynamical-systems-cheatsheet.pdf` — single-page poster, ~114 × 60 cm, vector
- `dynamical-systems-cheatsheet-a3.pdf` — the same panels regrouped on 7 A3 landscape pages
- `dynamical-systems-cheatsheet.html` — self-contained HTML (KaTeX fonts inlined), open in any browser

## Building

```sh
npm install          # katex + playwright-core (Chromium must be available)
node build.mjs       # content.html + styles.css -> out/*.html (KaTeX rendered at build time)
node render.mjs      # out/*.html -> PDFs + PNG previews (uses headless Chromium)
```

`render.mjs` expects a Chromium binary at `/opt/pw-browsers/chromium`; adjust
`executablePath` (or point it at any installed Chrome) if building elsewhere.

## Editing

All content lives in `content.html` (panels, with math in `$...$` / `$$...$$`);
layout and the lattice/zoo/pipeline components are in `styles.css`. The A3 page
grouping is the `A3_PAGES` table in `build.mjs`.
