# Scene item inventory for `/uses`

The `/uses` page begins with the physical products already visible in the pixel
desk. This inventory maps each product to its current source artwork and its
tightly cropped, transparent PNG export.

This is a physical-hardware list, not an addition above the old software
categories. Exact brands, models, links and descriptions live in shared site
content rather than being duplicated here.

## Export contract

- One product per transparent PNG, tightly cropped to its visible pixels.
- The scene's Aseprite sources remain authoritative. Do not maintain a second
  hand-cropped PNG that can drift from the room.
- A product may be composed from several source layers. A shared layer may be
  cropped when the products in it do not overlap; otherwise it must be split.
- Scene state remains separate from product identity. Parked and extended mic
  positions can both exist in the room while `/uses` selects one canonical
  product view.
- Generated product exports should use stable names such as
  `item-monitor.png`; layout code must not know Aseprite layer names.

The item exporter shows the requested product layers, crops them to explicit
bounds, and emits the result beside the other generated art. It is driven by a
mapping in the generated-art contract rather than a list duplicated in the
page. Explicit bounds also let it isolate non-overlapping products that share a
layer without forcing a risky source-art rewrite.

## Confirmed inventory

| product | current source | current isolation | canonical artwork | generated export |
|---|---|---|---|---|
| Autonomous Desk DIY frame | `legs-inner`, `legs-mid`, `legs-outer`, `legs-base`; controller remains separate at `surface/desk-controller` | Frame sections and controller are independently editable | Frame only, without the controller | `item-standing-desk-frame.png` |
| IKEA KARLBY walnut countertop, 74-inch | `desk-front` | Separate source layer | Full countertop surface | `item-desktop-surface.png` |
| MacBook Pro | `mac/macbook-pro` | Separate source sublayer, including pixels reconstructed behind the stand | Laptop without the stand | `item-macbook-pro.png` |
| beyerdynamic DT 900 PRO X headphones | `headphones-hanging` in the room; `headphones.aseprite` for worn poses | Hanging product pose is a separate source layer | Hanging pose | `item-headphones.png` |
| Tidbyt v2 | `clock`; live digits come from `digits.aseprite` | Housing is separate, display content is composited at runtime | Housing with a blank display | `item-tidbyt-v2.png` |
| Shure MV7 microphone | `mic/microphone-parked`; call pose is `mic-extended/microphone-extended` | Both scene states are separate source sublayers | Parked pose | `item-microphone.png` |
| Elgato Wave Mic Arm | `mic/boom-arm-parked`; call pose is `mic-extended/boom-arm-extended` | Both scene states are separate source sublayers | Parked pose | `item-elgato-wave-mic-arm.png` |
| Gigabyte M32U monitor | `screen`; live display content is drawn into the `monitor-screen` slice | Separate source layer, with runtime content layered into it | Monitor body with a dark screen | `item-monitor.png` |
| Ergotron LX monitor arm | `arm` | Separate source layer inside the `MONITOR` group | Complete arm | `item-monitor-arm.png` |
| Opal C1 webcam | `camera` | Separate source layer inside the `MONITOR` group | Camera body without its runtime power state | `item-webcam.png` |
| Fosi K7 audio DAC | `surface/fosi-k7` | Separate source sublayer containing only the device | Device without its mount or tray backing | `item-audio-dac.png` |
| Oeveo Under Mount 139 | `surface/oeveo-tray-left` and `surface/oeveo-tray-right` | Two independently placed, complete tray sublayers with their backing reconstructed behind the devices | The left placement is the canonical product view | `item-oeveo-under-mount-139.png` |
| CalDigit TS4 | `surface/caldigit-ts4` | Separate source sublayer containing only the device | Device without its mount or tray backing | `item-caldigit-ts4.png` |
| Kuzy Laptop Vertical Stand | `mac/kuzy-vertical-stand` | Separate source sublayer above the reconstructed MacBook | The stand without the laptop | `item-kuzy-laptop-vertical-stand.png` |
| Keychron Q2 Max keyboard | `desk-items/keychron-q2-max` | Separate source sublayer | Complete keyboard | `item-keychron-q2-max.png` |
| Logitech MX Master 4 mouse | `desk-items/logitech-mx-master-4` | Separate source sublayer | Complete mouse | `item-logitech-mx-master-4.png` |
| ZSA Voyager keyboard | Not represented in the scene | No source artwork | Text-only entry | None |

The wall, windows, outlets, light switch, power cable and character are scene
structure or interaction rather than `/uses` products and are excluded. The
desk controller remains an independent scene layer but is deliberately excluded
from `/uses` rather than treated as a separate product entry.

The chair is deliberately deferred. Its existing sprite sheet remains part of
the scene, but it is not part of this `/uses` implementation pass.

## Source separation status

All identified physical products in `room.aseprite` now have independent source
layers. Related pieces remain organized as sublayers beneath scene-level groups:

1. `mic` and `mic-extended` each contain separate microphone and boom-arm poses.
2. `mac` contains the closed MacBook and Kuzy stand. The MacBook artwork includes
   the pixels hidden by the stand, while the assembled scene remains unchanged.
3. `desk-items` contains separate keyboard, mouse and MacBook-to-TS4 cable layers.
4. `surface` contains separate trays, devices and desk controller layers. Each
   tray owns its backing pixels, including those hidden behind its device.

The cable remains scene structure rather than a `/uses` product, but it is now
independently editable as `desk-items/macbook-ts4-cable`.

## Current implementation

- Product names, descriptions and outbound links live once in `src/content.ts`.
- `src/themes/pixel-desk/scene/art.ts` maps scene-backed product IDs to source
  layers and crop bounds.
- `export-item.lua` generates the committed product PNGs from `room.aseprite`.
- The pixel-desk theme derives its scene and additional item groups from those
  two contracts, and `/uses` is restored to primary navigation.
