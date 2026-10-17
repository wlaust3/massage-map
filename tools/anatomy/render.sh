#!/usr/bin/env bash
# Render views/front.svg and views/back.svg (from split.py) to 8 px-per-unit PNGs for segment.py.
set -euo pipefail
cd "$(dirname "$0")/work"
for v in front:1512 back:1344; do
  n=${v%%:*}; w=${v##*:}
  echo "<!doctype html><body style='margin:0;background:#fff'><img src='$n.svg' style='width:${w}px;height:2736px;display:block'></body>" > views/$n.html
  google-chrome --headless=new --disable-gpu --hide-scrollbars --allow-file-access-from-files \
    --window-size=$w,2736 --screenshot="$PWD/views/$n.png" "file://$PWD/views/$n.html" 2>/dev/null
done
