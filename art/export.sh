#!/usr/bin/env bash
# Export .aseprite sprites to a PNG sprite sheet + Aseprite JSON.
#
# The JSON is the part that matters and the part the GUI drops: it carries
# frame rects, frame durations, tags, and — for room.aseprite — the slices that
# say where the monitor and clock overlays belong. File > Export As writes only
# a PNG. Use File > Export Sprite Sheet with "JSON Data" ticked, or this.
#
# The webpage runs this automatically (see apps/web/vite-plugin-aseprite.ts);
# this script is for exporting by hand or from CI.
#
# Usage:
#   ./export.sh                 # export anything whose .aseprite is newer
#   ./export.sh --force         # re-export everything
#   ./export.sh digits room     # only these, if stale
#   ./export.sh --force digits  # only these, regardless

set -euo pipefail

ASEPRITE="${ASEPRITE:-/Applications/Aseprite.app/Contents/MacOS/aseprite}"
cd "$(dirname "$0")"

force=0
sprites=()
for arg in "$@"; do
  if [[ "$arg" == "--force" || "$arg" == "-f" ]]; then
    force=1
  else
    sprites+=("${arg%.aseprite}")
  fi
done

if [[ ! -x "$ASEPRITE" ]]; then
  echo "Aseprite not found at $ASEPRITE — set ASEPRITE=/path/to/aseprite" >&2
  exit 1
fi

if [[ ${#sprites[@]} -eq 0 ]]; then
  for f in *.aseprite; do sprites+=("${f%.aseprite}"); done
fi

exported=0
for name in "${sprites[@]}"; do
  src="${name}.aseprite"
  if [[ ! -f "$src" ]]; then
    echo "skip   ${name} (no ${src})" >&2
    continue
  fi

  # Stale when either output is missing or older than the source.
  if [[ $force -eq 0 && -f "${name}.png" && -f "${name}.json" \
        && ! "$src" -nt "${name}.png" && ! "$src" -nt "${name}.json" ]]; then
    printf '%-10s up to date\n' "$name"
    continue
  fi

  "$ASEPRITE" -b "$src" \
    --sheet "${name}.png" \
    --sheet-type horizontal \
    --data "${name}.json" \
    --format json-array \
    --list-layers \
    --list-tags \
    --list-slices
  printf '%-10s -> %s / %s\n' "$name" "${name}.png" "${name}.json"
  exported=$((exported + 1))
done

echo "exported ${exported} sprite(s)"
