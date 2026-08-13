-- Move a horizontal band of pixels from one layer onto a new layer above it.
--
-- Used to lift the desk's front lip out of DESK/surface so the character can be
-- drawn between them: room -> character -> desk-front. Without the split, the
-- lip is baked into the room and anything drawn afterwards sits on top of the
-- desk instead of behind it.
--
-- The new layer goes directly above the source in the same group, so the
-- flattened export is unchanged — same pixels, same order. Only the separate
-- per-layer export gains a new entry.
--
-- Usage:
--   aseprite -b room.aseprite --script-param from=surface \
--     --script-param to=desk-front --script-param y0=63 --script-param y1=68 \
--     --script scripts/split-rows.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('split-rows: no sprite open')
  return
end

local fromName = app.params['from']
local toName = app.params['to']
local y0 = tonumber(app.params['y0'])
local y1 = tonumber(app.params['y1'])

if not fromName or not toName or not y0 or not y1 then
  print('split-rows: needs from, to, y0 and y1')
  return
end

local function find(layers, name)
  for _, layer in ipairs(layers) do
    if layer.isGroup then
      local hit = find(layer.layers, name)
      if hit then return hit end
    elseif layer.name == name then
      return layer
    end
  end
  return nil
end

if find(sprite.layers, toName) then
  print('split-rows: a layer named "' .. toName .. '" already exists, nothing to do')
  return
end

local source = find(sprite.layers, fromName)
if not source then
  print('split-rows: no layer named "' .. fromName .. '"')
  return
end

local cel = source:cel(1)
if not cel then
  print('split-rows: "' .. fromName .. '" has no cel on frame 1')
  return
end

local transparent = sprite.transparentColor
local moved = Image(sprite.width, sprite.height, sprite.colorMode)
moved:clear(transparent)

local kept = Image(cel.image.width, cel.image.height, sprite.colorMode)
kept:clear(transparent)

local count = 0
for y = 0, cel.image.height - 1 do
  for x = 0, cel.image.width - 1 do
    local value = cel.image:getPixel(x, y)
    if value ~= transparent then
      local worldY = y + cel.position.y
      if worldY >= y0 and worldY <= y1 then
        moved:drawPixel(x + cel.position.x, worldY, value)
        count = count + 1
      else
        kept:drawPixel(x, y, value)
      end
    end
  end
end

if count == 0 then
  print(string.format('split-rows: no pixels in rows %d-%d, nothing moved', y0, y1))
  return
end

cel.image = kept

local target = sprite:newLayer()
target.name = toName
target.parent = source.parent
target.stackIndex = source.stackIndex + 1
sprite:newCel(target, 1, moved, Point(0, 0))

sprite:saveAs(sprite.filename)

print(string.format(
  'split-rows: moved %d px in rows %d-%d from %s to %s (above it, same group)',
  count, y0, y1, fromName, toName))
