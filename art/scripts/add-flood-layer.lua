-- Add a full-canvas flood-filled layer inside a group.
--
-- WEATHER/clear-day works this way: a single flat colour across the whole
-- canvas, sitting at the bottom of the stack, which the wall above it occludes
-- everywhere except the window glass. So the view through the window is a
-- swappable layer rather than a mask, and occlusion is handled by the art.
--
-- New layers are created hidden, so the default flattened export is unchanged.
--
-- Usage:
--   aseprite -b room.aseprite --script-param name=clear-night \
--     --script-param group=WEATHER --script-param rgb=32,38,66 \
--     --script scripts/add-flood-layer.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('add-flood-layer: no sprite open')
  return
end

local name = app.params['name']
local groupName = app.params['group']
local rgb = app.params['rgb']

if not name or not rgb then
  print('add-flood-layer: needs name and rgb=r,g,b')
  return
end

local r, g, b = rgb:match('^(%d+),(%d+),(%d+)$')
if not r then
  print('add-flood-layer: rgb must look like 32,38,66')
  return
end

local function find(layers, wanted)
  for _, layer in ipairs(layers) do
    if layer.name == wanted then return layer end
    if layer.isGroup then
      local hit = find(layer.layers, wanted)
      if hit then return hit end
    end
  end
  return nil
end

local existing = find(sprite.layers, name)
if existing and app.params['force'] ~= '1' then
  print('add-flood-layer: "' .. name .. '" already exists — pass force=1 to re-flood it')
  return
end

local group = nil
if groupName then
  group = find(sprite.layers, groupName)
  if not group or not group.isGroup then
    print('add-flood-layer: no group named "' .. groupName .. '"')
    return
  end
end

local image = Image(sprite.width, sprite.height, sprite.colorMode)
local colour = app.pixelColor.rgba(tonumber(r), tonumber(g), tonumber(b), 255)
for y = 0, sprite.height - 1 do
  for x = 0, sprite.width - 1 do
    image:drawPixel(x, y, colour)
  end
end

local layer = existing
if layer then
  local cel = layer:cel(1)
  if cel then
    cel.image = image
    cel.position = Point(0, 0)
  else
    sprite:newCel(layer, 1, image, Point(0, 0))
  end
else
  layer = sprite:newLayer()
  layer.name = name
  if group then layer.parent = group end
  layer.isVisible = false
  sprite:newCel(layer, 1, image, Point(0, 0))
end

sprite:saveAs(sprite.filename)

print(string.format(
  'add-flood-layer: added %s in %s as rgb(%s,%s,%s), hidden',
  name, groupName or 'root', r, g, b))
