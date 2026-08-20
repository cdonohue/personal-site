# The desk scene

Pixel art for the home page hero. Six Aseprite sprites, exported to PNG + JSON,
composited on a canvas at runtime by `src/scene/`.

The art and the code meet at exactly two places: **slice names** and **tag
names**. Everything else on either side can change freely. Rename a slice or a
tag and the page throws — deliberately, because a silently missing slice draws
at 0,0 and looks like a rendering bug rather than a naming one.

---

## Conventions

These are load-bearing. Breaking one tends to produce art that looks fine in
Aseprite and wrong on the page.

**A frame index is a state, not a point in time.** `digits`, `switch`, `weather`
and `character` are all lookup tables — frame 3 means "condition 3", not "0.3
seconds in". Only `screen` animates as a timeline, and even there each tag is a
separate state. This is why the sheets are small: ten weather frames cover five
conditions day and night, rather than ten frames of one condition moving.

**Motion comes from scrolling, not from more frames.** The weather frames are
drawn to tile seamlessly in both axes, and the runtime scrolls them at several
speeds at once for parallax. One drawing animates at any speed, and changing the
rain's pace is a number in `render.ts` rather than a redraw.

**Off states are frames.** The light switch has an off frame, the monitor has a
power-off sequence ending on the exact colour of the dark plate baked into
`room.png`. Nothing is "just don't draw it" — that path always ends up with a
one-frame flash where the hand-off happens.

**Anything that moves is its own sprite.** `room.aseprite` is a static plate.
Moving parts are composited at a named slice, which is what keeps the room file
editable without re-exporting everything.

---

## Pipeline

```
art/*.aseprite  ──►  export.sh              ──►  art/*.png + art/*.json
                └─►  vite-plugin-aseprite.ts ─►  art/room.<layer>.png
                                                 art/room.<condition>-<phase>.png
```

`export.sh` does whole sprites and is incremental; pass `--force` to rebuild
regardless of mtime.

The plugin is a Vite plugin and keeps that name, but there is no `vite.config.ts`
to look for: Astro runs on Vite, so it is registered under `vite.plugins` in
`astro.config.mjs`. It re-exports on save in dev and shells out to the two
scripts in `scripts/`:

- **`export-layer.lua`** — one layer alone. Needed because `--layer` combined
  with `--all-layers` silently exports the whole sprite instead of erroring.
- **`export-variant.lua`** — a specific show/hide combination, flattened.

Those two are build dependencies. **Do not delete them.**

The generated `room.*.png` files are committed. They are the fallback when
Aseprite is not installed, so CI and any clone can build without it. Wiping
`art/*.png` and running `export.sh` will *not* bring them back — only the plugin
produces them.

---

## The sprites

### `room.aseprite` — 192×108, the static plate

Slices, which are the contract with `render.ts`:

| slice | x,y | size |
|---|---|---|
| `monitor-screen` | 73,29 | 46×26 |
| `clock-screen` | 125,54 | 21×7 |
| `light-switch` | 10,45 | 4×6 |
| `character` | 76,22 | 40×74 |

Newly created slices have no colour assigned and are invisible in the GUI even
though they exist — assign one or you will think the slice failed to save.

Layers exported separately, because each needs its own opacity at runtime:

- `dark` — the lighting mask, faded by the room light and the hour
- `desk-front` — the desk lip, redrawn *over* the character
- `desk-items` — what rests on the desk

Sky colour lives in this file as full-canvas `WEATHER` layers, one per
condition-phase, exported as ten flattened variants. **Flattened, not masked:**
the wall occludes the sky everywhere except the glass, and flattening in
Aseprite is what keeps the mic arm and desk edge in front of the window.
Masking at runtime put the sky over them.

The glass mask itself is derived at runtime by diffing `clear-day` against
`clear-night` — no authored asset, so it cannot go stale when the window moves.

### `screen.aseprite` — 46×26, the monitor

| tag | frames |
|---|---|
| `ai-work` | 0–95 |
| `power-on` | 96–102 |
| `power-off` | 103–108 |
| `cube` | 109–140 |
| `game` | 141–188 |
| `bounce` | 189–268 |

Frame numbers move when a tag grows, and that is safe **only** because nothing
addresses this sheet by index — `render.ts` asks for tags by name. Keep it that
way.

**At 46×26 the panel carries shape, not detail.** About 1200 pixels. Two
screensaver attempts failed identically here — Matrix rain, then a starfield —
because anything built from many small independent elements resolves to noise at
this size. The wireframe cube works because it is one continuous form.

Power on/off is a CRT collapse: the picture squeezes vertically to a bright
one-pixel line, the line shrinks to a stub, the stub goes out. No white flash at
the start of power-off — the picture is already there, so flashing first reads as
a glitch. Colours used: plate `32,32,32`, collapsing band `120,128,145`, the line
`225,232,245`, 45 ms a frame. The last off frame matches the dark plate in
`room.png` exactly, so there is no pop at the hand-off.

`cube` and `bounce` are interchangeable — `SCREENSAVER_TAGS` in
`render.ts` lists them and the mount picks one per visit, so a third is a tag
plus one entry. Per visit, not per idle: swapping while someone is watching
reads as a glitch. Both are named for what they show — a tag called
`screensaver` sitting next to `bounce` reads as the category rather than a
peer, and the category is what the list is for.

`bounce` is exact the same way. A 6×6 shape travels 40px across and 20px down,
so at 1px/frame the periods are 80 and 40 — LCM 80, and frame 80 is frame 0.
The vertical phase is offset by a quarter period **on purpose**: started
together, both axes reverse on frames 0 and 40 and the shape corners every 3.6
seconds, which is the one thing a bouncing logo should almost never do. Offset,
the turns land on 0/40 and 10/30/50/70, never coincide, and it near-misses
forever. Six bounces a loop and six colours, so the colour cycle closes too.

**The sheet is a single row**, so frames are capped by texture width — browsers
give out around 16384px, which at 46px a frame is about 356 frames. It is at
269, so roughly 87 frames of headroom.

The game loop is exact rather than tuned: ground repeats over 96 px scrolled 2
px/frame, hills over 48 px at half speed, a 4-pose runner — all dividing 48
frames. The jump is simulated, not keyframed, and two bugs are worth
remembering: testing `y >= surface` alone snaps the runner onto any ledge he is
level with, and requiring a strict crossing makes him fall through the world
because Euler integration overshoots by a fraction of a pixel. Both are needed —
a crossing test *plus* a small landing tolerance.

### `digits.aseprite` — Indexed, 13 frames

Frames 0–9 are digits, 10 is the lit colon, 11 the dim colon, 12 blank.

**Indexed mode is the point.** Palette entries in use:

| entry | meaning |
|---|---|
| 21 | unlit segment (the burn-in ghost) |
| 23 | colon, lit |
| 25 | segment, lit |

Editing a palette entry restyles every frame at once. Repainting with a new
brush colour is the wrong move — it adds a second entry and splits the look.

Note that clicking a swatch in the Aseprite GUI sets the *foreground colour*; it
does not edit the entry. It is entirely possible to spend a while recolouring
and change nothing.

### `weather.aseprite` — 10 frames

Frames 0–4 are `clear, overcast, fog, rain, snow` by day; 5–9 are the same
conditions at night, in the same order as `WEATHER_CONDITIONS` in `toggles.ts`.

**Night is different art, not a tint.** Clear night has no clouds at all — it has
stars, and no amount of darkening a cloud turns it into one. Relatedly: clouds
drift, stars do not. A star field sliding sideways reads as the room turning
rather than as weather.

Everything is drawn to wrap — a shape crossing an edge is redrawn on the
opposite side — because the runtime tiles these.

This sprite is sky only, clipped to the glass at runtime.

### `character.aseprite` — 40×74

| tag | frame |
|---|---|
| `idle` | 0 |
| `away` | 1 |

Layers: `character`, `hat`, `chair`. The `away` frame is the same chair with the
person's layers absent.

**The chair cel is linked across both frames**, so editing the chair updates the
empty chair too. If you rebuild this frame by copying, link the cels afterwards
(select both in the timeline, Frame ▸ Link Cels) — an unlinked copy drifts
silently the moment you touch the chair.

The height is not arbitrary: **slice y + sprite height must equal 96**, the
floor line in `room.png`, or the chair does not touch the ground. Currently
22 + 74 = 96. It was 42 + 54 before the canvas was grown to leave drawing room
above; at 46 tall the chair floated nine pixels above the floor. Resize the
canvas from the top and move the slice up by the same amount.

The chair is in *front* of the desk, between the camera and everything else, so
it draws last and covers the desk lip and the lower monitor. An earlier version
put the figure behind the desk, where the bezel and keyboard left a three-row
slot and about fifteen pixels of character survived.

`PRESENCE_TAG` in `render.ts` maps presence states to tag names, and includes
`type` and `empty` which **do not exist in the sheet yet**. A missing tag falls
back to playing the whole sheet, which cycles idle and away and flickers the
person in and out. Draw the pose and tag it before using those states.

### `switch.aseprite` — 4×6, 2 frames

Frame 0 off, frame 1 on.

---

## Traps

**Appending frames extends the last tag.** Any tag ending on what was the final
frame silently grows to cover the new ones. This cost three separate debugging
sessions on `screen.aseprite`. Snapshot tag ranges before appending and restore
them after.

**Runtime values live in `src/scene/render.ts`, not here.** Rain parallax passes,
fog and snow layering, the dawn/dusk curve, the lighting wash, glyph spacing —
all constants there, all commented. Deliberately not duplicated into this file,
where they would go stale.

---

## History

The art was originally generated by ~20 Lua scripts, removed once the
`.aseprite` files became the source of truth. The numbers above are extracted
from them; the scripts themselves are recoverable if a full regeneration is ever
wanted:

```sh
git log --diff-filter=D --name-only -- art/scripts   # find the removing commit
git show <commit>^:art/scripts/create-weather.lua    # read one back
```

Retuning the art is now GUI work rather than a parameter change. That is the
accepted trade — the scripts were scaffolding for art that is now drawn.
