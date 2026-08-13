-- Create or redraw weather.aseprite: the moving part of the weather, as a
-- day/night pair per condition, in the same order as WEATHER_CONDITIONS.
--
--   0 clear-day      drifting clouds        5 clear-night     stars, no cloud
--   1 overcast-day   a heavier bank         6 overcast-night  the same, unlit
--   2 fog-day        soft banks             7 fog-night       dimmer banks
--   3 rain-day       vertical streaks       8 rain-night      cooler streaks
--   4 snow-day       scattered flakes       9 snow-night      flakes, still bright
--
-- Night needs its own art rather than a tint: clear night has no clouds at all,
-- it has stars, and no amount of darkening a cloud turns it into one. The page
-- crossfades the pair by how far into night it is, exactly as it does for the
-- sky colour behind them.
--
-- Frame index is a state, not a point in time — the same convention digits and
-- switch use. Motion comes from scrolling the frame at runtime rather than from
-- more frames, so one drawing animates at any speed and the sheet stays small.
--
-- Everything is drawn to wrap: a shape crossing an edge is drawn again on the
-- opposite side, so the frame tiles seamlessly in both axes.
--
-- This is the sky only. It is clipped to the visible glass at runtime, so it
-- never paints over the mic arm or the desk. The sky *colour* stays in
-- room.aseprite's WEATHER layers, which have to be flattened to keep that
-- occlusion correct.
--
-- Redraw one condition, leaving hand-painted work on the others alone:
--   aseprite -b weather.aseprite --script-param only=rain \
--     --script scripts/create-weather.lua
--
-- Create the whole file:
--   aseprite -b --script-param out=weather.aseprite \
--     --script scripts/create-weather.lua
--
-- Overwriting an existing file needs force=1.

local out = app.params['out'] or 'weather.aseprite'
local force = app.params['force'] == '1'
local only = app.params['only']

local CONDITIONS = { 'clear', 'overcast', 'fog', 'rain', 'snow' }
local NIGHT_OFFSET = #CONDITIONS -- frames 5..9 mirror 0..4 after dark
local W, H = 192, 108

if not only and not force then
  local existing = io.open(out, 'r')
  if existing then
    existing:close()
    print('create-weather: ' .. out .. ' already exists — pass force=1 to overwrite')
    return
  end
end

math.randomseed(20260811) -- fixed, so regenerating gives the same starters

local function rgba(r, g, b, a)
  return app.pixelColor.rgba(r, g, b, a)
end

--- Draw with wraparound so the frame tiles.
local function plot(image, x, y, colour)
  image:drawPixel(x % W, y % H, colour)
end

local function blob(image, cx, cy, rx, ry, colour)
  for y = -ry, ry do
    for x = -rx, rx do
      if (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1 then
        plot(image, cx + x, cy + y, colour)
      end
    end
  end
end

--- A cumulus: flat base, lumpy top, shaded underside.
---
--- The previous version was a plain ellipse with a brighter ellipse inside it,
--- which reads as a bullseye rather than as cloud. What makes a cloud legible at
--- any resolution is the silhouette — a flat bottom with humps above it — so
--- this builds one from circles sitting tangent to a baseline, tallest in the
--- middle.
---
--- drawPixel writes rather than blends, so order matters: body, then the
--- highlight inset from the top, then the underside band along the base.
local function cumulus(image, cx, cy, width, height, body, top, under)
  local puffs = math.max(3, width // 7)
  local left = cx - width // 2

  for i = 0, puffs - 1 do
    local t = puffs > 1 and i / (puffs - 1) or 0.5
    -- Sine profile: tall in the middle, tapering to the shoulders.
    local hump = height * (0.42 + 0.58 * math.sin(math.pi * t))
    local r = math.max(2, math.floor(hump / 2))
    blob(image, left + math.floor(t * width), cy - r, r, r, body)
  end

  -- Highlight: the same profile, smaller and lifted, so it catches the top.
  for i = 0, puffs - 1 do
    local t = puffs > 1 and i / (puffs - 1) or 0.5
    local hump = height * (0.42 + 0.58 * math.sin(math.pi * t))
    local r = math.max(1, math.floor(hump / 2) - 2)
    if r >= 1 then
      blob(image, left + math.floor(t * width), cy - r - 3, r, r, top)
    end
  end

  -- Underside: two rows along the flat base, left more transparent so the sky
  -- shows through and it reads as shadow.
  for x = left, left + width do
    for dy = 0, 1 do
      local y = cy - dy
      if image:getPixel(x % W, y % H) ~= 0 then plot(image, x, y, under) end
    end
  end
end

local function cloudField(image, count, minW, maxW, body, top, under)
  for _ = 1, count do
    local width = math.random(minW, maxW)
    cumulus(
      image,
      math.random(0, W - 1),
      math.random(8, H - 1),
      width,
      math.max(6, math.floor(width * 0.42)),
      body,
      top,
      under
    )
  end
end

--- Vertical streaks, falling straight down.
---
--- The streak angle and SKY_MOTION.rain have to agree, or the drops appear to
--- slide across the window instead of down it — the first pass drew at a slope
--- of -0.50 while moving at -0.15 and looked exactly that wrong. Both are now
--- zero horizontally, so they trivially match.
local function rainLayer(image, count, minLen, maxLen, colour)
  for _ = 1, count do
    local x, y = math.random(0, W - 1), math.random(0, H - 1)
    for step = 0, math.random(minLen, maxLen) - 1 do
      plot(image, x, y + step, colour)
    end
  end
end

local images = {}

-- clear: a few well-formed clouds with sky between them
images[1] = Image(W, H, ColorMode.RGB)
cloudField(
  images[1], 5, 26, 46,
  rgba(255, 255, 255, 132), -- body
  rgba(255, 255, 255, 178), -- sunlit top
  rgba(226, 234, 252, 78) -- shaded base
)

-- overcast: wider and overlapping into near-continuous cover, lower contrast
images[2] = Image(W, H, ColorMode.RGB)
cloudField(
  images[2], 13, 38, 68,
  rgba(238, 242, 250, 150),
  rgba(255, 255, 255, 176),
  rgba(198, 206, 222, 116)
)

-- fog: soft banks, not a dither.
--
-- A uniform 2x2 checkerboard reads as a screen door: the grid is regular enough
-- that the eye finds it, and at 50% coverage it sits on the glass rather than
-- behind it. Fog is soft-edged banks of varying density, and it drifts.
--
-- Softness is faked with concentric ellipses of rising alpha. drawPixel writes
-- rather than blends, so the smallest and brightest ring wins and the result
-- steps outward instead of having one hard edge.
function fogBank(image, cx, cy, rx, ry, steps, peak)
  for i = 1, steps do
    local scale = 1 - (i - 1) / steps
    local alpha = math.floor(peak * i / steps)
    blob(
      image,
      cx,
      cy,
      math.max(1, math.floor(rx * scale)),
      math.max(1, math.floor(ry * scale)),
      rgba(238, 242, 250, alpha)
    )
  end
end

-- Banks have to be smaller than a window pane, which is about 30px wide. The
-- first attempt used radii of 46-68 — larger than the whole window — so only
-- the middle of one bank was ever visible and it read as a flat wash with no
-- structure at all. Variation has to happen at a scale you can see through the
-- glass.
images[3] = Image(W, H, ColorMode.RGB)
for _ = 1, 11 do
  fogBank(images[3], math.random(0, W - 1), math.random(0, H - 1), math.random(13, 22), math.random(5, 10), 4, 120)
end
for _ = 1, 18 do
  fogBank(images[3], math.random(0, W - 1), math.random(0, H - 1), math.random(5, 12), math.random(3, 6), 3, 155)
end

-- rain: two depths, because one flat colour reads as static noise.
--
-- Short drops. The visible glass is only about 20px tall per pane, so a 9px
-- streak spanned half a pane and read as heavy streaking rather than rain.
-- Nothing shorter than 2px though: a single pixel moving a pixel a frame reads
-- as flicker rather than as falling.
-- Muted, close to the sky it falls against (rain-day is rgb(120,132,150)).
-- Bright near-white drops read as sleet: rain is water, which refracts rather
-- than glows, so it should barely separate from the sky behind it.
images[4] = Image(W, H, ColorMode.RGB)
-- Thinner than it looks: the renderer draws this tile five times at different
-- speeds, so the on-screen density is roughly two and a half times what is
-- drawn here. Authoring it at full density made five passes read as soup.
rainLayer(images[4], 190, 2, 2, rgba(138, 150, 172, 95)) -- far: barely above sky
rainLayer(images[4], 125, 3, 4, rgba(172, 186, 208, 150)) -- near

-- snow: three depths of flake.
--
-- The first pass had 190 pixels, which left about 16 visible through the glass
-- at any moment — too few to read as snow at all. Snow stays sparser than rain
-- because it is discrete flakes rather than streaks, but it still needs enough
-- of them to register.
images[5] = Image(W, H, ColorMode.RGB)
function flakes(image, count, colour, size)
  for _ = 1, count do
    local x, y = math.random(0, W - 1), math.random(0, H - 1)
    for dy = 0, size - 1 do
      for dx = 0, size - 1 do
        plot(image, x + dx, y + dy, colour)
      end
    end
  end
end
flakes(images[5], 320, rgba(198, 208, 226, 110), 1) -- far: dim specks
flakes(images[5], 140, rgba(232, 238, 250, 170), 1) -- mid
flakes(images[5], 55, rgba(255, 255, 255, 230), 2) -- near: bright 2x2

-- ---- night ---------------------------------------------------------------

-- clear-night: stars. Only about 8% of this canvas is ever visible through the
-- glass, so it takes a lot of them on the full frame to read as a sky.
images[6] = Image(W, H, ColorMode.RGB)
local function stars(image, count, colour)
  for _ = 1, count do
    plot(image, math.random(0, W - 1), math.random(0, H - 1), colour)
  end
end
stars(images[6], 250, rgba(150, 162, 196, 110)) -- faint
stars(images[6], 96, rgba(206, 216, 240, 180)) -- mid
stars(images[6], 34, rgba(255, 255, 255, 245)) -- bright

-- overcast-night: the same bank, unlit. Overcast hides the stars, which is why
-- there are none here.
images[7] = Image(W, H, ColorMode.RGB)
cloudField(
  images[7], 13, 38, 68,
  rgba(96, 104, 126, 140),
  rgba(126, 136, 160, 168),
  rgba(66, 74, 94, 110)
)

-- fog-night: the same banks, dimmer. Fog still catches what light there is.
images[8] = Image(W, H, ColorMode.RGB)
for _ = 1, 11 do
  fogBank(images[8], math.random(0, W - 1), math.random(0, H - 1), math.random(13, 22), math.random(5, 10), 4, 96)
end
for _ = 1, 18 do
  fogBank(images[8], math.random(0, W - 1), math.random(0, H - 1), math.random(5, 12), math.random(3, 6), 3, 124)
end

-- rain-night: cooler and dimmer, but the same shape and slope.
images[9] = Image(W, H, ColorMode.RGB)
rainLayer(images[9], 190, 2, 2, rgba(104, 116, 142, 95))
rainLayer(images[9], 125, 3, 4, rgba(146, 160, 190, 150))

-- snow-night: barely dimmed. Snow stays bright after dark, which is most of
-- why a snowy night reads as a snowy night.
images[10] = Image(W, H, ColorMode.RGB)
flakes(images[10], 320, rgba(170, 180, 202, 110), 1)
flakes(images[10], 140, rgba(206, 214, 232, 170), 1)
flakes(images[10], 55, rgba(244, 248, 255, 230), 2)

-- Redraw a single condition in the sprite already open.
if only then
  local sprite = app.sprite or app.activeSprite
  if not sprite then
    print('create-weather: only= needs the sprite open, e.g. aseprite -b weather.aseprite ...')
    return
  end

  -- only=clear redraws both halves of the pair; only=clear-night just the one.
  local base, half = only:match('^(%a+)%-(%a+)$')
  local wanted = base or only
  local index = nil
  for i, name in ipairs(CONDITIONS) do
    if name == wanted then index = i end
  end
  if not index then
    print('create-weather: no condition named "' .. only .. '"')
    return
  end

  local targets = {}
  if half == 'day' then
    targets = { index }
  elseif half == 'night' then
    targets = { index + NIGHT_OFFSET }
  elseif half then
    print('create-weather: "' .. only .. '" should end -day or -night')
    return
  else
    targets = { index, index + NIGHT_OFFSET }
  end

  local layer = sprite.layers[1]
  for _, target in ipairs(targets) do
    if target > #sprite.frames then
      print(string.format('create-weather: frame %d is outside the %d frames', target, #sprite.frames))
      return
    end
    local cel = layer:cel(target)
    if cel then
      cel.image = images[target]
      cel.position = Point(0, 0)
    else
      sprite:newCel(layer, target, images[target], Point(0, 0))
    end
  end

  sprite:saveAs(sprite.filename)
  print(string.format('create-weather: redrew %s (%d frame(s))', only, #targets))
  return
end

local sprite = Sprite(W, H, ColorMode.RGB)
sprite.filename = out
sprite.layers[1].name = 'weather'

local layer = sprite.layers[1]
sprite.cels[1].image = images[1]
for index = 2, #CONDITIONS * 2 do
  local frame = sprite:newEmptyFrame(index)
  sprite:newCel(layer, frame, images[index], Point(0, 0))
end

sprite:saveAs(out)
print(string.format('create-weather: wrote %s (%dx%d, %d frames)', out, W, H, #sprite.frames))
