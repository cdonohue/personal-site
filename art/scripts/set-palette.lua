-- Set one palette entry to a neutral grey.
--
-- digits.aseprite is Indexed, so every frame that uses an entry restyles at
-- once. Entries in use:
--   0   transparent
--   21  unlit segment ("burn-in" ghost)
--   23  colon, lit
--   25  segment, lit
--
-- Editing the palette is the whole job — the pixels store indices, not colours,
-- which is also why repainting with a new brush colour would be wrong (it would
-- add a second entry and split the look).
--
-- Usage:
--   aseprite -b digits.aseprite --script-param index=25 --script-param value=122 \
--     --script scripts/set-palette.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('set-palette: no sprite open')
  return
end

local index = tonumber(app.params['index'])
local value = tonumber(app.params['value'])

if not index or not value then
  print('set-palette: needs --script-param index=N --script-param value=0..255')
  return
end
if value < 0 or value > 255 then
  print('set-palette: value must be 0-255, got ' .. tostring(value))
  return
end

local palette = sprite.palettes[1]
if index < 0 or index >= #palette then
  print(string.format('set-palette: index %d is outside the %d-entry palette', index, #palette))
  return
end

local previous = palette:getColor(index)
palette:setColor(index, Color{ r = value, g = value, b = value, a = 255 })

print(string.format(
  'set-palette: [%d] rgb(%d,%d,%d) -> rgb(%d,%d,%d)',
  index, previous.red, previous.green, previous.blue, value, value, value
))

sprite:saveAs(sprite.filename)
