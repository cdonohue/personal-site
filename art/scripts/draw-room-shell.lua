local sprite = app.activeSprite
if not sprite then
  app.alert("Open desk-room-master.aseprite first")
  return
end

if sprite.width ~= 384 or sprite.height ~= 216 then
  app.alert("Desk Room expects a 384x216 sprite")
  return
end

local function color(hex)
  local value = tonumber(hex:sub(2), 16)
  return Color {
    r = math.floor(value / 65536) % 256,
    g = math.floor(value / 256) % 256,
    b = value % 256,
    a = 255,
  }
end

local function findLayer(layers, name)
  for _, layer in ipairs(layers) do
    if layer.name == name then
      return layer
    end
    if layer.isGroup then
      local child = findLayer(layer.layers, name)
      if child then
        return child
      end
    end
  end
  return nil
end

local paletteHex = {
  "#0f1117", "#17191f", "#20232a", "#2a2e34",
  "#3d424a", "#555b64", "#817f78", "#aaa69a",
  "#c3beb2", "#eee8db", "#68442f", "#82583e",
  "#513329", "#7a4d31", "#a66e45", "#d7a16d",
  "#202d58", "#30416f", "#6586bd", "#9aaed3",
  "#9ed3df", "#f0e8ca", "#dc7656", "#f0a26a",
  "#3e6344", "#4e7650", "#8f866e", "#d3c5a1",
  "#3b2d28", "#a56f55", "#bd896b", "#e0d8c4",
}

local roomShell = findLayer(sprite.layers, "room-shell")
if not roomShell then
  app.alert("Missing ROOM/room-shell layer")
  return
end

app.transaction("Build desk room shell", function()
  local palette = sprite.palettes[1]
  palette:resize(#paletteHex + 1)
  palette:setColor(0, Color { r = 0, g = 0, b = 0, a = 0 })
  for index, hex in ipairs(paletteHex) do
    palette:setColor(index, color(hex))
  end

  local oldCel = roomShell:cel(1)
  if oldCel then
    sprite:deleteCel(oldCel)
  end

  local image = Image(sprite.spec)
  image:clear(Color { r = 0, g = 0, b = 0, a = 0 })
  local gc = image.context
  gc.antialias = false

  gc.color = color("#aaa69a")
  gc:fillRect(Rectangle(0, 0, 384, 155))

  gc.color = color("#c3beb2")
  gc:beginPath()
  gc:moveTo(0, 0)
  gc:lineTo(384, 0)
  gc:lineTo(342, 31)
  gc:lineTo(51, 31)
  gc:closePath()
  gc:fill()

  gc.color = color("#817f78")
  gc:fillRect(Rectangle(322, 30, 62, 125))

  gc.color = color("#b4aea2")
  gc:beginPath()
  gc:moveTo(0, 31)
  gc:lineTo(51, 31)
  gc:lineTo(51, 155)
  gc:lineTo(0, 155)
  gc:closePath()
  gc:fill()

  sprite:newCel(roomShell, 1, image, Point(0, 0))
  roomShell.isVisible = true
end)

app.refresh()
app.alert("Room shell and 33-color palette created. Review, then save with Cmd+S.")
