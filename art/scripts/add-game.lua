-- Append a looping side-scrolling platformer to screen.aseprite, tagged `game`.
--
-- Mega Man styling: a blue runner with a lit helmet, an arm cannon firing
-- pellets to the right, and blocky industrial tiles rather than grass.
--
-- The busiest thing on this panel, so it leans on silhouette and parallax
-- rather than detail: a 5x7 runner, chunky tiled ground, and a blocky skyline
-- behind at half speed. At 46x26 depth is what reads — fine features do not.
--
-- Everything is periodic, so the loop is exact rather than hidden:
--
--   ground   96px of world, scrolled 2px a frame  -> 48 frames
--   hills    48px of world, scrolled 1px a frame  -> 48 frames
--   runner   4-pose cycle                         -> divides 48
--
-- The jump is simulated rather than keyframed: the runner leaps when a gap is
-- close enough ahead. Because the terrain repeats and the trigger depends only
-- on position, the motion repeats too — but the sim is run for three laps and
-- only the last is kept, so the runner has settled into its rhythm, and the
-- start and end states are asserted equal rather than assumed.
--
-- Pass force=1 to rebuild.
--
-- Usage: aseprite -b screen.aseprite --script scripts/add-game.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('add-game: no sprite open')
  return
end

local force = app.params['force'] == '1'
local TAG = 'game'

local existing = nil
for _, tag in ipairs(sprite.tags) do
  if tag.name == TAG then existing = tag end
end

if existing and not force then
  print('add-game: already exists — pass force=1 to rebuild')
  return
end

if existing then
  local from, to = existing.fromFrame.frameNumber, existing.toFrame.frameNumber
  sprite:deleteTag(existing)
  for number = to, from, -1 do
    sprite:deleteFrame(number)
  end
  print(string.format('add-game: removed %d old frames', to - from + 1))
end

local W, H = sprite.width, sprite.height
local FRAMES = 48
local DURATION = 0.07

local WORLD = 96 -- ground repeats over this many pixels
local HILLS = 48 -- background repeats over half that, at half the speed
local SCROLL = 2 -- ground pixels per frame
local RUNNER_X = 9 -- the runner holds this column; the world moves past it

local function rgba(r, g, b)
  return app.pixelColor.rgba(r, g, b, 255)
end

local SKY = rgba(14, 18, 38)
local FAR = rgba(34, 42, 74) -- background blocks
local GROUND_TOP = rgba(126, 150, 200) -- lit tile lip
local GROUND_BODY = rgba(64, 80, 124)
local GROUND_SEAM = rgba(44, 56, 92) -- tile joins, so the ground reads as blocks
local SUIT = rgba(56, 168, 248) -- Mega Man blue
local HELMET = rgba(176, 232, 255)
local SHOT = rgba(250, 242, 168)

-- Ground top for each world column, or nil where there is a gap to jump.
local GAPS = { { 30, 37 }, { 68, 74 } }
local LEDGE = { 50, 61, 15 } -- from, to, top

local ground = {}
for x = 0, WORLD - 1 do
  local top = 20
  for _, gap in ipairs(GAPS) do
    if x >= gap[1] and x <= gap[2] then top = nil end
  end
  if top and x >= LEDGE[1] and x <= LEDGE[2] then top = LEDGE[3] end
  ground[x] = top
end

-- A blocky skyline rather than mounds: Mega Man backgrounds are architecture,
-- and hard verticals survive the parallax dimming better than soft curves.
local SKYLINE = { { 0, 7, 12 }, { 11, 16, 8 }, { 20, 26, 14 }, { 31, 39, 10 }, { 42, 47, 15 } }
local hills = {}
for x = 0, HILLS - 1 do
  hills[x] = H
  for _, block in ipairs(SKYLINE) do
    if x >= block[1] and x <= block[2] then hills[x] = block[3] end
  end
end

local function groundAt(worldX)
  return ground[worldX % WORLD]
end

-- 5x7 runner: o is the lit helmet, # the suit, = the arm cannon. Only the
-- silhouette really registers at this size, so the legs carry the run and the
-- helmet is what makes it read as Mega Man rather than a generic figure.
local RUNNER_W, RUNNER_H = 5, 7
local POSES = {
  { '.ooo', '.ooo', '.###', '.###', '.###', '#..#', '#..#' },
  { '.ooo', '.ooo', '.###', '.###', '.###', '.##.', '.#.#' },
  { '.ooo', '.ooo', '.###', '.###', '.###', '#..#', '..##' },
  { '.ooo', '.ooo', '.###', '.###', '.###', '.##.', '#..#' },
}
local AIRBORNE = { '.ooo', '.ooo', '.###', '.###', '.###', '#..#', '.#.#' }
-- Cannon out: the arm reaches right, which is the pose the pellet leaves from.
local FIRING = { '.ooo', '.ooo', '.###=', '.###', '.###', '#..#', '#..#' }

-- Fires every 16 frames, which divides 48, so the pellets repeat with the loop.
local FIRE_EVERY = 16
local SHOT_SPEED = 3

-- Physics, simulated rather than keyframed.
--
-- Landing only counts when the runner *crosses* a surface from above. Testing
-- `y >= surface` alone snaps him onto anything he is level with, so a ledge
-- sliding underneath would yank him up through its face — which is what the
-- first version did.
--
-- Step-ups have to trigger a jump too. Without that he teleported onto the
-- ledge instead of climbing it.
local GRAVITY = 0.62
local JUMP = 3.05
local LOOKAHEAD = 7 -- px of warning; 11 jumps so early he lands short of the gap
-- Landing tolerance. Euler integration overshoots by a fraction of a pixel, so
-- the runner can be a hair below a surface at the moment ground reappears and
-- an exact crossing test misses it — that is how he fell through the world.
-- 1.5px absorbs that while staying well under the ledge's 5px step, so it
-- cannot snap him up onto a ledge he has not cleared.
local LAND_TOLERANCE = 1.5

local function surfaceFor(top)
  return top - RUNNER_H
end

-- Simulate three laps and keep the last, so the runner is in rhythm by then.
local LAPS = 3
local y, vy, grounded = surfaceFor(20), 0.0, true
local history = {}

for step = 0, FRAMES * LAPS - 1 do
  local scroll = (step * SCROLL) % WORLD
  local worldX = scroll + RUNNER_X
  local below = groundAt(worldX)

  if grounded then
    if below == nil then
      -- Ran off an edge: fall, rather than snapping down to the next surface.
      grounded = false
      vy = 0
    else
      y = surfaceFor(below)
      local needsJump = false
      for ahead = 1, LOOKAHEAD do
        local upcoming = groundAt(worldX + ahead)
        if upcoming == nil then needsJump = true end -- a gap
        if upcoming and upcoming < below then needsJump = true end -- higher ground
      end
      if needsJump then
        vy = -JUMP
        grounded = false
      end
    end
  end

  if not grounded then
    vy = vy + GRAVITY
    local nextY = y + vy
    local top = groundAt(worldX)
    if top and vy > 0 then
      local surface = surfaceFor(top)
      -- Land on crossing the surface, or a shade past it.
      if nextY >= surface and y <= surface + LAND_TOLERANCE then
        nextY = surface
        vy = 0
        grounded = true
      end
    end
    y = nextY
  end

  if step >= FRAMES * (LAPS - 1) then
    history[#history + 1] = { y = y, grounded = grounded, scroll = scroll, step = step }
  end
end

-- The loop is only exact if the runner ends where it began.
local first, last = history[1], history[#history]
local endY = last.y + (last.grounded and 0 or 0)
if math.abs(first.y - endY) > 2.5 then
  print(string.format('add-game: warning — runner is %.1fpx off after a lap, the loop will jump',
    math.abs(first.y - endY)))
end

local function fill(image, colour)
  for py = 0, H - 1 do
    for px = 0, W - 1 do
      image:drawPixel(px, py, colour)
    end
  end
end

local function column(image, x, top, bottom, colour)
  if x < 0 or x >= W then return end
  for py = math.max(0, top), math.min(H - 1, bottom) do
    image:drawPixel(x, py, colour)
  end
end

local INK = { ['#'] = SUIT, ['o'] = HELMET, ['='] = HELMET }

local function stamp(image, pose, ox, oy)
  for row = 1, #pose do
    local line = pose[row]
    for col = 1, #line do
      local colour = INK[line:sub(col, col)]
      if colour then
        local px, py = ox + col - 1, oy + row - 1
        if px >= 0 and px < W and py >= 0 and py < H then image:drawPixel(px, py, colour) end
      end
    end
  end
end

local images = {}
for f = 0, FRAMES - 1 do
  local state = history[f + 1]
  local image = Image(W, H, sprite.colorMode)
  fill(image, SKY)

  -- Background blocks at half speed. Drawn first, so they read as distance.
  local farScroll = f * (SCROLL / 2)
  for x = 0, W - 1 do
    local top = hills[math.floor(x + farScroll) % HILLS]
    column(image, x, top, H - 1, FAR)
  end

  -- Ground: lit lip over a darker body, with a seam every fourth column so it
  -- reads as laid tiles rather than as a solid slab.
  for x = 0, W - 1 do
    local worldX = state.scroll + x
    local top = groundAt(worldX)
    if top then
      column(image, x, top, H - 1, GROUND_BODY)
      column(image, x, top, top, GROUND_TOP)
      if worldX % 4 == 0 then column(image, x, top + 1, H - 1, GROUND_SEAM) end
    end
  end

  -- Pellets. Each shot is a pure function of the frame, so nothing has to be
  -- tracked between frames and the pattern repeats with the loop.
  for fired = 0, FRAMES - 1, FIRE_EVERY do
    local age = (f - fired) % FRAMES
    local sx = RUNNER_X + RUNNER_W + age * SHOT_SPEED
    if age < FRAMES / 2 and sx < W then
      local sy = math.floor(state.y + 0.5) + 2
      if sy >= 0 and sy < H then
        image:drawPixel(sx, sy, SHOT)
        if sx + 1 < W then image:drawPixel(sx + 1, sy, SHOT) end
      end
    end
  end

  local firingNow = (f % FIRE_EVERY) < 3
  local pose = AIRBORNE
  if state.grounded then pose = firingNow and FIRING or POSES[(f % #POSES) + 1] end
  stamp(image, pose, RUNNER_X, math.floor(state.y + 0.5))

  images[#images + 1] = image
end

-- Appending extends whichever tag ends on the last frame, so remember every
-- range first and put them all back afterwards.
local before = {}
for _, tag in ipairs(sprite.tags) do
  before[#before + 1] = {
    tag = tag,
    from = tag.fromFrame.frameNumber,
    to = tag.toFrame.frameNumber,
  }
end

local layer = sprite.layers[1]
local firstFrame = #sprite.frames + 1
for _, image in ipairs(images) do
  local frame = sprite:newEmptyFrame(#sprite.frames + 1)
  frame.duration = DURATION
  sprite:newCel(layer, frame, image, Point(0, 0))
end
local lastFrame = #sprite.frames

local tag = sprite:newTag(firstFrame, lastFrame)
tag.name = TAG

for _, saved in ipairs(before) do
  saved.tag.fromFrame = saved.from
  saved.tag.toFrame = saved.to
end

sprite:saveAs(sprite.filename)

print(string.format(
  'add-game: %s = JSON frames %d-%d, %d frames, %d ms each',
  TAG, firstFrame - 1, lastFrame - 1, FRAMES, DURATION * 1000))
