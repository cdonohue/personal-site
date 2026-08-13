-- Create or move a named slice.
--
-- Slices are how the webpage positions overlays: room.json carries
-- monitor-screen, clock-screen and light-switch, and the renderer reads their
-- bounds instead of hardcoding coordinates. Move one in Aseprite and the
-- overlay follows on the next export.
--
-- Usage:
--   aseprite -b room.aseprite --script-param name=light-switch \
--     --script-param x=11 --script-param y=40 \
--     --script-param w=4 --script-param h=6 \
--     --script scripts/set-slice.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('set-slice: no sprite open')
  return
end

local name = app.params['name']
local x = tonumber(app.params['x'])
local y = tonumber(app.params['y'])
local w = tonumber(app.params['w'])
local h = tonumber(app.params['h'])

if not name or not x or not y or not w or not h then
  print('set-slice: needs name, x, y, w and h')
  return
end

local bounds = Rectangle(x, y, w, h)

-- Aseprite draws a slice's outline in the slice's own colour, and newSlice()
-- leaves that unset — so a scripted slice is invisible on the canvas even
-- though it is listed and exports correctly. Default to the blue the UI uses.
local colour = Color{ r = 0, g = 0, b = 255, a = 255 }

for _, slice in ipairs(sprite.slices) do
  if slice.name == name then
    local was = slice.bounds
    slice.bounds = bounds
    slice.color = colour
    sprite:saveAs(sprite.filename)
    print(string.format(
      'set-slice: moved %s from (%d,%d %dx%d) to (%d,%d %dx%d)',
      name, was.x, was.y, was.width, was.height, x, y, w, h))
    return
  end
end

local slice = sprite:newSlice(bounds)
slice.name = name
slice.color = colour
sprite:saveAs(sprite.filename)
print(string.format('set-slice: added %s at (%d,%d %dx%d)', name, x, y, w, h))
