# Anatomy art pipeline

Generates the body-map art and tap shapes from
[“Muscles front and back”](https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg)
(OpenStax, Tomáš Kebert & umimeto.org, **CC BY-SA 4.0**). Outputs, all CC BY-SA 4.0:

- `src/assets/anatomy/front.svg`, `back.svg`: the drawing, cropped to each view, editor metadata removed.
- `src/assets/anatomy/musclePaths.ts`: one tap shape per muscle and side, traced from the drawing.

You only need this to change the art or the muscle list. Requires Python 3 with `numpy`,
`opencv-python-headless`, `shapely` and `lxml`, plus Google Chrome (for rendering).

```bash
cd tools/anatomy && mkdir -p work/views
curl -L -o work/source.svg https://upload.wikimedia.org/wikipedia/commons/e/ef/Muscles_front_and_back.svg
python split.py work/source.svg work/views          # front.svg / back.svg (copy these to src/assets/anatomy/)
./render.sh                                         # views/*.png at 8 px per art unit
cd work && python ../segment.py front && python ../segment.py back   # seg_*.json (+ seg_*.png to inspect)
python ../build.py ../../../src/assets/anatomy/musclePaths.ts
```

How it works: `segment.py` splits the rendered drawing into the regions enclosed by its outlines (muscle-coloured
pixels, grown to meet on the drawn lines). `build.py` names regions by their centre point (`MAP`), merges or splits
them (the trapezius is cut into upper / middle / lower; the lower back is the pale fascia under the lats), pairs each
with its counterpart on the other side of the body (or mirrors it) and writes simplified SVG paths. If the
segmentation changes, `build.py` stops with the centre point it can no longer find; look at `seg_<view>.png` and
update `MAP`. `work/` is git-ignored.
