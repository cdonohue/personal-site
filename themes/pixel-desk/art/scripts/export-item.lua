-- Export one or more named layers as a tightly cropped product PNG.
--
-- The sprite is supplied by Aseprite's batch CLI. This script deliberately
-- never opens a file itself: the repository's AGENTS.md documents why ad-hoc
-- app.open() automation is unreliable here.
--
-- Usage:
--   aseprite -b room.aseprite \
--     --script-param layers=screen \
--     --script-param crop=71,27,50,31 \
--     --script-param out=/path/to/item-monitor.png \
--     --script scripts/export-item.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('export-item: no sprite open')
  return
end

local wanted = app.params['layers']
local crop = app.params['crop']
local out = app.params['out']
if not wanted or not crop or not out then
  print('export-item: needs layers=NAME[,NAME], crop=X,Y,W,H and out=PATH')
  return
end

local wantedNames = {}
for name in string.gmatch(wanted, '([^,]+)') do wantedNames[name] = true end

local bounds = {}
for value in string.gmatch(crop, '([^,]+)') do table.insert(bounds, tonumber(value)) end
if #bounds ~= 4 then
  print('export-item: crop must contain exactly X,Y,W,H')
  return
end

local found = {}
local function each(layers, visit)
  for _, layer in ipairs(layers) do
    visit(layer)
    if layer.isGroup then each(layer.layers, visit) end
  end
end

each(sprite.layers, function(layer) layer.isVisible = false end)

each(sprite.layers, function(layer)
  if not layer.isGroup and wantedNames[layer.name] then
    found[layer.name] = true
    local node = layer
    while node do
      node.isVisible = true
      node = node.parent
      if node == sprite then break end
    end
  end
end)

for name, _ in pairs(wantedNames) do
  if not found[name] then
    print('export-item: no layer named "' .. name .. '"')
    return
  end
end

sprite:crop(bounds[1], bounds[2], bounds[3], bounds[4])
sprite:saveCopyAs(out)

print(string.format('export-item: %s -> %s', wanted, out))
