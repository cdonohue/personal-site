-- Create character.aseprite: the back of the desk chair, with a head above it.
--
--   0..3  idle    seated, breathing
--   4..7  type    seated, bobbing with the typing
--   8     away    chair only, nobody in it
--   9     empty   chair rolled aside, mostly out of frame
--
-- Frame index is a state, as with digits, switch and weather. Tags let the
-- webpage name ranges rather than numbers.
--
-- The chair is in front of the desk, between the camera and everything else, so
-- this draws last and covers the desk lip and the lower part of the monitor. An
-- earlier attempt put the figure behind the desk instead, where the bezel and
-- the keyboard left a three-row slot and only fifteen pixels of character ever
-- survived.
--
-- Refuses to overwrite an existing file unless force=1.
--
-- Usage: aseprite -b --script-param out=character.aseprite \
--          --script scripts/create-character.lua

local out = app.params['out'] or 'character.aseprite'
local force = app.params['force'] == '1'

if not force then
  local existing = io.open(out, 'r')
  if existing then
    existing:close()
    print('create-character: ' .. out .. ' already exists — pass force=1 to overwrite')
    return
  end
end

-- 54 is not arbitrary: the slice sits at y42 and the floor line in room.png is
-- at y96, so the sprite has to be 54 tall for the castors to land on it. At 46
-- the chair floated nine pixels above the floor.
local W, H = 28, 54

local function rgba(r, g, b)
  return app.pixelColor.rgba(r, g, b, 255)
end

-- Stacked widest to narrowest going up: backrest, shoulders, head. That
-- silhouette is what makes it read as someone sitting in a chair rather than a
-- head balanced on a slab.
local CHAIR = rgba(52, 54, 62)
local CHAIR_LIT = rgba(78, 82, 92)
local CHAIR_EDGE = rgba(30, 32, 38)
local SWEATER = rgba(86, 110, 80)
local SWEATER_LIT = rgba(108, 134, 100)
local SWEATER_DARK = rgba(62, 82, 60)
local HAIR = rgba(168, 88, 52)
local HAIR_LIT = rgba(204, 122, 72)
local SKIN = rgba(214, 166, 128)

local function blank()
  return Image(W, H, ColorMode.RGB)
end

local function rect(image, x0, y0, x1, y1, colour)
  for y = math.max(0, y0), math.min(H - 1, y1) do
    for x = math.max(0, x0), math.min(W - 1, x1) do
      image:drawPixel(x, y, colour)
    end
  end
end

local function ellipse(image, cx, cy, rx, ry, colour)
  for y = -ry, ry do
    for x = -rx, rx do
      if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1 then
        local px, py = cx + x, cy + y
        if px >= 0 and px < W and py >= 0 and py < H then image:drawPixel(px, py, colour) end
      end
    end
  end
end

--- The chair back, plus the post below it.
local function chair(image, offsetX)
  local left, right = 2 + offsetX, 25 + offsetX
  local top, bottom = 16, 33

  rect(image, left, top + 1, right, bottom, CHAIR)
  -- Rounded shoulders on the backrest.
  rect(image, left + 2, top, right - 2, top, CHAIR)
  rect(image, left + 1, top, left + 1, top, CHAIR)
  rect(image, right - 1, top, right - 1, top, CHAIR)
  -- Rim all round, then a highlight down the left where the window light falls.
  rect(image, left, top + 1, left, bottom, CHAIR_EDGE)
  rect(image, right, top + 1, right, bottom, CHAIR_EDGE)
  rect(image, left + 2, top - 1, right - 2, top - 1, CHAIR_EDGE)
  rect(image, left + 1, top + 2, left + 2, bottom - 1, CHAIR_LIT)
  rect(image, left + 1, bottom, right - 1, bottom, CHAIR_EDGE)
  -- Lumbar seam, so it reads as an office chair rather than a plain slab.
  rect(image, left + 3, top + 8, right - 3, top + 8, CHAIR_EDGE)

  -- Post and a splayed base. Without these the chair reads as floating: the
  -- post alone is dark against the dark under-desk area and disappears.
  local cx = math.floor((left + right) / 2)
  rect(image, cx - 1, bottom + 1, cx + 1, H - 5, CHAIR)
  rect(image, cx - 1, bottom + 1, cx - 1, H - 5, CHAIR_LIT)
  -- Base: a low wedge, widening toward the floor, with castors at the ends.
  rect(image, cx - 4, H - 4, cx + 4, H - 4, CHAIR)
  rect(image, cx - 7, H - 3, cx + 7, H - 3, CHAIR)
  rect(image, cx - 7, H - 2, cx - 5, H - 1, CHAIR_EDGE)
  rect(image, cx + 5, H - 2, cx + 7, H - 1, CHAIR_EDGE)
  rect(image, cx - 1, H - 2, cx + 1, H - 1, CHAIR_EDGE)
end

--- Head and shoulders above the backrest. `lift` shifts them for the breath.
local function person(image, lift)
  local cx = 14
  local top = lift

  -- Shoulders: wider than the head, narrower than the chair, and the only part
  -- of the body that shows above the backrest.
  rect(image, cx - 8, top + 11, cx + 7, top + 17, SWEATER)
  rect(image, cx - 7, top + 10, cx + 6, top + 10, SWEATER)
  rect(image, cx - 8, top + 11, cx - 6, top + 17, SWEATER_LIT)
  rect(image, cx + 6, top + 11, cx + 7, top + 17, SWEATER_DARK)

  -- Neck.
  rect(image, cx - 2, top + 8, cx + 1, top + 11, SKIN)

  -- Head.
  ellipse(image, cx, top + 5, 5, 5, HAIR)
  ellipse(image, cx - 1, top + 4, 3, 3, HAIR_LIT)
  image:drawPixel(cx - 5, top + 6, SKIN)
  image:drawPixel(cx + 5, top + 6, SKIN)
end

local frames = {}

-- idle: a slow breath, down on the third beat
for _, lift in ipairs({ 0, 0, 1, 0 }) do
  local image = blank()
  chair(image, 0)
  person(image, lift)
  frames[#frames + 1] = image
end

-- type: bobbing every other frame, quicker than the idle breath
for _, lift in ipairs({ 0, 1, 0, 1 }) do
  local image = blank()
  chair(image, 0)
  person(image, lift)
  frames[#frames + 1] = image
end

-- away: the chair is still pulled out, but empty
local awayImage = blank()
chair(awayImage, 0)
frames[#frames + 1] = awayImage

-- empty: rolled aside, so most of it has left the frame
local emptyImage = blank()
chair(emptyImage, -13)
frames[#frames + 1] = emptyImage

local sprite = Sprite(W, H, ColorMode.RGB)
sprite.filename = out
sprite.layers[1].name = 'character'

local layer = sprite.layers[1]
sprite.cels[1].image = frames[1]
for index = 2, #frames do
  local frame = sprite:newEmptyFrame(index)
  sprite:newCel(layer, frame, frames[index], Point(0, 0))
end

for index = 1, #sprite.frames do
  sprite.frames[index].duration = 0.22
end

local idle = sprite:newTag(1, 4)
idle.name = 'idle'
local typing = sprite:newTag(5, 8)
typing.name = 'type'
local away = sprite:newTag(9, 9)
away.name = 'away'
local empty = sprite:newTag(10, 10)
empty.name = 'empty'

sprite:saveAs(out)
print(string.format('create-character: wrote %s (%dx%d, %d frames)', out, W, H, #sprite.frames))
