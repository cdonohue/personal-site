-- Append an unlit ("burn-in") copy of an existing frame.
--
-- A 7-segment cell is never truly blank: when a digit is not in use you still
-- see its unlit segments. So the off states are frames in their own right,
-- mirroring the silhouette of a lit frame in the ghost grey.
--
-- Frame layout in digits.aseprite (0-based, as the exported JSON sees it):
--   0..9  the digit of that value
--   10    colon lit          11  colon dim   (from source=10)
--   12    digit cell blank   (from source=8 — every segment, all unlit)
--
-- `source` is the exported-JSON frame index, which is what the webpage code
-- talks in. Aseprite's own frame numbers are 1-based; the conversion is here so
-- it only has to be right in one place.
--
-- Usage:
--   aseprite -b digits.aseprite --script-param source=8 --script-param dim=21 \
--     --script scripts/add-dim-frame.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('add-dim-frame: no sprite open')
  return
end

local source = tonumber(app.params['source'])
local dimIndex = tonumber(app.params['dim']) or 21

if not source then
  print('add-dim-frame: needs --script-param source=N (0-based JSON frame index)')
  return
end

local sourceFrame = source + 1
if sourceFrame < 1 or sourceFrame > #sprite.frames then
  print(string.format('add-dim-frame: source %d is outside the %d frames', source, #sprite.frames))
  return
end

local layer = sprite.layers[1]
local sourceCel = layer:cel(sourceFrame)
if not sourceCel then
  print(string.format('add-dim-frame: no cel on frame %d', source))
  return
end

local transparent = sprite.transparentColor
local sourceImage = sourceCel.image

local dim = Image(sprite.width, sprite.height, sprite.colorMode)
dim:clear(transparent)

local count = 0
for y = 0, sourceImage.height - 1 do
  for x = 0, sourceImage.width - 1 do
    if sourceImage:getPixel(x, y) ~= transparent then
      dim:drawPixel(x + sourceCel.position.x, y + sourceCel.position.y, dimIndex)
      count = count + 1
    end
  end
end

-- Idempotent: if this exact frame is already present, adding it again would
-- shift every later frame index and silently break the webpage's mapping.
local function matches(cel)
  if not cel then return false end
  for y = 0, sprite.height - 1 do
    for x = 0, sprite.width - 1 do
      local a = dim:getPixel(x, y)
      local bx, by = x - cel.position.x, y - cel.position.y
      local b = transparent
      if bx >= 0 and by >= 0 and bx < cel.image.width and by < cel.image.height then
        b = cel.image:getPixel(bx, by)
      end
      if a ~= b then return false end
    end
  end
  return true
end

for number = 1, #sprite.frames do
  if matches(layer:cel(number)) then
    print(string.format('add-dim-frame: frame %d already holds this image, nothing to do', number - 1))
    return
  end
end

local frame = sprite:newEmptyFrame(#sprite.frames + 1)
sprite:newCel(layer, frame, dim, Point(0, 0))

print(string.format(
  'add-dim-frame: source %d -> new frame %d, %d pixels at palette index %d',
  source, #sprite.frames - 1, count, dimIndex
))

sprite:saveAs(sprite.filename)
