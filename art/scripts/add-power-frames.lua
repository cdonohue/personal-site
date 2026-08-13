-- Build the monitor's power-on and power-off frames in screen.aseprite.
--
-- A CRT collapse: the picture squeezes vertically into a single bright row,
-- that row shrinks to a stub, and the stub goes out. Power-on is the reverse,
-- ending on a full-panel glow that hands over to the looping content.
--
-- No full-screen flash at the start of power-off — the picture is already
-- there, so flashing white before collapsing reads as a glitch rather than as
-- a screen switching off. The bright moment is the line itself.
--
-- The last power-off frame is the exact colour of the dark plate baked into
-- room.png, so the animation ends on the same pixels the off state shows and
-- there is no pop at the hand-off.
--
-- Pass force=1 to rebuild after editing this script: existing power frames and
-- tags are removed first. `ai-work` is restored afterwards because appending
-- frames silently extends any tag that ended on the last frame.
--
-- Brightness is tunable without editing this file:
--   --script-param glow=120,128,145   the collapsing band
--   --script-param line=225,232,245   the one-pixel line
--
-- Usage: aseprite -b screen.aseprite --script-param force=1 \
--          --script scripts/add-power-frames.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('add-power-frames: no sprite open')
  return
end

local force = app.params['force'] == '1'
local TAGS = { 'power-on', 'power-off' }

local existing = {}
for _, tag in ipairs(sprite.tags) do
  for _, name in ipairs(TAGS) do
    if tag.name == name then existing[#existing + 1] = tag end
  end
end

if #existing > 0 and not force then
  print('add-power-frames: power frames already exist — pass force=1 to rebuild')
  return
end

-- Remove the old frames back to front so earlier indices stay valid.
if #existing > 0 then
  local doomed = {}
  for _, tag in ipairs(existing) do
    for number = tag.fromFrame.frameNumber, tag.toFrame.frameNumber do
      doomed[number] = true
    end
  end
  for _, tag in ipairs(existing) do
    sprite:deleteTag(tag)
  end
  local numbers = {}
  for number in pairs(doomed) do numbers[#numbers + 1] = number end
  table.sort(numbers, function(a, b) return a > b end)
  for _, number in ipairs(numbers) do
    sprite:deleteFrame(number)
  end
  print(string.format('add-power-frames: removed %d old frames', #numbers))
end

local W, H = sprite.width, sprite.height
local MID = H // 2
local DURATION = 0.045

local function colour(param, fallback)
  local value = app.params[param]
  if not value then return fallback end
  local r, g, b = value:match('^(%d+),(%d+),(%d+)$')
  if not r then
    print('add-power-frames: ' .. param .. ' must look like 120,128,145')
    return fallback
  end
  return { tonumber(r), tonumber(g), tonumber(b) }
end

local PLATE = { 32, 32, 32 }
-- Dimmer than the first pass, which blew out against a screen whose content is
-- mostly dark. The collapse should sit back; the line is the bright moment.
local GLOW = colour('glow', { 120, 128, 145 })
local LINE = colour('line', { 225, 232, 245 })

local function rgba(c)
  return app.pixelColor.rgba(c[1], c[2], c[3], 255)
end

--- Rows [top, bottom] filled in `colour`, inset `inset` px from each side.
local function band(top, bottom, colour, inset)
  local image = Image(W, H, sprite.colorMode)
  local plate = rgba(PLATE)
  for y = 0, H - 1 do
    for x = 0, W - 1 do
      image:drawPixel(x, y, plate)
    end
  end
  if top then
    local fill = rgba(colour)
    for y = top, bottom do
      for x = inset or 0, W - 1 - (inset or 0) do
        image:drawPixel(x, y, fill)
      end
    end
  end
  return image
end

-- Collapse, then the line, then the stub. Power-on is this reversed with a
-- full-panel glow on the end to hand over to the content.
local OFF = {
  band(4, H - 5, GLOW),
  band(9, H - 10, GLOW),
  band(MID - 1, MID, GLOW),
  band(MID, MID, LINE), -- the thin line, one pixel tall, full width
  band(MID, MID, LINE, 16),
  band(nil, nil, PLATE),
}
local ON = {
  band(nil, nil, PLATE),
  band(MID, MID, LINE, 16),
  band(MID, MID, LINE),
  band(MID - 1, MID, GLOW),
  band(9, H - 10, GLOW),
  band(4, H - 5, GLOW),
  band(0, H - 1, GLOW),
}

local layer = sprite.layers[1]

local function append(images)
  local first = #sprite.frames + 1
  for _, image in ipairs(images) do
    local frame = sprite:newEmptyFrame(#sprite.frames + 1)
    frame.duration = DURATION
    sprite:newCel(layer, frame, image, Point(0, 0))
  end
  return first, #sprite.frames
end

local contentEnd = #sprite.frames -- 1-based; the content occupies everything so far

local onFrom, onTo = append(ON)
local offFrom, offTo = append(OFF)

local onTag = sprite:newTag(onFrom, onTo)
onTag.name = 'power-on'
local offTag = sprite:newTag(offFrom, offTo)
offTag.name = 'power-off'

-- Appending extends a tag that ended on the last frame, so ai-work would now
-- cover the power frames and play them as part of the content loop.
for _, tag in ipairs(sprite.tags) do
  if tag.name == 'ai-work' then
    tag.fromFrame = 1
    tag.toFrame = contentEnd
    print(string.format('add-power-frames: ai-work held at 0-%d', contentEnd - 1))
  end
end

sprite:saveAs(sprite.filename)

print(string.format(
  'add-power-frames: power-on = JSON %d-%d, power-off = %d-%d, %d ms each',
  onFrom - 1, onTo - 1, offFrom - 1, offTo - 1, DURATION * 1000))
