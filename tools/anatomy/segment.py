"""Segment the rendered art into muscle regions. venv/bin/python segment.py view"""
import sys, json, cv2, numpy as np
view = sys.argv[1]
SCALE = 8
BOX = {'front': (8, 5), 'back': (231, 3.5)}
im = cv2.imread(f'views/{view}.png')[:, :, ::-1].astype(int)
R, G, B = im[..., 0], im[..., 1], im[..., 2]
muscle = (R - B > 30) & (R > 205) & (R - G > 28)
line = (R - B > 40) & (R <= 205)
core = cv2.erode(muscle.astype(np.uint8), np.ones((3, 3), np.uint8), iterations=1)
n, lab = cv2.connectedComponents(core, connectivity=4)
areas = np.bincount(lab.ravel())
keep = [i for i in range(1, n) if areas[i] >= 600]  # drop specks (< ~9 svg units^2)
remap = np.zeros(n, np.int32)
for k, i in enumerate(keep, 1):
    remap[i] = k
lab = remap[lab]
# grow labels into muscle + line pixels (watershed), so neighbouring regions meet on the drawn lines
markers = lab.copy()
grow = (muscle | line).astype(np.uint8)
markers[(grow == 0)] = -1
markers[(grow == 1) & (lab == 0)] = 0
img8 = np.clip(im, 0, 255).astype(np.uint8)
ws = cv2.watershed(img8.copy(), markers.astype(np.int32))
ox, oy = BOX[view]
out = []
for k in range(1, len(keep) + 1):
    m = (ws == k).astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cs:
        continue
    c = max(cs, key=cv2.contourArea)
    a = cv2.contourArea(c)
    if a < 600:
        continue
    poly = cv2.approxPolyDP(c, 2.0, True)[:, 0, :]
    pts = [[round(ox + x / SCALE, 2), round(oy + y / SCALE, 2)] for x, y in poly]
    M = cv2.moments(c)
    out.append({'n': len(out), 'area': round(a / SCALE / SCALE, 1), 'cx': round(ox + M['m10'] / M['m00'] / SCALE, 2),
                'cy': round(oy + M['m01'] / M['m00'] / SCALE, 2), 'pts': pts})
json.dump(out, open(f'seg_{view}.json', 'w'))
print(view, len(out), 'regions')
# diagnostic image
dg = img8[..., ::-1].copy()
dg = (dg * 0.6 + 255 * 0.4).astype(np.uint8)
rng = np.random.default_rng(1)
for r in out:
    p = np.array([[(x - ox) * SCALE, (y - oy) * SCALE] for x, y in r['pts']], np.int32)
    col = tuple(int(v) for v in rng.integers(0, 200, 3))
    cv2.polylines(dg, [p], True, col, 3)
for r in out:
    x, y = int((r['cx'] - ox) * SCALE), int((r['cy'] - oy) * SCALE)
    cv2.putText(dg, str(r['n']), (x - 14, y + 10), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 6)
    cv2.putText(dg, str(r['n']), (x - 14, y + 10), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 180), 2)
cv2.imwrite(f'seg_{view}.png', dg)
