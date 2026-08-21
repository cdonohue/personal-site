# The desk scene

Pixel art for the home page hero. Seven Aseprite sprites, exported to PNG +
JSON, composited on a canvas at runtime by `src/scene/`.

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

| slice | x,y | size | what uses it |
|---|---|---|---|
| `monitor-screen` | 73,29 | 46×26 | where the `screen-*` sheets are composited |
| `clock-screen` | 125,54 | 21×7 | where the digits go |
| `light-switch` | 10,45 | 4×6 | drawn, and a hit target |
| `desk-controls` | 140,68 | 19×5 | hit target only; rides the desk |
| `power-outlet` | 10,84 | 4×7 | hit target only |
| `character` | 76,10 | 40×86 | anchors both the person and the chair |

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

### `screen-*.aseprite` — 46×26, the monitor

**One file per screen, named after it.** No tags: the file is the name, and the
runtime plays it end to end.

| file | frames | ms | kind |
|---|---|---|---|
| `screen-ai-work` | 96 | 9600 | scene |
| `screen-game` | 48 | 3360 | scene |
| `screen-cube` | 32 | 2880 | screensaver |
| `screen-bounce` | 80 | 7200 | screensaver |
| `screen-aquarium` | 58 | 5220 | screensaver |
| `screen-fireworks` | 48 | 4320 | screensaver |
| `screen-ribbons` | 48 | 3840 | screensaver |
| `screen-orbit` | 48 | 4320 | screensaver |
| `screen-radar` | 48 | 3600 | screensaver |
| `screen-comet` | 48 | 3600 | screensaver |
| `screen-hypno` | 100 | 7500 | screensaver |
| `screen-power` | 13 | 585 | transitions, tagged `power-on` / `power-off` |

These were one 269-frame sheet until the width forced the issue. An Aseprite
sheet exported this way is **a single row**, so its width is the sum of
everything on it: six screens came to 12,374px against a limit usually quoted as
16,384, leaving room for about one more. Two more would not have fitted.

Splitting bought three things beyond the ceiling:

- **Appending frames can no longer extend a neighbouring tag**, because there
  are no neighbours. That trap cost three separate debugging sessions on the
  old sheet. It still applies to `screen-power`, which holds two.
- **Only the screen playing is fetched.** The monitor used to cost every visitor
  85 KB of all six; it is now 16–34 KB, and the twelfth screen will not be paid
  for by people who never see it.
- Saving one screen stops re-exporting the other 173 frames.

`screen-power` keeps its two tags because the pair only makes sense together:
the last frame of `power-off` is the exact colour of the dark plate in
`room.png`, and `power-on` is that read backwards.

**Each file carries only the layers it draws with.** `screen-ai-work` has `bg`,
`chat` and `browser`; the rest are one flat `bg`. Carving them out of the
combined sheet took every layer along, so each screensaver arrived holding two
empty ones — which export identically, are invisible in the PNG, and are
therefore a standing invitation to paint into the wrong layer. A new screen
wants whatever it needs and nothing else.

**Adding a screen is a file here and one entry in one list.** `render.ts` holds
three, and no fourth place names a screen:

| list | when it plays |
|---|---|
| `WORK_TAGS` | somebody at the desk, likelier during working hours |
| `PLAY_TAGS` | somebody at the desk, likelier outside them |
| `SCREENSAVER_TAGS` | nobody there |

`src/activity.ts` picks from one of the three and hands the name over; nothing
downstream cares which it got, because `MonitorPhase` is power only and the tag
travels beside it. The split is in `render.ts` rather than in the schedule
because whether a drawing shows work is a fact about the drawing. *When* each
gets used is the schedule's business, and that stays out there.

Two things this replaced, both of which cost more than one edit. The phase used
to be `'on' | 'game' | 'idle' | 'off'`, so a scene meant editing a union type, a
lookup table and every expression that asked whether the screen was lit by
listing the lit states out loud. And the scene names briefly lived in two
places, `SCREEN_TAGS` here and a work/play split in the schedule, which would
have drifted the first time one was edited without the other.

The runtime falls back to the first scene if it is handed a name with no file,
rather than throwing the way a missing slice does. A screen name is the one part
of this contract chosen at runtime, so one that has not been drawn should cost
the wrong picture rather than the page — and the same path covers a screen that
simply has not finished loading.

The runtime falls back to the first scene if it is handed a tag this sheet does
not have, rather than throwing the way a missing slice does. Screen content is
the one part of the contract a host chooses at runtime, so a name that has not
been drawn yet should show the wrong picture rather than take the page down.

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

All screensavers are interchangeable, and one is picked per visit rather than
per idle: swapping while somebody is watching reads as a glitch. Each is named
for what it shows — a tag called `screensaver` sitting next to `bounce` reads as
the category rather than a peer, and the category is what the list is for.

The seven-screen expansion takes its cue from early graphical screensaver packs:
limited palettes, unapologetically synthetic motion, and one readable subject
per loop. It borrows that grammar rather than any specific module. At 46×26,
the aquarium, fireworks, ribbons, orbit, radar, comet and hypno loops each have
to read as a silhouette before their motion does any work.

`aquarium` closes on 58 frames. Every fish crosses a 58-pixel wrapped path;
the bubbles use a 29-frame rise, exactly half that period, and reset above the
panel. A frame count that divides neither path restarts the scene mid-motion and
produces a visible jump even though the individual movements look correct.

`hypno` keeps its wide 0.55-height diamonds and lets their lines continue past
the panel rather than changing shape to meet its bounds. Radius 47 carries that
aspect through the four corners; each ring continues to radius 50 so it is fully
clipped before wrapping back to the centre.

`bounce` is exact the same way. A 6×6 shape travels 40px across and 20px down,
so at 1px/frame the periods are 80 and 40 — LCM 80, and frame 80 is frame 0.
The vertical phase is offset by a quarter period **on purpose**: started
together, both axes reverse on frames 0 and 40 and the shape corners every 3.6
seconds, which is the one thing a bouncing logo should almost never do. Offset,
the turns land on 0/40 and 10/30/50/70, never coincide, and it near-misses
forever. Six bounces a loop and six colours, so the colour cycle closes too.

**Each sheet is still a single row**, so one screen is capped at about 356
frames — browsers give out around 16384px, and a frame is 46 wide. The largest
here is `ai-work` at 96, so the ceiling is now per screen and nowhere near.

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

### `character.aseprite` — 40×86, the person

| tag | frames | ms | what |
|---|---|---|---|
| `idle` | 0 | — | seated |
| `away` | 1 | — | empty: no person at all |
| `surprised` | 2–5 | 175 | the startle when the power goes, seated |
| `stand-up` | 6–11 | 505 | seated to standing |
| `standing` | 12 | — | on their feet |
| `sit-down` | 13–18 | 400 | standing to seated |
| `surprised-standing` | 19–22 | 175 | the same startle, on their feet |

Layers: `character`, `hat`. **The chair is not in this file** — it moves
independently of its occupant now, so it is its own sprite. `away` is therefore
a genuinely blank frame rather than a chair with nobody in it.

The height is not arbitrary: **slice y + sprite height must equal 96**, the
floor line in `room.png`, or the figure does not touch the ground. Currently
10 + 86 = 96. It has grown from the top three times — 42 + 54 originally, then
22 + 74 for room above the head, then 16 + 80 for a standing one, then this so
the startle marks clear a standing head. Resize the canvas from the top and move
the slice up by the same amount, or everything floats.

**The startle marks are what sets the headroom.** They fan seven rows above the
cap, and the standing cap sits near the top of the canvas, so a standing startle
needs seven rows of nothing above it plus whatever the hop adds. That is what
the last growth bought. Draw anything higher over the head and the canvas has to
grow again — Aseprite discards pixels outside a cel without a word, so the
failure is silent.

The figure is in *front* of the desk, between the camera and everything else, so
it draws over the desk lip and the lower monitor. An earlier version put it
behind the desk, where the bezel and keyboard left a three-row slot and about
fifteen pixels of character survived.

**Standing is the seated pose raised by exactly the desk's travel**, 14px. That
is not a choice: a sit-stand desk is set so your eye-to-screen distance does not
change, so the body and the desktop have to move together or the arms stop
meeting the desk. If `DESK_RAISED` in `render.ts` changes, this art changes with
it.

The feet stay planted, so the whole 14px goes into making the figure longer:
**six rows into the torso and eight into the legs.** Raising the seated drawing
whole instead puts a 22px torso over 34px of leg, which reads as somebody on
stilts. The six rows must be zero when seated, which is also what keeps the last
frame of `sit-down` identical to `idle` — and they cannot be added to the seated
drawing to save the trouble, because the trousers would slide down into the
five-row band that does show between the backrest and the seat, changing the
pose you look at most for something only visible standing.

Below the waist the silhouette steps in twice, 16px of shirt to 14px of trouser
to two 5px legs, each step one pixel per side. Carrying the shirt's full 18px
straight down over legs half that width comes out barrel-shaped.

**The legs are one drawing at two lengths.** Same columns, same shoes, seated
and standing; only the hem moves. They were briefly two different shapes —
narrower seated, to thread between the gas cylinder and the star base — and the
seam that produced at the top of the rise was worse than anything the overlap
costs. The seated pair exist mostly so the standing ones have something to grow
out of: without them the legs simply appear a few pixels into the rise, which
was the one obvious tell in the sequence.

**`stand-up`'s last frame and `standing` must be the same drawing.** `frameOnce`
holds on a one-shot's final frame and the runtime swaps to `standing` the
instant the move completes, so any difference between them is a pop on a frame
nobody asked for. The same goes for `sit-down`'s last frame and `idle`.

The transitions are timed rather than eased, and the timing is the part worth
keeping: anticipation is the longest frame in the stand, the two rise frames are
the shortest, and the overshoot gets a beat of its own instead of being smoothed
through. Squash and stretch is the hat moving a pixel ahead of the body on the
way up and a pixel behind on the way down — actually scaling thirty pixels of
drawing resamples it into mush.

The two startles are the same six marks at the same offsets from the cap, so the
effect reads as one thing at either height. What differs is the hop: seated it
is nearly all marks, because the chair hides the legs, while standing it moves
the whole figure and the two pixels of floor that open under the shoes are what
make it a jump. `STARTLE_TAG` in `render.ts` picks between them, and the choice
is made when the person looks up rather than when the plug comes out — the delay
between those is long enough to stand up inside.

`PRESENCE_TAG` in `render.ts` maps presence states to tag names, and includes
`type` and `empty` which **do not exist in the sheet**. A missing tag falls back
to the seated pose, so an undrawn state reads as somebody who does not do that
yet rather than as a flicker. Draw the pose and tag it before using those
states.

#### Indexed, and the palette is the contract

Like `digits.aseprite`, and for a sharper reason: **entries 1–9 are the keys
`src/scene/outfits.ts` recolours by**, and three of them sit one unit from a
neighbour. In RGB those pairs are three indistinguishable greys and a stray
brush stroke merges two roles into one; as palette slots they cannot be
confused.

| # | part | value | |
|---|---|---|---|
| 0 | transparent | — | |
| 1 | hat top | `239,239,239` | |
| 2 | hat edge | `170,170,170` | |
| 3 | hat strap | `52,52,52` | one off the shoes |
| 4 | shirt fill | `223,223,223` | |
| 5 | shirt shade | `154,154,154` | |
| 6 | pants fill | `32,32,32` | |
| 7 | pants shade | `33,33,33` | one off the fill |
| 8 | shoe fill | `53,53,53` | |
| 9 | shoe shade | `54,54,54` | one off the fill |
| 10 | skin | `255,223,186` | |
| 11 | bald head | `255,238,219` | under the cap — see below |
| 12 | startle marks | `240,240,240` | |

Entries 1–9 are in the same order as `KEYS` in `outfits.ts` on purpose: reading
the two side by side is the check that they still agree. **Change one and it
must change in both on the same commit**, or that part silently stops being
recoloured — the remap never matches and the drawn colour ships instead.

10, 11 and 12 are deliberately outside that range. Skin and startle marks are
not clothing, and nothing should be able to tint them by accident.

**The one-unit gaps are the load-bearing part.** The strap and the shoes were
the same colour, and the export flattens the layers, so nothing downstream could
tell them apart. The pants and shoes had no shade at all, which does not matter
while the trousers are near black and matters entirely the moment an outfit
makes them light. One unit is invisible on any display, which is what lets the
base art look exactly as drawn *and* serve as the default outfit — verified
byte-identical.

**Do not convert this sprite with Aseprite's own RGB → Indexed command.** It
finds the nearest entry through an RGB map that buckets five bits to a channel,
which folds 52, 53 and 54 into one. The conversion was done by mapping every
pixel by hand and repainting the cels afterwards.

Shade pixels replace outermost fill pixels rather than adding to the silhouette.
The hip block and shoes are wide enough for a full outline; the legs are 3px and
would be mostly outline, so they carry a shade on the outer side only.

**Entry 11 draws nothing today and is meant to.** It is the bald head, and the
cap covers it on all 23 frames — zero pixels of it reach the export. It is there
for a hatless pose, so drawing one is a matter of hiding the `hat` layer rather
than inventing a scalp.

### `logo-*.aseprite` — 14×14, shirt logos

A stencil, not a drawing. **Alpha is the shape and the colour is ignored** —
the outfit supplies the ink, so one file works on a light shirt and a dark one.
Draw it in whatever is convenient.

**It has to be an `.aseprite`, even though only the PNG is read.** The plugin
finds art by globbing `*.aseprite` and only emits the outputs derived from
those names, so a hand-authored PNG dropped into `art/` is served in dev by the
middleware and then silently missing from the build — the one failure mode that
looks like everything working.

An outfit opts in by naming the file without its prefix:

```ts
shirt: { fill: '#c96f43', shade: '#8c4a2f', logo: { art: 'monogram', ink: '#1a0e09' } }
```

The runtime finds the spot by measuring the first row of shirt on each frame,
so **one drawing covers every pose** and it keeps working if the character is
redrawn. `away` has no shirt, so a logo switches itself off when nobody is
there without being told. A name with no file costs a plain shirt rather than a
broken page.

**It is a standing feature.** Seated, the chair back covers 86% of the shirt —
40 pixels visible against 252 hidden — leaving two rows at the shoulders and a
sliver either side of the seat. With the desk up about a third of the time,
that is roughly one visit in three.

14×14 is what fits: the clean run of shirt back is 14 wide on both poses, and
standing has 22 rows spare. At that size, with one ink, expect a glyph or a
two-letter monogram. A wordmark will not survive — the same limit that killed
the Matrix-rain and starfield screensavers, where many small independent
elements resolve to noise.

`logo-monogram` is a placeholder to check the plumbing against. No outfit
references it; delete it once there are real ones. Its exported `.json` goes
unread — the runtime loads the PNG as a plain image, since a one-frame stencil
has no frames or tags worth parsing.

### `chair.aseprite` — 40×86, the chair

| tag | frames | ms | what |
|---|---|---|---|
| *(none)* | 0 | — | at the desk, and what draws whenever nothing else applies |
| `shove` | 1–7 | 630 | pushed out of shot |

Drawn at the same slice as the person, at a horizontal offset the runtime owns,
and **after** them — so the seat back covers the seated body exactly as the
layer did when this was part of `character.aseprite`.

**Its canvas has to match `character.aseprite`'s exactly.** Both are positioned
from the same slice, so growing one and not the other drops the chair through
the floor by the difference. There is nothing in the code that checks this.

It travels `CHAIR_EXIT` = 114px, which is measured rather than chosen: the
chair's left edge is at x78 and the scene is 192 wide, so 114 is the exact
distance at which its last column clears the frame. Anything less parks a sliver
of armrest on the edge and reads as a clipping bug.

**The lean in `shove` runs *with* the direction of travel, then crosses back.**
A hand on the backrest applies force well above the centre of mass, and castors
give the floor almost nothing to push back with, so the top tips the way it is
going. The base only runs out from under the top when the push is low down or
the floor is dragging, which is not what standing out of a chair does. Once the
shove is over the only force left is the castors slowing it, which acts at the
floor and leans it the other way — so it passes through upright rather than
settling there, and coasts slightly back-leant.

That second half is not decoration. Leaning only at the start left the chair
frozen upright for the last 420ms of a 630ms roll, which is most of the shot.

Amplitude is capped by the sprite rather than by taste. The armrests reach x2
and x37 of a 40px canvas, and at 5 the shear pushes them off both edges; 4 is
the most that survives. If it ever needs to lean harder, the canvas has to grow
and the runtime needs an inset to draw it at, because the chair is positioned
from the 40-wide `character` slice.

Frame 0 must stay the upright chair: the runtime falls back to index 0 whenever
there is no reaction playing, without consulting a tag.

### `switch.aseprite` — 4×6, 2 frames

Frame 0 off, frame 1 on.

---

## Traps

**Appending frames extends the last tag.** Any tag ending on what was the final
frame silently grows to cover the new ones. This cost three separate debugging
sessions on the old combined screen sheet. Snapshot tag ranges before appending
and restore them after. Splitting the screens into one file each removed the
trap for them; it still applies to every sheet that holds more than one tag —
`character.aseprite`, `chair.aseprite` and `screen-power.aseprite`.

**Cel bounds clip without saying so.** A cel is only as big as what was drawn in
it, and anything painted outside that rectangle is discarded with no error and
no warning. This is how the startle marks above the head first vanished. When a
pose needs to reach past what the frame it came from covered, build the cel at
full canvas size.

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
