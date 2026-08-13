-- Grow a sprite's canvas without moving where its art lands in the scene.
--
-- Widening a sprite normally pins the existing pixels to the left and adds the
-- new space on the right, which shifts everything sideways once it is placed at
-- a slice. This keeps the art centred horizontally and anchored to the bottom —
-- the right defaults for something standing on a floor — and prints the slice
-- change needed to hold its position.
--
-- The slice lives in room.aseprite, a different file, so applying it is a
-- separate step with set-slice.lua. The numbers to use are printed below.
--
-- Usage:
--   aseprite -b character.aseprite --script-param w=40 \
--     --script scripts/resize-canvas.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('resize-canvas: no sprite open')
  return
end

local newW = tonumber(app.params['w']) or sprite.width
local newH = tonumber(app.params['h']) or sprite.height

if newW < sprite.width or newH < sprite.height then
  print(string.format(
    'resize-canvas: refusing to shrink %dx%d to %dx%d — that would clip cels',
    sprite.width, sprite.height, newW, newH))
  return
end

if newW == sprite.width and newH == sprite.height then
  print('resize-canvas: already that size, nothing to do')
  return
end

local dx = (newW - sprite.width) // 2 -- centre horizontally
local dy = newH - sprite.height -- keep the bottom edge where it was

local oldW, oldH = sprite.width, sprite.height

-- Grow first: shifting cels before the canvas has room would clip them.
sprite.width = newW
sprite.height = newH

for _, layer in ipairs(sprite.layers) do
  for _, cel in ipairs(layer.cels) do
    cel.position = Point(cel.position.x + dx, cel.position.y + dy)
  end
end

sprite:saveAs(sprite.filename)

print(string.format('resize-canvas: %dx%d -> %dx%d, art shifted by (%d,%d)',
  oldW, oldH, newW, newH, dx, dy))
print(string.format('resize-canvas: move the slice by (%d,%d) to hold position — ' ..
  'w=%d h=%d', -dx, -dy, newW, newH))
