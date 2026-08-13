-- Print colour mode and palette info for the open sprite.
local sprite = app.sprite or app.activeSprite
if not sprite then
  print('inspect: no sprite open')
  return
end

local modes = {
  [ColorMode.RGB] = 'RGB',
  [ColorMode.GRAY] = 'GRAY',
  [ColorMode.INDEXED] = 'INDEXED',
  [ColorMode.TILEMAP] = 'TILEMAP',
}

print(string.format('file       : %s', sprite.filename))
print(string.format('colorMode  : %s', modes[sprite.colorMode] or tostring(sprite.colorMode)))
print(string.format('size       : %dx%d, %d frames', sprite.width, sprite.height, #sprite.frames))
print(string.format('palettes   : %d, entries in palette[1]: %d', #sprite.palettes, #sprite.palettes[1]))

local palette = sprite.palettes[1]
for _, index in ipairs({ 0, 21, 23, 25 }) do
  if index < #palette then
    local color = palette:getColor(index)
    print(string.format('  [%2d] rgba(%d,%d,%d,%d)', index, color.red, color.green, color.blue, color.alpha))
  end
end
