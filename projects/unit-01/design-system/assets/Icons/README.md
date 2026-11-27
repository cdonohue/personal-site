# Icons

Solid geometric glyphs on a 24px grid: 2px strokes are drawn as filled shapes, corners square, no rounding. Single ink `#111111` (the light-theme `ink`).

- `play`, `stop`, `record` — transport. `record` is the only glyph that may sit on a signal Key.
- `plus`, `minus` — increment / add / remove.
- `arrow-right` — next, go, open.
- `menu`, `close` — navigation.

In components, inline the path inside the Key `glyph` slot with `fill: currentColor` so it follows the Key's text colour. As `<img>`, invert it on Graphite (`filter: invert(1)`). New icons: draw on the same grid from rectangles, circles and 45° cuts only.
