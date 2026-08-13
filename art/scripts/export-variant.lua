-- Export a flattened copy of the sprite with some layers shown and others
-- hidden, leaving the file's own visibility untouched.
--
-- Used for the night room: the same scene with WEATHER/clear-night swapped in
-- for clear-day. Exporting a full flattened variant rather than a window mask
-- means occlusion is already correct — the mic arm and desk still sit in front
-- of the glass, which a rectangular mask drawn at runtime could not manage.
--
-- Usage:
--   aseprite -b room.aseprite --script-param hide=clear-day \
--     --script-param show=clear-night --script-param out=room.night.png \
--     --script scripts/export-variant.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('export-variant: no sprite open')
  return
end

local out = app.params['out']
if not out then
  print('export-variant: needs out=PATH')
  return
end

local function split(list)
  local names = {}
  if list then
    for name in list:gmatch('[^,]+') do
      names[name:match('^%s*(.-)%s*$')] = true
    end
  end
  return names
end

local hide = split(app.params['hide'])
local show = split(app.params['show'])

local saved = {}
local function each(layers, visit)
  for _, layer in ipairs(layers) do
    visit(layer)
    if layer.isGroup then each(layer.layers, visit) end
  end
end

each(sprite.layers, function(layer) saved[layer] = layer.isVisible end)

local missing = {}
for name in pairs(hide) do missing[name] = true end
for name in pairs(show) do missing[name] = true end

each(sprite.layers, function(layer)
  if hide[layer.name] then
    layer.isVisible = false
    missing[layer.name] = nil
  elseif show[layer.name] then
    layer.isVisible = true
    missing[layer.name] = nil
    -- A layer inside a hidden group renders as nothing, so lift its ancestors.
    local node = layer.parent
    while node and node ~= sprite do
      node.isVisible = true
      node = node.parent
    end
  end
end)

for name in pairs(missing) do
  print('export-variant: warning — no layer named "' .. name .. '"')
end

sprite:saveCopyAs(out)

each(sprite.layers, function(layer) layer.isVisible = saved[layer] end)

print(string.format('export-variant: wrote %s', out))
