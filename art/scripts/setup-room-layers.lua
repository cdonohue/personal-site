local sprite = app.activeSprite
if not sprite then
  error("Open desk-room-master.aseprite before running this script")
end

local function key(name)
  return string.lower(name):gsub("[^a-z0-9]", "")
end

local function findLayer(layers, names)
  local wanted = {}
  for _, name in ipairs(names) do
    wanted[key(name)] = true
  end
  for _, layer in ipairs(layers) do
    if wanted[key(layer.name)] then
      return layer
    end
  end
  return nil
end

local function ensureGroup(names, canonicalName)
  local group = findLayer(sprite.layers, names)
  if group and not group.isGroup then
    error(group.name .. " exists but is not a group")
  end
  if not group then
    group = sprite:newGroup()
  end
  group.name = canonicalName
  group.parent = sprite
  return group
end

local reference = ensureGroup({ "REFERENCE", "Reference" }, "REFERENCE")
local room = ensureGroup({ "ROOM", "Room" }, "ROOM")
local deskObjects = ensureGroup(
  { "DESK_OBJECTS", "Desk objects", "Desk objects Copy" },
  "DESK_OBJECTS"
)
local character = ensureGroup({ "CHARACTER", "Character" }, "CHARACTER")
local deskFront = ensureGroup({ "DESK_FRONT", "Desk front" }, "DESK_FRONT")
local foreground = ensureGroup({ "FOREGROUND", "Foreground" }, "FOREGROUND")
local lighting = ensureGroup({ "LIGHTING", "Lighting" }, "LIGHTING")

local topLevelBottomToTop = {
  reference,
  room,
  deskObjects,
  character,
  deskFront,
  foreground,
  lighting,
}
for index, layer in ipairs(topLevelBottomToTop) do
  layer.stackIndex = index
end

local roomLayersBottomToTop = {
  "room-shell",
  "floor",
  "doors",
  "bookcase",
  "window-exterior",
  "window-frame",
  "wall-details",
}

for index, name in ipairs(roomLayersBottomToTop) do
  local layer = findLayer(room.layers, { name })
  if not layer then
    layer = sprite:newLayer()
    layer.name = name
    layer.parent = room
  end
  layer.stackIndex = index
end

reference.isExpanded = false
room.isExpanded = true
deskObjects.isExpanded = false
character.isExpanded = false
deskFront.isExpanded = false
foreground.isExpanded = false
lighting.isExpanded = false

sprite:saveAs(sprite.filename)
print("Created normalized top-level groups and seven ROOM layers")
