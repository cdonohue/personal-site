-- Move every pixel of a frame by a whole-pixel offset.
--
-- Used to centre the colon: its dots were drawn in column 0 of a 3-wide cell,
-- so the layout centred the *cell* while the ink sat hard left — 1px of gap
-- before it and 3px after. Fixing it in the art keeps the renderer a uniform
-- grid (x = 1 + i * 4) rather than special-casing one glyph.
--
-- `frame` is the exported-JSON index, which is what the webpage code talks in.
--
-- Usage:
--   aseprite -b digits.aseprite --script-param frame=10 --script-param dx=1 \
--     --script scripts/shift-frame.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('shift-frame: no sprite open')
  return
end

local frame = tonumber(app.params['frame'])
local dx = tonumber(app.params['dx']) or 0
local dy = tonumber(app.params['dy']) or 0

if frame == nil then
  print('shift-frame: needs frame=N (0-based JSON index)')
  return
end

local number = frame + 1
if number < 1 or number > #sprite.frames then
  print(string.format('shift-frame: frame %d is outside the %d frames', frame, #sprite.frames))
  return
end

local layer = sprite.layers[1]
local cel = layer:cel(number)
if not cel then
  print(string.format('shift-frame: no cel on frame %d', frame))
  return
end

-- Move the cel rather than the pixels inside it. Aseprite trims a cel's image
-- to its content, so a colon drawn in one column has a 1px-wide cel and there
-- is nowhere inside it to shift to — the pixels would fall straight out.
local x = cel.position.x + dx
local y = cel.position.y + dy

if x < 0 or y < 0 or x + cel.image.width > sprite.width or y + cel.image.height > sprite.height then
  print(string.format(
    'shift-frame: refusing — the cel would land at (%d,%d) %dx%d, outside the %dx%d sprite',
    x, y, cel.image.width, cel.image.height, sprite.width, sprite.height))
  return
end

cel.position = Point(x, y)
sprite:saveAs(sprite.filename)

print(string.format(
  'shift-frame: frame %d cel moved to (%d,%d), %dx%d',
  frame, x, y, cel.image.width, cel.image.height))
