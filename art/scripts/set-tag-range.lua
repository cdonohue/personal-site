-- Set a tag's frame range.
--
-- Appending frames to a sprite extends any tag that ended on the last frame,
-- silently. screen.aseprite's `ai-work` covered 0-71 and became 0-81 the moment
-- the power frames were added, which would have played the power-on and
-- power-off frames as part of the content loop.
--
-- `from` and `to` are exported-JSON indices, which is what the webpage talks in.
--
-- Usage:
--   aseprite -b screen.aseprite --script-param tag=ai-work \
--     --script-param from=0 --script-param to=71 \
--     --script scripts/set-tag-range.lua

local sprite = app.sprite or app.activeSprite
if not sprite then
  print('set-tag-range: no sprite open')
  return
end

local name = app.params['tag']
local from = tonumber(app.params['from'])
local to = tonumber(app.params['to'])

if not name or from == nil or to == nil then
  print('set-tag-range: needs tag, from and to')
  return
end

if from < 0 or to >= #sprite.frames or from > to then
  print(string.format(
    'set-tag-range: %d-%d is not a valid range in a %d frame sprite',
    from, to, #sprite.frames))
  return
end

for _, tag in ipairs(sprite.tags) do
  if tag.name == name then
    local wasFrom = tag.fromFrame.frameNumber - 1
    local wasTo = tag.toFrame.frameNumber - 1
    tag.fromFrame = from + 1
    tag.toFrame = to + 1
    sprite:saveAs(sprite.filename)
    print(string.format('set-tag-range: %s %d-%d -> %d-%d', name, wasFrom, wasTo, from, to))
    return
  end
end

print('set-tag-range: no tag named "' .. name .. '"')
