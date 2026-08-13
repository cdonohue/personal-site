-- Append a looping wireframe-cube screensaver to screen.aseprite, tagged
-- `screensaver`, for the monitor's idle state.
--
-- A single object drawn as edges. Two earlier attempts here — Matrix rain and a
-- starfield — failed the same way: at 46x26 the panel holds about 1200 pixels,
-- and anything built from many small independent elements resolves to noise at
-- that size. The panel can carry shape, not detail. One continuous form is what
-- survives.
--
-- The loop is exact rather than tuned: the cube turns 2*pi over FRAMES steps,
-- so the last frame lands one step short of where it began.
--
-- Edges are shaded by depth rather than hidden-line removed. Across three tones
-- that reads as solid enough, and it costs a midpoint comparison instead of a
-- visibility solve.
--
-- Pass force=1 to rebuild.
--
-- Usage: aseprite -b screen.aseprite --script scripts/add-screensaver.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('add-screensaver: no sprite open')
  return
end

local force = app.params['force'] == '1'
local TAG = 'screensaver'

local existing = nil
for _, tag in ipairs(sprite.tags) do
  if tag.name == TAG then existing = tag end
end

if existing and not force then
  print('add-screensaver: already exists — pass force=1 to rebuild')
  return
end

if existing then
  local from, to = existing.fromFrame.frameNumber, existing.toFrame.frameNumber
  sprite:deleteTag(existing)
  for number = to, from, -1 do
    sprite:deleteFrame(number)
  end
  print(string.format('add-screensaver: removed %d old frames', to - from + 1))
end

local W, H = sprite.width, sprite.height
local FRAMES = 32
local DURATION = 0.09

local CX, CY = W / 2 - 0.5, H / 2 - 0.5
local TILT = 0.58 -- fixed lean, so the top face shows and it reads as 3D
local DIST = 4.4
local FOV = 2.15
-- 12 puts the cube at 20x22 with two pixels of margin. The projection reaches
-- 0.92 of SCALE vertically at its widest turn, so 19 was throwing 35px of cube
-- at a 26px panel and losing nine of them off the top and bottom.
local SCALE = 12

local PLATE = app.pixelColor.rgba(32, 32, 32, 255)

-- Near edges bright, far edges dim. Depth is the only cue there is room for.
local TONES = {
  app.pixelColor.rgba(226, 236, 252, 255),
  app.pixelColor.rgba(150, 170, 208, 255),
  app.pixelColor.rgba(84, 100, 134, 255),
}

local VERTICES = {}
for _, sx in ipairs({ -1, 1 }) do
  for _, sy in ipairs({ -1, 1 }) do
    for _, sz in ipairs({ -1, 1 }) do
      VERTICES[#VERTICES + 1] = { sx, sy, sz }
    end
  end
end

-- Two corners share an edge when they differ on exactly one axis.
local EDGES = {}
for i = 1, #VERTICES do
  for j = i + 1, #VERTICES do
    local differences = 0
    for axis = 1, 3 do
      if VERTICES[i][axis] ~= VERTICES[j][axis] then differences = differences + 1 end
    end
    if differences == 1 then EDGES[#EDGES + 1] = { i, j } end
  end
end

local function project(v, angle)
  local x, y, z = v[1], v[2], v[3]
  -- Spin about the vertical axis...
  local cosA, sinA = math.cos(angle), math.sin(angle)
  x, z = x * cosA - z * sinA, x * sinA + z * cosA
  -- ...then lean towards the viewer.
  local cosT, sinT = math.cos(TILT), math.sin(TILT)
  y, z = y * cosT - z * sinT, y * sinT + z * cosT

  local scale = FOV / (z + DIST)
  return CX + x * scale * SCALE, CY + y * scale * SCALE, z
end

local function line(image, x0, y0, x1, y1, colour)
  x0, y0 = math.floor(x0 + 0.5), math.floor(y0 + 0.5)
  x1, y1 = math.floor(x1 + 0.5), math.floor(y1 + 0.5)
  local dx, dy = math.abs(x1 - x0), -math.abs(y1 - y0)
  local sx = x0 < x1 and 1 or -1
  local sy = y0 < y1 and 1 or -1
  local err = dx + dy

  while true do
    if x0 >= 0 and x0 < W and y0 >= 0 and y0 < H then image:drawPixel(x0, y0, colour) end
    if x0 == x1 and y0 == y1 then break end
    local doubled = 2 * err
    if doubled >= dy then
      err = err + dy
      x0 = x0 + sx
    end
    if doubled <= dx then
      err = err + dx
      y0 = y0 + sy
    end
  end
end

local images = {}
for f = 0, FRAMES - 1 do
  local image = Image(W, H, sprite.colorMode)
  for y = 0, H - 1 do
    for x = 0, W - 1 do
      image:drawPixel(x, y, PLATE)
    end
  end

  local angle = 2 * math.pi * f / FRAMES
  local points = {}
  for i, v in ipairs(VERTICES) do
    local px, py, pz = project(v, angle)
    points[i] = { px, py, pz }
  end

  -- Far edges first, so nearer ones overwrite them where they cross.
  local order = {}
  for i, edge in ipairs(EDGES) do
    order[i] = { edge = edge, depth = (points[edge[1]][3] + points[edge[2]][3]) / 2 }
  end
  table.sort(order, function(a, b) return a.depth > b.depth end)

  for _, entry in ipairs(order) do
    local a, b = points[entry.edge[1]], points[entry.edge[2]]
    -- Depth spans roughly -1.45 to 1.45 after the tilt; map that onto the tones.
    local t = (entry.depth + 1.45) / 2.9
    local tone = TONES[math.max(1, math.min(#TONES, math.floor(t * #TONES) + 1))]
    line(image, a[1], a[2], b[1], b[2], tone)
  end

  images[#images + 1] = image
end

-- Appending extends whichever tag ends on the last frame, so remember every
-- range first and put them all back afterwards. Restoring only the tag you
-- happen to think of leaves the others quietly wrong: ai-work swallowed the
-- power frames, then power-off swallowed the screensaver.
local before = {}
for _, tag in ipairs(sprite.tags) do
  before[#before + 1] = {
    tag = tag,
    from = tag.fromFrame.frameNumber,
    to = tag.toFrame.frameNumber,
  }
end

local layer = sprite.layers[1]
local first = #sprite.frames + 1
for _, image in ipairs(images) do
  local frame = sprite:newEmptyFrame(#sprite.frames + 1)
  frame.duration = DURATION
  sprite:newCel(layer, frame, image, Point(0, 0))
end
local last = #sprite.frames

local tag = sprite:newTag(first, last)
tag.name = TAG

for _, saved in ipairs(before) do
  saved.tag.fromFrame = saved.from
  saved.tag.toFrame = saved.to
end

sprite:saveAs(sprite.filename)

print(string.format(
  'add-screensaver: %s = JSON frames %d-%d, %d frames, %d ms each',
  TAG, first - 1, last - 1, FRAMES, DURATION * 1000))
