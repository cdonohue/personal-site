local sprite = app.activeSprite
if not sprite then error("No active sprite") end
if sprite.width ~= 384 or sprite.height ~= 216 then error("Expected 384x216 sprite") end

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
    if layer.name == name then return layer end
    if layer.isGroup then
      local child = findLayer(layer.layers, name)
      if child then return child end
    end
  end
  return nil
end

local function group(name)
  local layer = findLayer(sprite.layers, name)
  if not layer or not layer.isGroup then error("Missing group " .. name) end
  return layer
end

local function ensureLayer(parent, name)
  for _, layer in ipairs(parent.layers) do
    if layer.name == name then return layer end
  end
  local layer = sprite:newLayer()
  layer.name = name
  layer.parent = parent
  return layer
end

local function fill(gc, hex, x, y, width, height, alpha)
  gc.color = color(hex, alpha)
  gc:fillRect(Rectangle(x, y, width, height))
end

local function polygon(gc, hex, points, alpha)
  gc.color = color(hex, alpha)
  gc:beginPath()
  gc:moveTo(points[1][1], points[1][2])
  for index = 2, #points do gc:lineTo(points[index][1], points[index][2]) end
  gc:closePath()
  gc:fill()
end

local function line(gc, hex, width, points, alpha)
  gc.color = color(hex, alpha)
  gc.strokeWidth = width
  gc:beginPath()
  gc:moveTo(points[1][1], points[1][2])
  for index = 2, #points do gc:lineTo(points[index][1], points[index][2]) end
  gc:stroke()
end

local function hash(x, y, salt)
  return (x * 73 + y * 151 + salt * 199 + x * y * 7) % 997
end

local function scatter(gc, region, colors, threshold, salt, step)
  step = step or 2
  for y = region[2], region[2] + region[4] - 1, step do
    for x = region[1], region[1] + region[3] - 1, step do
      local value = hash(x, y, salt)
      if value % 100 < threshold then
        local chosen = colors[(value % #colors) + 1]
        fill(gc, chosen, x, y, value % 3 == 0 and 2 or 1, 1)
      end
    end
  end
end

local function drawLayer(parent, name, visible, draw)
  local layer = ensureLayer(parent, name)
  local oldCel = layer:cel(1)
  if oldCel then sprite:deleteCel(oldCel) end
  local image = Image(sprite.spec)
  image:clear(Color { r = 0, g = 0, b = 0, a = 0 })
  local gc = image.context
  gc.antialias = false
  draw(gc)
  sprite:newCel(layer, 1, image, Point(0, 0))
  layer.isVisible = visible
  return layer
end

local room = group("ROOM")
local desk = group("DESK_OBJECTS")
local character = group("CHARACTER")
local foreground = group("FOREGROUND")
local lighting = group("LIGHTING")

app.transaction("High fidelity desk room pass", function()
  local palette = sprite.palettes[1]
  local added = {
    "#888b92", "#9da0a6", "#b3b4b3", "#cac8c1", "#e7e2d8",
    "#403438", "#584044", "#704b46", "#87584b", "#a66c53", "#c38b68",
    "#16232d", "#1e3440", "#294956", "#376575", "#5a8792", "#83aab0",
    "#202824", "#303c33", "#475844", "#66775a", "#879274", "#b1b38b",
    "#2a2428", "#3c3037", "#53404a", "#6b5260", "#897080", "#aa94a1",
  }
  local oldSize = #palette
  palette:resize(oldSize + #added)
  for index, hex in ipairs(added) do palette:setColor(oldSize + index - 1, color(hex)) end

  -- Replace schematic floor with layered wood planks and irregular grain.
  drawLayer(room, "floor", true, function(gc)
    fill(gc, "#4a3537", 0, 153, 384, 63)
    for y = 157, 215, 10 do
      fill(gc, y % 20 == 7 and "#5d3f3e" or "#563a3b", 0, y, 384, 9)
      fill(gc, "#362c31", 0, y + 9, 384, 1)
      fill(gc, "#795047", 0, y, 384, 1)
    end
    for x = 7, 380, 31 do
      polygon(gc, "#362c31", { { 191, 153 }, { x, 216 }, { x + 1, 216 }, { 192, 153 } })
    end
    scatter(gc, { 0, 156, 384, 60 }, { "#6b4541", "#815448", "#3f3034" }, 19, 4, 2)
    for y = 160, 211, 12 do
      for x = 12 + (y % 24), 372, 42 do
        fill(gc, "#8e5d4d", x, y, 8 + (x % 9), 1)
        fill(gc, "#403034", x + 4, y + 3, 11, 1)
      end
    end
  end)

  -- Material texture only occupies exposed walls/ceiling, never the furniture.
  drawLayer(room, "room-material-texture", true, function(gc)
    scatter(gc, { 2, 36, 47, 113 }, { "#9da0a6", "#888b92", "#b3b4b3" }, 11, 1, 3)
    scatter(gc, { 53, 36, 87, 113 }, { "#9da0a6", "#888b92", "#b3b4b3" }, 10, 2, 3)
    scatter(gc, { 246, 36, 10, 113 }, { "#9da0a6", "#888b92" }, 12, 3, 2)
    scatter(gc, { 294, 36, 27, 113 }, { "#888b92", "#9da0a6" }, 13, 5, 3)
    scatter(gc, { 58, 5, 276, 22 }, { "#cac8c1", "#b3b4b3", "#d4d1ca" }, 8, 7, 4)
    -- Recess depth and fine crown-molding highlights.
    fill(gc, "#888b92", 51, 27, 291, 3)
    fill(gc, "#e7e2d8", 51, 31, 291, 2)
    fill(gc, "#b3b4b3", 5, 30, 374, 1)
    fill(gc, "#767981", 52, 34, 269, 2)
    fill(gc, "#cac8c1", 8, 149, 312, 2)
  end)

  -- Add depth, reflective glass, fine frames, and lived-in shelf detail.
  drawLayer(room, "architecture-detail", true, function(gc)
    -- French-door cast shadow and bevels.
    fill(gc, "#6f7279", 140, 45, 3, 108, 150)
    fill(gc, "#777b81", 244, 45, 3, 108, 130)
    fill(gc, "#f1ede4", 144, 42, 98, 2)
    fill(gc, "#b9b8b4", 145, 149, 98, 3)
    for _, x in ipairs({ 151, 165, 179, 199, 213, 227 }) do
      fill(gc, "#d8e4e7", x, 51, 2, 24, 80)
      fill(gc, "#9dafb4", x + 2, 51, 1, 24, 95)
    end
    for _, x in ipairs({ 151, 165, 179, 199, 213, 227 }) do
      fill(gc, "#d8e4e7", x, 84, 2, 23, 55)
    end
    -- Exterior foliage visible through the French doors.
    local foliage = {
      { 151, 125, 5, 18, "#303c33" }, { 156, 117, 8, 26, "#475844" },
      { 164, 124, 9, 19, "#66775a" }, { 204, 121, 7, 22, "#303c33" },
      { 211, 114, 10, 29, "#475844" }, { 221, 123, 10, 20, "#879274" },
    }
    for _, item in ipairs(foliage) do fill(gc, item[5], item[1], item[2], item[3], item[4]) end
    -- Bookcase bevel, shelf shadows, and irregular book tops.
    fill(gc, "#0d1015", 255, 52, 3, 100, 170)
    fill(gc, "#555861", 260, 51, 29, 2)
    fill(gc, "#111319", 289, 53, 3, 99)
    for _, y in ipairs({ 74, 96, 118, 140 }) do
      fill(gc, "#0d1015", 259, y, 31, 3)
      fill(gc, "#555861", 262, y - 1, 25, 1)
    end
    local bookMarks = {
      { 264, 61, "#e7e2d8" }, { 270, 65, "#879274" }, { 275, 60, "#c38b68" },
      { 264, 84, "#83aab0" }, { 270, 80, "#d9c98e" }, { 277, 86, "#aa94a1" },
      { 264, 105, "#b1b38b" }, { 271, 101, "#e7e2d8" }, { 278, 108, "#c38b68" },
    }
    for _, mark in ipairs(bookMarks) do
      fill(gc, mark[3], mark[1], mark[2], 2, 6)
      fill(gc, "#f4ead8", mark[1], mark[2], 1, 2)
    end
    -- Window sill, exterior stone/foliage, and layered blind cords.
    fill(gc, "#f0ece2", 326, 149, 58, 5)
    fill(gc, "#92959d", 326, 154, 58, 3)
    scatter(gc, { 333, 18, 45, 127 }, { "#c9d9db", "#9db5b8", "#718c83", "#9ba67d" }, 18, 12, 3)
    fill(gc, "#575a62", 376, 17, 2, 120)
    fill(gc, "#d7d3ca", 378, 22, 1, 108)
    fill(gc, "#43464e", 379, 89, 3, 8)
  end)

  -- Wood grain, bevels, hardware, and dense equipment rendering.
  drawLayer(desk, "equipment-fidelity", true, function(gc)
    -- Desktop bevel and grain.
    fill(gc, "#d39a73", 44, 137, 296, 2)
    fill(gc, "#5b3b37", 42, 147, 300, 2)
    for x = 49, 333, 17 do
      local length = 5 + (hash(x, 140, 8) % 15)
      fill(gc, x % 34 == 15 and "#c48661" or "#6e463d", x, 141 + (x % 3), length, 1)
    end
    fill(gc, "#e0ac80", 82, 139, 44, 1)
    fill(gc, "#5f3c37", 250, 144, 59, 1)
    -- Leg bevels, telescoping seams, feet, and control display.
    for _, x in ipairs({ 68, 309 }) do
      fill(gc, "#0d1015", x, 149, 2, 47)
      fill(gc, "#555861", x + 6, 149, 2, 31)
      fill(gc, "#777b81", x + 3, 180, 3, 2)
      fill(gc, "#30333a", x - 10, 193, 31, 2)
    end
    fill(gc, "#0d1015", 325, 148, 27, 8)
    fill(gc, "#7891bd", 333, 151, 6, 2)
    fill(gc, "#d7e0e6", 340, 151, 2, 2)
    -- Ultrawide casing depth, camera, controls, and screen reflections.
    fill(gc, "#05070a", 146, 72, 95, 3)
    fill(gc, "#555861", 150, 74, 87, 2)
    fill(gc, "#0d1015", 146, 128, 95, 3)
    fill(gc, "#8795a7", 191, 73, 6, 2)
    fill(gc, "#83aab0", 154, 79, 2, 44, 70)
    fill(gc, "#d7e0e6", 232, 80, 2, 38, 45)
    for row = 0, 9 do
      local y = 82 + row * 4
      fill(gc, row % 3 == 0 and "#8fbcc0" or "#7188ad", 174, y, 11 + hash(row, y, 1) % 23, 1)
      fill(gc, row % 2 == 0 and "#bd7ca8" or "#8e668f", 208, y, 8 + hash(row, y, 2) % 17, 2)
      if row % 2 == 0 then fill(gc, "#d7e0e6", 158, y, 6, 1) end
    end
    fill(gc, "#cf6a55", 224, 113, 6, 4)
    fill(gc, "#7d8f65", 212, 116, 9, 3)
    -- Laptop metal edge, hinge, and small logo.
    fill(gc, "#687079", 112, 107, 30, 2)
    fill(gc, "#15181e", 111, 132, 32, 3)
    fill(gc, "#9da0a6", 125, 119, 5, 5)
    fill(gc, "#cac8c1", 127, 119, 2, 2)
    fill(gc, "#0d1015", 106, 136, 42, 2)
    -- Console contours, vents, and status light; no controller.
    fill(gc, "#ffffff", 81, 103, 2, 31)
    fill(gc, "#c9cbd0", 91, 104, 3, 30)
    fill(gc, "#0d1015", 84, 106, 2, 26)
    for y = 109, 128, 5 do fill(gc, "#555861", 87, y, 5, 1) end
    fill(gc, "#7891bd", 82, 128, 2, 3)
    -- Desk mat stitching, split keyboard keys, and mouse highlight.
    fill(gc, "#1a1c22", 157, 127, 88, 12)
    fill(gc, "#555861", 158, 128, 86, 1)
    for x = 168, 215, 5 do
      fill(gc, "#252a31", x, 130, 4, 3)
      fill(gc, "#767b84", x + 1, 130, 2, 1)
    end
    fill(gc, "#111319", 191, 130, 3, 7)
    polygon(gc, "#171a20", { { 228, 131 }, { 232, 128 }, { 238, 130 }, { 239, 136 }, { 229, 137 } })
    fill(gc, "#6d7179", 232, 130, 3, 1)
    -- Mic capsule, mesh, joints, springs, and cable.
    fill(gc, "#080a0d", 334, 96, 15, 14)
    fill(gc, "#3f434b", 337, 98, 8, 9)
    for y = 99, 105, 2 do fill(gc, "#777b81", 339, y, 5, 1) end
    fill(gc, "#62666e", 344, 82, 5, 5)
    fill(gc, "#62666e", 371, 56, 6, 6)
    line(gc, "#767981", 1, { { 326, 134 }, { 348, 83 }, { 376, 57 } })
    line(gc, "#0d1015", 2, { { 348, 86 }, { 356, 102 }, { 350, 123 } })
    -- Hanging headphones with padded band and cable.
    line(gc, "#0d1015", 3, { { 57, 149 }, { 57, 160 }, { 62, 154 }, { 69, 154 }, { 73, 161 } })
    fill(gc, "#343840", 55, 159, 7, 13)
    fill(gc, "#343840", 68, 159, 7, 13)
    fill(gc, "#737780", 57, 161, 2, 8)
    fill(gc, "#737780", 70, 161, 2, 8)
    line(gc, "#202329", 1, { { 73, 170 }, { 70, 189 }, { 63, 198 } })
  end)

  -- Replace schematic character with layered, shaped anatomy and curved mesh chair.
  drawLayer(character, "character-body-sit", true, function(gc)
    polygon(gc, "#202824", { { 169, 112 }, { 177, 104 }, { 185, 100 }, { 202, 100 }, { 210, 104 }, { 218, 112 }, { 215, 166 }, { 171, 166 } })
    polygon(gc, "#3f5143", { { 174, 112 }, { 182, 106 }, { 204, 106 }, { 213, 113 }, { 208, 160 }, { 178, 160 } })
    fill(gc, "#66775a", 184, 108, 18, 3)
    fill(gc, "#303c33", 177, 151, 32, 10)
    scatter(gc, { 180, 113, 27, 36 }, { "#475844", "#66775a", "#303c33" }, 16, 21, 3)
  end)

  drawLayer(character, "character-arms-sit", true, function(gc)
    polygon(gc, "#a66c53", { { 174, 113 }, { 181, 115 }, { 187, 128 }, { 190, 136 }, { 184, 139 }, { 178, 129 } })
    polygon(gc, "#d39a73", { { 179, 116 }, { 182, 118 }, { 187, 130 }, { 185, 134 }, { 182, 130 } })
    polygon(gc, "#a66c53", { { 212, 113 }, { 205, 115 }, { 199, 128 }, { 196, 136 }, { 202, 139 }, { 208, 129 } })
    polygon(gc, "#d39a73", { { 207, 116 }, { 204, 118 }, { 199, 130 }, { 201, 134 }, { 204, 130 } })
    fill(gc, "#e5baa0", 184, 134, 7, 4)
    fill(gc, "#e5baa0", 195, 134, 7, 4)
  end)

  drawLayer(character, "chair-center", true, function(gc)
    -- Curved Herman-Miller-like mesh back; no headrest.
    polygon(gc, "#0d1015", { { 157, 140 }, { 164, 135 }, { 222, 135 }, { 229, 140 }, { 224, 188 }, { 216, 195 }, { 170, 195 }, { 162, 188 } })
    polygon(gc, "#24282f", { { 164, 142 }, { 169, 139 }, { 217, 139 }, { 222, 143 }, { 217, 184 }, { 211, 189 }, { 175, 189 }, { 169, 184 } })
    polygon(gc, "#343941", { { 170, 144 }, { 216, 144 }, { 211, 181 }, { 175, 181 } })
    for x = 174, 211, 5 do
      line(gc, x % 10 == 4 and "#171a20" or "#202329", 2, { { x, 146 }, { x + (x < 193 and 3 or -3), 180 } })
    end
    for y = 149, 177, 7 do fill(gc, "#555a62", 173, y, 40, 1) end
    fill(gc, "#0a0c10", 163, 185, 60, 12)
    fill(gc, "#2d3138", 168, 185, 50, 3)
    -- Arms and polished supports.
    fill(gc, "#111319", 146, 161, 16, 7)
    fill(gc, "#111319", 224, 161, 16, 7)
    fill(gc, "#555a62", 149, 162, 10, 2)
    fill(gc, "#555a62", 227, 162, 10, 2)
    fill(gc, "#0d1015", 189, 195, 8, 17)
    fill(gc, "#444850", 192, 196, 3, 12)
    polygon(gc, "#111319", { { 193, 207 }, { 151, 214 }, { 150, 211 }, { 190, 201 } })
    polygon(gc, "#111319", { { 193, 207 }, { 235, 214 }, { 236, 211 }, { 196, 201 } })
    fill(gc, "#07090c", 147, 211, 10, 4)
    fill(gc, "#07090c", 229, 211, 10, 4)
  end)

  drawLayer(character, "character-head-sit", true, function(gc)
    -- Neck, ears, head, hair mass, cap seams, brim, and glasses temples.
    fill(gc, "#925844", 187, 103, 13, 10)
    fill(gc, "#c38b68", 180, 84, 26, 21)
    fill(gc, "#e5baa0", 183, 86, 20, 13)
    fill(gc, "#a66c53", 178, 91, 4, 10)
    fill(gc, "#a66c53", 205, 91, 4, 10)
    polygon(gc, "#654238", { { 180, 96 }, { 185, 91 }, { 203, 91 }, { 206, 97 }, { 203, 105 }, { 183, 105 } })
    scatter(gc, { 184, 94, 18, 10 }, { "#382c2a", "#654238", "#87584b" }, 28, 33, 2)
    polygon(gc, "#111319", { { 176, 83 }, { 181, 77 }, { 202, 76 }, { 210, 82 }, { 209, 89 }, { 178, 89 } })
    polygon(gc, "#30333a", { { 181, 79 }, { 199, 78 }, { 205, 82 }, { 183, 83 } })
    fill(gc, "#555a62", 192, 77, 2, 6)
    fill(gc, "#111319", 206, 86, 12, 4)
    fill(gc, "#6b6f78", 208, 87, 7, 1)
    fill(gc, "#30333a", 175, 93, 9, 3)
    fill(gc, "#30333a", 203, 93, 9, 3)
    fill(gc, "#777b84", 178, 93, 6, 1)
    fill(gc, "#777b84", 203, 93, 6, 1)
  end)

  -- Matching standing anatomy, kept hidden until that state is selected.
  drawLayer(character, "character-body-stand", false, function(gc)
    polygon(gc, "#202824", { { 169, 80 }, { 178, 71 }, { 208, 71 }, { 217, 80 }, { 211, 143 }, { 175, 143 } })
    polygon(gc, "#3f5143", { { 175, 80 }, { 182, 75 }, { 204, 75 }, { 211, 81 }, { 207, 140 }, { 179, 140 } })
    scatter(gc, { 181, 82, 25, 49 }, { "#475844", "#66775a", "#303c33" }, 15, 41, 3)
  end)

  drawLayer(character, "character-arms-stand", false, function(gc)
    polygon(gc, "#a66c53", { { 174, 84 }, { 181, 86 }, { 187, 130 }, { 182, 136 }, { 177, 105 } })
    polygon(gc, "#a66c53", { { 212, 84 }, { 205, 86 }, { 199, 130 }, { 204, 136 }, { 209, 105 } })
    fill(gc, "#e5baa0", 181, 132, 8, 5)
    fill(gc, "#e5baa0", 197, 132, 8, 5)
  end)

  drawLayer(character, "character-head-stand", false, function(gc)
    fill(gc, "#925844", 187, 72, 13, 10)
    fill(gc, "#c38b68", 180, 53, 26, 21)
    fill(gc, "#654238", 181, 65, 24, 10)
    polygon(gc, "#111319", { { 176, 52 }, { 181, 46 }, { 202, 45 }, { 210, 51 }, { 209, 58 }, { 178, 58 } })
    fill(gc, "#30333a", 175, 62, 9, 3)
    fill(gc, "#30333a", 203, 62, 9, 3)
  end)

  -- Pixel-clustered ambient occlusion and directional highlights.
  drawLayer(foreground, "contact-shadows", true, function(gc)
    polygon(gc, "#161219", { { 51, 195 }, { 94, 195 }, { 105, 201 }, { 42, 202 } }, 95)
    polygon(gc, "#161219", { { 293, 195 }, { 336, 195 }, { 348, 201 }, { 283, 202 } }, 95)
    polygon(gc, "#161219", { { 150, 208 }, { 237, 208 }, { 249, 215 }, { 139, 215 } }, 115)
    fill(gc, "#242028", 255, 150, 39, 5, 80)
    fill(gc, "#242028", 143, 150, 104, 4, 60)
  end)

  drawLayer(lighting, "fidelity-light", true, function(gc)
    -- Crisp dithered sun path from right window.
    polygon(gc, "#f4e4b5", { { 330, 56 }, { 384, 45 }, { 384, 180 }, { 283, 155 } }, 28)
    for y = 73, 174, 5 do
      local left = math.max(284, 330 - math.floor((y - 56) * 0.45))
      for x = left + (y % 3), 381, 5 do
        if hash(x, y, 55) % 100 < 42 then fill(gc, "#f4e4b5", x, y, 2, 1, 35) end
      end
    end
    -- Screen rim light on shoulders, hands, and chair mesh.
    fill(gc, "#7891bd", 177, 106, 2, 32, 85)
    fill(gc, "#7891bd", 208, 106, 2, 32, 85)
    fill(gc, "#9dafd0", 184, 134, 7, 1, 100)
    fill(gc, "#9dafd0", 195, 134, 7, 1, 100)
    fill(gc, "#50628c", 166, 144, 2, 40, 65)
    fill(gc, "#50628c", 218, 144, 2, 40, 65)
  end)
end)

app.refresh()
