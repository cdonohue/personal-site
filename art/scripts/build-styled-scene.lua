local sprite = app.activeSprite
if not sprite then
  error("Open a desk room sprite before running this script")
end
if sprite.width ~= 384 or sprite.height ~= 216 then
  error("Desk Room expects a 384x216 sprite")
end

local function color(hex, alpha)
  local value = tonumber(hex:sub(2), 16)
  return Color {
    r = math.floor(value / 65536) % 256,
    g = math.floor(value / 256) % 256,
    b = value % 256,
    a = alpha or 255,
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

local function requireGroup(name)
  local layer = findLayer(sprite.layers, name)
  if not layer or not layer.isGroup then
    error("Missing group: " .. name)
  end
  return layer
end

local function ensureLayer(parent, name)
  for _, layer in ipairs(parent.layers) do
    if layer.name == name then
      if layer.isGroup then
        error(name .. " must be an image layer")
      end
      return layer
    end
  end
  local layer = sprite:newLayer()
  layer.name = name
  layer.parent = parent
  return layer
end

local function setOrder(parent, names)
  for index, name in ipairs(names) do
    local layer = ensureLayer(parent, name)
    layer.stackIndex = index
  end
end

local function fill(gc, hex, x, y, width, height, alpha)
  gc.color = color(hex, alpha)
  gc:fillRect(Rectangle(x, y, width, height))
end

local function polygon(gc, hex, points, alpha)
  gc.color = color(hex, alpha)
  gc:beginPath()
  gc:moveTo(points[1][1], points[1][2])
  for index = 2, #points do
    gc:lineTo(points[index][1], points[index][2])
  end
  gc:closePath()
  gc:fill()
end

local function line(gc, hex, width, points, alpha)
  gc.color = color(hex, alpha)
  gc.strokeWidth = width
  gc:beginPath()
  gc:moveTo(points[1][1], points[1][2])
  for index = 2, #points do
    gc:lineTo(points[index][1], points[index][2])
  end
  gc:stroke()
end

local function drawLayer(parent, name, visible, draw)
  local layer = ensureLayer(parent, name)
  local oldCel = layer:cel(1)
  if oldCel then
    sprite:deleteCel(oldCel)
  end
  local image = Image(sprite.spec)
  image:clear(Color { r = 0, g = 0, b = 0, a = 0 })
  local gc = image.context
  gc.antialias = false
  draw(gc)
  sprite:newCel(layer, 1, image, Point(0, 0))
  layer.isVisible = visible
  return layer
end

local room = requireGroup("ROOM")
local desk = requireGroup("DESK_OBJECTS")
local character = requireGroup("CHARACTER")
local deskFront = requireGroup("DESK_FRONT")
local foreground = requireGroup("FOREGROUND")
local lighting = requireGroup("LIGHTING")

local paletteHex = {
  "#111319", "#1a1c22", "#24262d", "#30333a", "#454850", "#5c6068",
  "#767981", "#94969c", "#a9aaad", "#c3c2bd", "#ded9cf", "#f0ece2",
  "#3b3033", "#4d3938", "#65463d", "#7c5140", "#956348", "#b27a54",
  "#1c2935", "#243b49", "#315565", "#487585", "#74a0a8", "#a9c2c4",
  "#2b3430", "#3f5143", "#5a6f54", "#7d8f65", "#a6ad76", "#d1c98e",
  "#382c2a", "#654238", "#925844", "#b87958", "#d39a73", "#e5baa0",
  "#47364c", "#6c4b6e", "#8e668f", "#af7aa0", "#50628c", "#7891bd",
  "#9dafd0", "#d7e0e6", "#cf6a55", "#e69a64", "#f0ce91", "#f4e4b5",
}

app.transaction("Build photographed desk room", function()
  local palette = sprite.palettes[1]
  palette:resize(#paletteHex + 1)
  palette:setColor(0, Color { r = 0, g = 0, b = 0, a = 0 })
  for index, hex in ipairs(paletteHex) do
    palette:setColor(index, color(hex))
  end

  setOrder(room, {
    "room-shell",
    "floor",
    "doors",
    "bookcase",
    "window-exterior",
    "window-frame",
    "blinds-open",
    "blinds-closed",
    "wall-details",
  })

  drawLayer(room, "room-shell", true, function(gc)
    fill(gc, "#94969c", 0, 0, 384, 155)
    polygon(gc, "#c3c2bd", { { 0, 0 }, { 384, 0 }, { 342, 31 }, { 51, 31 } })
    polygon(gc, "#a9aaad", { { 0, 0 }, { 51, 31 }, { 51, 155 }, { 0, 155 } })
    fill(gc, "#767981", 322, 30, 62, 125)
    fill(gc, "#84868d", 51, 29, 291, 4)
  end)

  drawLayer(room, "floor", true, function(gc)
    fill(gc, "#4d3938", 0, 155, 384, 61)
    for y = 163, 215, 12 do
      fill(gc, "#65463d", 0, y, 384, 2)
      fill(gc, "#3b3033", 0, y + 2, 384, 1)
    end
    for x = 8, 382, 34 do
      polygon(gc, "#65463d", { { 191, 155 }, { x, 216 }, { x + 2, 216 }, { 193, 155 } })
    end
    fill(gc, "#30333a", 0, 153, 384, 3)
  end)

  drawLayer(room, "doors", true, function(gc)
    fill(gc, "#ded9cf", 142, 42, 102, 110)
    fill(gc, "#5c6068", 148, 48, 42, 98)
    fill(gc, "#5c6068", 196, 48, 42, 98)
    fill(gc, "#7891bd", 150, 50, 38, 94)
    fill(gc, "#7891bd", 198, 50, 38, 94)
    fill(gc, "#3f5143", 154, 120, 14, 24)
    fill(gc, "#5a6f54", 168, 126, 14, 18)
    fill(gc, "#3f5143", 211, 118, 19, 26)
    fill(gc, "#ded9cf", 190, 44, 6, 106)
    for _, x in ipairs({ 160, 174, 208, 222 }) do
      fill(gc, "#ded9cf", x, 48, 4, 98)
    end
    for _, y in ipairs({ 79, 111 }) do
      fill(gc, "#ded9cf", 148, y, 42, 4)
      fill(gc, "#ded9cf", 196, y, 42, 4)
    end
    fill(gc, "#94969c", 187, 96, 3, 5)
    fill(gc, "#94969c", 196, 96, 3, 5)
  end)

  drawLayer(room, "bookcase", true, function(gc)
    fill(gc, "#1a1c22", 257, 50, 35, 102)
    fill(gc, "#30333a", 262, 55, 25, 92)
    for _, y in ipairs({ 73, 95, 117, 139 }) do
      fill(gc, "#1a1c22", 260, y, 29, 4)
    end
    local books = {
      { 264, 58, 4, 14, "#d1c98e" }, { 269, 61, 3, 11, "#7d8f65" },
      { 273, 57, 6, 15, "#ded9cf" }, { 264, 79, 5, 15, "#b27a54" },
      { 270, 82, 3, 12, "#cf6a55" }, { 274, 77, 6, 17, "#f0ece2" },
      { 264, 101, 3, 15, "#a9c2c4" }, { 268, 99, 5, 17, "#956348" },
      { 274, 103, 7, 13, "#ded9cf" }, { 264, 124, 7, 13, "#5a6f54" },
      { 273, 126, 8, 11, "#c3c2bd" },
    }
    for _, book in ipairs(books) do
      fill(gc, book[5], book[1], book[2], book[3], book[4])
    end
  end)

  drawLayer(room, "window-exterior", true, function(gc)
    fill(gc, "#a9c2c4", 330, 12, 54, 137)
    fill(gc, "#d7e0e6", 330, 12, 54, 70)
    polygon(gc, "#9dafd0", { { 330, 80 }, { 349, 57 }, { 365, 77 }, { 384, 49 }, { 384, 149 }, { 330, 149 } })
    fill(gc, "#5a6f54", 336, 110, 8, 39)
    fill(gc, "#3f5143", 345, 120, 10, 29)
    fill(gc, "#7d8f65", 359, 102, 8, 47)
    fill(gc, "#3f5143", 369, 115, 15, 34)
  end)

  drawLayer(room, "window-frame", true, function(gc)
    fill(gc, "#ded9cf", 326, 8, 58, 5)
    fill(gc, "#ded9cf", 326, 8, 5, 145)
    fill(gc, "#ded9cf", 326, 148, 58, 5)
    fill(gc, "#5c6068", 378, 18, 3, 116)
    fill(gc, "#30333a", 380, 22, 2, 108)
  end)

  drawLayer(room, "blinds-open", false, function(gc)
    for y = 18, 145, 13 do
      fill(gc, "#c3c2bd", 330, y, 54, 2)
    end
  end)

  drawLayer(room, "blinds-closed", true, function(gc)
    fill(gc, "#a9aaad", 330, 13, 54, 136, 90)
    for y = 17, 147, 6 do
      fill(gc, "#ded9cf", 330, y, 54, 2)
      fill(gc, "#767981", 330, y + 2, 54, 1)
    end
  end)

  drawLayer(room, "wall-details", true, function(gc)
    fill(gc, "#ded9cf", 0, 30, 384, 4)
    fill(gc, "#ded9cf", 0, 150, 384, 4)
    fill(gc, "#c3c2bd", 96, 91, 13, 18)
    fill(gc, "#767981", 99, 95, 2, 11)
    fill(gc, "#767981", 105, 95, 2, 11)
    fill(gc, "#ded9cf", 184, 21, 21, 9)
    for x = 188, 202, 4 do
      fill(gc, "#767981", x, 23, 2, 5)
    end
  end)

  setOrder(desk, {
    "desk-legs-stand",
    "desk-legs-sit",
    "desktop",
    "monitor-frame",
    "monitor-screen-off",
    "monitor-screen-on",
    "console",
    "laptop",
    "desk-mat",
    "keyboard-mouse",
    "microphone",
    "headphones-hanging",
  })

  drawLayer(desk, "desk-legs-stand", false, function(gc)
    for _, x in ipairs({ 68, 309 }) do
      fill(gc, "#1a1c22", x, 121, 9, 76)
      fill(gc, "#454850", x + 2, 122, 3, 57)
      fill(gc, "#111319", x - 10, 193, 31, 6)
    end
  end)

  drawLayer(desk, "desk-legs-sit", true, function(gc)
    for _, x in ipairs({ 68, 309 }) do
      fill(gc, "#1a1c22", x, 147, 9, 50)
      fill(gc, "#454850", x + 2, 148, 3, 32)
      fill(gc, "#111319", x - 10, 193, 31, 6)
    end
    fill(gc, "#24262d", 327, 149, 23, 6)
    fill(gc, "#767981", 333, 151, 5, 2)
  end)

  drawLayer(desk, "desktop", true, function(gc)
    fill(gc, "#7c5140", 42, 137, 300, 11)
    fill(gc, "#b27a54", 44, 137, 296, 5)
    for x = 50, 330, 22 do
      fill(gc, x % 44 == 6 and "#956348" or "#7c5140", x, 140, 15, 2)
    end
  end)

  drawLayer(desk, "monitor-frame", true, function(gc)
    fill(gc, "#111319", 147, 73, 93, 57)
    fill(gc, "#30333a", 150, 76, 87, 51)
    fill(gc, "#1a1c22", 189, 130, 9, 8)
    fill(gc, "#30333a", 181, 136, 25, 3)
  end)

  drawLayer(desk, "monitor-screen-off", false, function(gc)
    fill(gc, "#1a1c22", 151, 77, 85, 49)
  end)

  drawLayer(desk, "monitor-screen-on", true, function(gc)
    fill(gc, "#1c2935", 151, 77, 85, 49)
    fill(gc, "#243b49", 154, 80, 16, 43)
    fill(gc, "#315565", 173, 80, 29, 43)
    fill(gc, "#243b49", 205, 80, 28, 43)
    for row = 0, 7 do
      fill(gc, row % 3 == 0 and "#a9c2c4" or "#7891bd", 176, 85 + row * 5, 10 + (row * 6) % 20, 2)
      fill(gc, row % 2 == 0 and "#af7aa0" or "#50628c", 209, 85 + row * 5, 18, 2)
    end
    fill(gc, "#d7e0e6", 199, 110, 2, 6)
  end)

  drawLayer(desk, "console", true, function(gc)
    fill(gc, "#f0ece2", 82, 102, 11, 34)
    fill(gc, "#24262d", 85, 105, 8, 28)
    fill(gc, "#7891bd", 83, 106, 2, 19)
  end)

  drawLayer(desk, "laptop", true, function(gc)
    fill(gc, "#24262d", 109, 106, 36, 31)
    fill(gc, "#454850", 113, 109, 28, 25)
    fill(gc, "#1a1c22", 107, 134, 40, 4)
    fill(gc, "#5c6068", 125, 120, 5, 4)
  end)

  drawLayer(desk, "desk-mat", true, function(gc)
    fill(gc, "#30333a", 158, 128, 86, 10)
    fill(gc, "#454850", 160, 129, 82, 2)
  end)

  drawLayer(desk, "keyboard-mouse", true, function(gc)
    fill(gc, "#24262d", 165, 133, 55, 4)
    for x = 170, 212, 6 do
      fill(gc, "#767981", x, 130, 4, 3)
    end
    fill(gc, "#24262d", 228, 130, 11, 7)
    fill(gc, "#5c6068", 231, 131, 4, 2)
  end)

  drawLayer(desk, "microphone", true, function(gc)
    fill(gc, "#111319", 319, 133, 8, 12)
    polygon(gc, "#1a1c22", { { 322, 135 }, { 345, 82 }, { 351, 84 }, { 328, 137 } })
    polygon(gc, "#24262d", { { 347, 82 }, { 374, 55 }, { 379, 60 }, { 352, 87 } })
    polygon(gc, "#111319", { { 333, 101 }, { 342, 92 }, { 350, 100 }, { 341, 109 } })
    fill(gc, "#454850", 337, 98, 7, 8)
  end)

  drawLayer(desk, "headphones-hanging", true, function(gc)
    fill(gc, "#1a1c22", 56, 145, 3, 24)
    fill(gc, "#1a1c22", 58, 166, 15, 4)
    fill(gc, "#111319", 56, 158, 5, 13)
    fill(gc, "#111319", 69, 158, 5, 13)
    fill(gc, "#454850", 60, 154, 11, 3)
  end)

  setOrder(character, {
    "chair-aside",
    "character-body-stand",
    "character-arms-stand",
    "character-head-stand",
    "headphones-worn-stand",
    "character-body-sit",
    "character-arms-sit",
    "chair-center",
    "character-head-sit",
    "headphones-worn-sit",
  })

  drawLayer(character, "character-body-stand", false, function(gc)
    polygon(gc, "#3f5143", { { 171, 82 }, { 181, 73 }, { 205, 73 }, { 216, 82 }, { 209, 144 }, { 176, 144 } })
    fill(gc, "#5a6f54", 183, 84, 20, 46)
  end)

  drawLayer(character, "character-arms-stand", false, function(gc)
    polygon(gc, "#d39a73", { { 175, 88 }, { 181, 91 }, { 185, 134 }, { 179, 136 } })
    polygon(gc, "#d39a73", { { 211, 88 }, { 205, 91 }, { 201, 134 }, { 207, 136 } })
  end)

  drawLayer(character, "chair-aside", false, function(gc)
    polygon(gc, "#1a1c22", { { 71, 145 }, { 125, 145 }, { 120, 190 }, { 77, 190 } })
    fill(gc, "#30333a", 78, 151, 41, 32)
    for x = 82, 114, 8 do
      fill(gc, "#1a1c22", x, 153, 3, 28)
    end
    fill(gc, "#111319", 95, 188, 6, 18)
    fill(gc, "#1a1c22", 68, 203, 62, 5)
  end)

  drawLayer(character, "character-head-stand", false, function(gc)
    fill(gc, "#d39a73", 181, 56, 24, 23)
    fill(gc, "#654238", 181, 70, 24, 9)
    fill(gc, "#1a1c22", 178, 52, 30, 8)
    fill(gc, "#24262d", 183, 48, 20, 6)
    fill(gc, "#1a1c22", 203, 56, 12, 4)
    fill(gc, "#454850", 177, 64, 8, 3)
    fill(gc, "#454850", 202, 64, 8, 3)
  end)

  drawLayer(character, "headphones-worn-stand", false, function(gc)
    fill(gc, "#111319", 175, 53, 4, 22)
    fill(gc, "#111319", 208, 53, 4, 22)
    fill(gc, "#30333a", 179, 47, 29, 4)
    fill(gc, "#30333a", 173, 63, 6, 13)
    fill(gc, "#30333a", 208, 63, 6, 13)
  end)

  drawLayer(character, "character-body-sit", true, function(gc)
    polygon(gc, "#3f5143", { { 171, 111 }, { 181, 102 }, { 205, 102 }, { 216, 111 }, { 211, 175 }, { 176, 175 } })
    fill(gc, "#5a6f54", 183, 113, 20, 48)
  end)

  drawLayer(character, "character-arms-sit", true, function(gc)
    polygon(gc, "#d39a73", { { 174, 116 }, { 181, 119 }, { 187, 136 }, { 181, 138 } })
    polygon(gc, "#d39a73", { { 212, 116 }, { 205, 119 }, { 199, 136 }, { 205, 138 } })
  end)

  drawLayer(character, "chair-center", true, function(gc)
    polygon(gc, "#1a1c22", { { 162, 144 }, { 224, 144 }, { 218, 190 }, { 168, 190 } })
    polygon(gc, "#30333a", { { 169, 151 }, { 217, 151 }, { 212, 182 }, { 174, 182 } })
    for x = 175, 211, 8 do
      fill(gc, "#1a1c22", x, 153, 3, 28)
    end
    fill(gc, "#111319", 162, 185, 62, 11)
    fill(gc, "#1a1c22", 151, 164, 11, 6)
    fill(gc, "#1a1c22", 224, 164, 11, 6)
    fill(gc, "#111319", 190, 194, 7, 17)
    fill(gc, "#1a1c22", 158, 207, 70, 5)
    polygon(gc, "#1a1c22", { { 193, 205 }, { 153, 214 }, { 151, 211 }, { 191, 201 } })
    polygon(gc, "#1a1c22", { { 193, 205 }, { 233, 214 }, { 235, 211 }, { 195, 201 } })
  end)

  drawLayer(character, "character-head-sit", true, function(gc)
    fill(gc, "#b87958", 181, 86, 24, 23)
    fill(gc, "#654238", 181, 100, 24, 10)
    fill(gc, "#1a1c22", 178, 82, 30, 8)
    fill(gc, "#24262d", 183, 78, 20, 6)
    fill(gc, "#1a1c22", 203, 86, 12, 4)
    fill(gc, "#454850", 177, 94, 8, 3)
    fill(gc, "#454850", 202, 94, 8, 3)
    fill(gc, "#925844", 188, 106, 10, 8)
  end)

  drawLayer(character, "headphones-worn-sit", false, function(gc)
    fill(gc, "#111319", 175, 83, 4, 22)
    fill(gc, "#111319", 208, 83, 4, 22)
    fill(gc, "#30333a", 179, 77, 29, 4)
    fill(gc, "#30333a", 173, 93, 6, 13)
    fill(gc, "#30333a", 208, 93, 6, 13)
  end)

  setOrder(deskFront, { "desk-front" })
  drawLayer(deskFront, "desk-front", true, function(gc)
    fill(gc, "#65463d", 42, 143, 300, 6)
    fill(gc, "#956348", 44, 143, 296, 2)
  end)

  setOrder(foreground, { "floor-shadow" })
  drawLayer(foreground, "floor-shadow", true, function(gc)
    polygon(gc, "#24262d", { { 142, 154 }, { 245, 154 }, { 276, 216 }, { 111, 216 } }, 36)
  end)

  setOrder(lighting, { "overhead-light", "monitor-glow", "window-light" })
  drawLayer(lighting, "overhead-light", false, function(gc)
    fill(gc, "#f0ce91", 0, 0, 384, 216, 28)
    fill(gc, "#f4e4b5", 180, 4, 25, 3)
  end)

  drawLayer(lighting, "monitor-glow", true, function(gc)
    polygon(gc, "#7891bd", { { 150, 126 }, { 237, 126 }, { 263, 216 }, { 121, 216 } }, 26)
  end)

  drawLayer(lighting, "window-light", true, function(gc)
    polygon(gc, "#f4e4b5", { { 330, 72 }, { 384, 55 }, { 384, 193 }, { 276, 157 } }, 42)
  end)
end)

app.refresh()
