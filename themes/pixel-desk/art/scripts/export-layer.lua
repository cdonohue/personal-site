-- Export a single layer (by name) to its own PNG, ignoring current visibility.
--
-- The CLI's --layer flag does not survive being combined with --all-layers, and
-- silently exports the whole flattened sprite instead of erroring — so a hidden
-- layer looks like it exported fine while actually giving you the full room.
-- Doing the visibility toggling here is unambiguous.
--
-- Usage:
--   aseprite -b room.aseprite --script-param layer=dark \
--     --script-param out=/tmp/dark.png --script scripts/export-layer.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('export-layer: no sprite open')
  return
end

local wanted = app.params['layer']
local out = app.params['out']
if not wanted or not out then
  print('export-layer: needs --script-param layer=NAME --script-param out=PATH')
  return
end

-- Remember every layer's visibility so the file is left exactly as found.
local saved = {}
local function each(layers, visit)
  for _, layer in ipairs(layers) do
    visit(layer)
    if layer.isGroup then each(layer.layers, visit) end
  end
end

each(sprite.layers, function(layer) saved[layer] = layer.isVisible end)

local target = nil
each(sprite.layers, function(layer)
  if layer.name == wanted then target = layer end
end)

if not target then
  print('export-layer: no layer named "' .. wanted .. '"')
  return
end

each(sprite.layers, function(layer) layer.isVisible = false end)

-- The layer (or group), its descendants, and every group containing it must be
-- visible for it to render. Supporting groups lets scene states contain
-- independently editable product sublayers without changing the runtime
-- export contract.
local function reveal(layer)
  layer.isVisible = true
  if layer.isGroup then
    for _, child in ipairs(layer.layers) do reveal(child) end
  end
end

reveal(target)
local node = target.parent
while node do
  node.isVisible = true
  node = node.parent
  if node == sprite then break end
end

sprite:saveCopyAs(out)

each(sprite.layers, function(layer) layer.isVisible = saved[layer] end)

print(string.format('export-layer: %s -> %s', wanted, out))
