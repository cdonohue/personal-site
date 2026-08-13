-- Create switch.aseprite: a 4x6 light switch plate, two frames.
--
--   frame 0  off (toggle down)
--   frame 1  on  (toggle up)
--
-- Frame index is a state, not a point in time — the same convention digits
-- uses, where frame 7 is the digit seven rather than the seventh moment. So
-- there is no tag and no timeline; the webpage just draws frame 0 or 1.
--
-- Deliberately its own sprite rather than frames on room.aseprite: the room is
-- 192x108, so two frames there would duplicate the whole canvas to change 24
-- pixels, and it would spend the room's timeline on switch state when
-- ASEPRITE_CHECKLIST.md reserves frames 1-18 for character poses.
--
-- Refuses to overwrite an existing file unless force=1, so re-running it can
-- never destroy hand-painted work.
--
-- Usage: aseprite -b --script-param out=switch.aseprite \
--          --script scripts/create-switch.lua

local out = app.params['out'] or 'switch.aseprite'
local force = app.params['force'] == '1'

if not force then
  local existing = io.open(out, 'r')
  if existing then
    existing:close()
    print('create-switch: ' .. out .. ' already exists — pass force=1 to overwrite')
    return
  end
end

local W, H = 4, 6

-- E plate rim   F plate face   T toggle   . transparent
local ON = {
  'EEEE',
  'ETTE',
  'ETTE',
  'EFFE',
  'EFFE',
  'EEEE',
}
local OFF = {
  'EEEE',
  'EFFE',
  'EFFE',
  'ETTE',
  'ETTE',
  'EEEE',
}

-- The wall behind it is rgb(170), so the plate reads lighter than the wall.
-- The toggle carries two cues at once: where it sits, and how bright it is.
local function palette(toggle)
  return {
    E = { 210, 210, 210 },
    F = { 188, 188, 188 },
    T = toggle,
  }
end

local ON_COLORS = palette({ 240, 240, 240 })
local OFF_COLORS = palette({ 128, 128, 128 })

local sprite = Sprite(W, H, ColorMode.RGB)
sprite.filename = out
sprite.layers[1].name = 'switch'

local function paint(image, rows, colors)
  for y = 1, #rows do
    local row = rows[y]
    for x = 1, #row do
      local key = row:sub(x, x)
      local rgb = colors[key]
      if rgb then
        image:drawPixel(x - 1, y - 1, app.pixelColor.rgba(rgb[1], rgb[2], rgb[3], 255))
      end
    end
  end
end

local layer = sprite.layers[1]

-- Frame 1 in Lua is frame 0 in the exported JSON: the off state.
local offImage = Image(W, H, ColorMode.RGB)
paint(offImage, OFF, OFF_COLORS)
sprite.cels[1].image = offImage

local onFrame = sprite:newEmptyFrame(2)
local onImage = Image(W, H, ColorMode.RGB)
paint(onImage, ON, ON_COLORS)
sprite:newCel(layer, onFrame, onImage, Point(0, 0))

sprite:saveAs(out)
print(string.format('create-switch: wrote %s (%dx%d, %d frames)', out, W, H, #sprite.frames))
