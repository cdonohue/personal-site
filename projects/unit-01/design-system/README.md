# Unit 01

A design system for a suite of small personal apps that work like pocket hardware and read like a modern art museum's walls: keycaps, knobs and a little LCD, set in stark black and white with heavy Franklin-style type, bold black rules, and one hot orange for the thing that's live.

It's an original system with two influences: the industrial-electronics school of product design (honest controls, numbered labels, playful hardware) and the modern-museum graphic tradition (one Franklin Gothic-style typeface used almost everywhere, a black-and-white core, type as the image). It borrows no brand's marks, typefaces, names or exact specs.

## Principles

1. **Every control looks like what it does.** A Key presses (it moves 2px and loses its edge shadow). A Knob turns. A Switch slides. No ambiguous rectangles.
2. **One typeface does the talking.** Libre Franklin sets every word: headlines, body, labels, keys. Mono is only for the instrument layer: numbers that tick on their own, key indices, LCD readouts.
3. **Black, white, one orange.** The wall is white (Gallery) or black (Night); text and rules are pure ink. `signal` orange marks the single most live thing on screen. If two things are orange, one of them is wrong.
4. **Type is the image.** App names and key numbers are set big and heavy (`display-xl`, 800, tight tracking): no illustrations or decoration to compete with them.
5. **Rules, not boxes.** Sections open with a 2px `rule` and sit straight on the wall: no panel fills, no borders around modules, no rounded cards.
6. **Flat and machined.** No gradients, no blur, no drop shadows except the keycap edge. Keys and selectors are square solid blocks with no outline; their face (`key`, or a function colour) and the 2px keycap edge make them read as pressable.
7. **Label everything, numbered.** Every module gets an uppercase Label numbered in reading order (`01 PATTERN`, `02 TEMPO`).

## Voice

- Labels: one or two words, UPPERCASE, no punctuation — `TEMPO`, `NEW SESSION`, `SYNC`.
- Titles: one plain noun, sentence case — "Metronome", "Tuner".
- Body copy: sentence case, short, plain. Say what happens: "Hold shift to fine-tune any knob."
- Numbers over adjectives: "3 / 8 steps", not "a few steps left".
- No exclamation marks, no emoji, no "Oops". Errors state the fact and the fix: "No connection. Retrying in 10 s."

## Colour

Two themes: **Gallery** (white wall, the default) and **Night** (black wall). `chassis` and `panel` are the same colour: modules aren't boxes, so they sit on the wall itself. `panel-sunk` is for wells (inputs, tracks, stepper readouts). Plain Keys and Selector options have their own light-grey (Night: dark-grey) `key` face. The `lcd` screen is black in both themes; in Night it keeps a `line` edge so it still reads as a screen.

| Role | Token | Rule |
| --- | --- | --- |
| Text | `ink`, `ink-muted` | Pure black / white for primary text; muted ≥5.5:1 everywhere |
| Dividers | `rule` (2px, = ink) | Opens every Panel and section. The system's main structure |
| Hairlines | `line` | Unlit LEDs, ticks, a Display's edge on black. Decoration only |
| Accent | `signal` | Fill only. One per screen. Text on it is `on-signal` (black), never white |
| Accent text | `signal-text` | When a word itself must be orange (an armed Label) |
| Function keys | `blue`, `yellow` | Modifiers and secondary modes. Fills only, with `on-blue` / `on-yellow` |
| Focus | `focus` | 2px solid ring, 2px offset, on every interactive element |

## Type

- **Libre Franklin** (`--font-sans`) — an open-source Franklin Gothic revival, the family the modern-museum tradition is built on. Display sizes at 800 with tight negative tracking; titles 700; body 400; labels and Key text 700 uppercase at 11px with `0.06em` tracking. Panel titles are the label style at 13px in ink.
- **IBM Plex Mono** (`--font-mono`) — instrument layer only: `readout` (timers, counters on a Display), `value` (Knob and Fader readouts), `micro` (Key indices). Always tabular and zero-padded.

Rule of thumb: if a person *reads* it, Franklin. If a machine *counts* it, mono.

Text fields, selects and text areas are never under 16px (`input` style). Smaller ones make iOS zoom the whole page on focus. Never stop zoom with `maximum-scale`; size the field instead.

## Shape & space

- Square by default: Keys, Selectors, Panels, Displays and wells are `radius-0`. `radius-sm` (2px) is only for Switch parts; `radius-full` only for Knobs and LEDs. Nothing you press is rounded.
- Spacing is a 4px grid: `space-1` 4 · `space-2` 8 · `space-3` 12 · `space-4` 16 · `space-6` 24 · `space-8` 32 · `space-12` 48.
- Lay screens out like a gallery wall: columns of rule-topped modules with generous gutters (`space-4`–`space-8`), a heavy title top-left, and one big black Display as the centrepiece.

## Motion

Mechanical, not bouncy: 60–80ms `linear` for presses and switch throws; nothing over 150ms; no spring or overshoot. Respect `prefers-reduced-motion` by dropping transitions entirely.

## Iconography

Solid geometric glyphs on a 24px grid, built from rectangles, circles and 45° cuts — see the Icons asset group. On a Key they go in the `glyph` slot and inherit the Key's text colour.

## Logo

There's no logo: each app shows its name as a heavy Libre Franklin title with a small mono index before it (`01 Metronome`, `02 Tuner`). The suite name `Unit 01` is set the same way in `display-xl`.

## Components

`Key`, `Led`, `Label`, `Panel`, `Display`, `Knob`, `Fader`, `Switch`, `Selector`, `Field` — in `components/bundle.js` as `window.Unit`, styled by `components/bundle.css` (which also loads both fonts from Google Fonts). They expect React 18 on the page and the tokens' CSS custom properties (`tokens.css`). Set `data-theme="dark"` on `<html>` for Night.

A typical screen: a heavy title top-left, a big black Display with the screen's key number, then rule-topped Panels holding Knobs, Faders, Switches and Selectors, with a row of Keys at the bottom — one of them signal.
