# Project instructions

## Aseprite automation

- Do not use ad hoc Aseprite Lua scripts that call `app.open()` to inspect an
  `.aseprite` file. On this macOS setup, those calls escape the intended batch
  workflow, repeatedly open the desktop application, and fail to produce the
  requested output.
- Inspect the committed PNG and JSON exports whenever they contain the needed
  information.
- Regenerate existing sprites with `art/export.sh`. Use any other Aseprite batch
  command only after proving it works on one disposable output without opening
  the desktop application.

## Scene artwork source of truth

- Treat the editable `.aseprite` files as the source of truth for authored
  scene objects. Persistent furniture, products, books, decorations, and
  seasonal objects must be independent named layers or groups in the relevant
  room file, or independent `.aseprite` assets when they animate separately.
- Do not recreate authored scene objects in TypeScript, Canvas drawing code,
  CSS, HTML, SVG, or hand-edited exported PNGs. Those parallel drawings drift
  from the room file and make visual edits ambiguous.
- Reserve procedural drawing for genuinely runtime-generated effects such as
  live data, interaction feedback, or motion that has no authored sprite. It
  must not duplicate an object that belongs in the art source.
- If the required `.aseprite` source cannot be edited safely under the
  automation rules above, stop and ask the user to author the named layers.
  Prepare the runtime contract if useful, but do not substitute procedural art.
- A scene-art change is complete only after confirming that the named source
  layers export successfully and the homepage, dev room, and any scene-derived
  page all consume those exports rather than separate drawings.
