"""Turn the segmented regions into per-muscle tap shapes and write src/assets/anatomy/musclePaths.ts.

Usage: venv/bin/python build.py <out.ts>
Inputs (from segment.py): seg_front.json, seg_back.json, views/back.png
"""
import json
import sys

import cv2
import numpy as np
from shapely.geometry import Polygon, box
from shapely.ops import unary_union

SCALE = 8
BOX = {'front': (8, 5, 189, 342), 'back': (231, 3.5, 168, 342)}  # must match split.py
AXIS = {'front': 102.15, 'back': 315.04}  # mirror line (x) of each figure
# Which person-side sits on the viewer's left half of each view.
LEFT_HALF_SIDE = {'front': 'r', 'back': 'l'}

# base -> view -> (source regions given by their approximate centre (x, y) in art units, which viewer half they are on). Regions are drawn on one half and
# matched with (or mirrored to) the other half.
L, R = 'left', 'right'
MAP = {
    # ---- front
    'frontalis': {'front': ([(96.1, 22.6)], L)},
    'temporalis': {'front': ([(88.7, 26.1)], L)},
    'masseter': {'front': ([(90.4, 46.1)], L)},
    'sternocleidomastoid': {'front': ([(94.0, 64.0)], L)},
    'trapezius-upper': {'front': ([(83.7, 64.3)], L), 'back': ('trap-upper', L)},
    'deltoid-anterior': {'front': ([(64.7, 76.6)], L)},
    'pectoralis-major': {'front': ([(83.5, 91.4)], L)},
    'biceps-brachii': {'front': ([(55.8, 109.7)], L)},
    'brachialis': {'front': ([(59.8, 119.5), (55.0, 124.3)], L)},
    'brachioradialis': {'front': ([(39.5, 139.4)], L), 'back': ([(265.2, 142.0)], L)},
    'pronator-teres': {'front': ([(49.4, 136.0)], L)},
    'flexor-carpi-radialis': {'front': ([(41.3, 153.9)], L)},
    'palmaris-longus': {'front': ([(41.2, 160.3)], L)},
    'flexor-carpi-ulnaris': {'front': ([(42.0, 162.0)], L)},
    'thenar': {'front': ([(19.4, 186.0), (23.7, 185.9)], L)},
    'hypothenar': {'front': ([(33.5, 189.5)], L)},
    'rectus-abdominis': {'front': ([(93.6, 118.2), (93.6, 128.4), (93.7, 138.6), (94.8, 156.2)], L)},
    'external-oblique': {'front': ([(77.0, 131.9)], L)},
    'iliopsoas': {'front': ([(85.6, 170.5)], L)},
    'tensor-fasciae-latae': {'front': ([(71.8, 182.3)], L)},
    'sartorius': {'front': ([(86.1, 184.7)], L)},
    'pectineus': {'front': ([(89.8, 176.5)], L)},
    'adductor-longus': {'front': ([(93.7, 183.4)], L)},
    'gracilis': {'front': ([(97.5, 189.7)], L), 'back': ([(310.4, 209.3)], L)},
    'rectus-femoris': {'front': ([(81.8, 208.4)], L)},
    'vastus-lateralis': {'front': ([(76.7, 219.3)], L)},
    'vastus-medialis': {'front': ([(93.7, 221.7)], L)},
    'tibialis-anterior': {'front': ([(84.3, 273.3)], L)},
    'extensor-digitorum-longus': {'front': ([(79.5, 279.8)], L)},
    'fibularis-longus': {'front': ([(77.0, 276.2)], L)},
    'extensor-digitorum-brevis': {'front': ([(89.4, 327.6), (93.8, 327.9)], L)},
    # ---- back
    'occipitalis': {'back': ([(307.5, 35.6)], L)},
    'splenius-capitis': {'back': ([(303.9, 52.0)], L)},
    'trapezius-middle': {'back': ('trap-middle', L)},
    'trapezius-lower': {'back': ('trap-lower', L)},
    'deltoid-posterior': {'back': ([(278.7, 91.8)], L)},
    'infraspinatus': {'back': ([(293.1, 96.7), (299.2, 100.1)], L)},
    'teres-major': {'back': ([(289.4, 105.2)], L)},
    'rhomboid-major': {'back': ([(300.2, 106.0)], L)},
    'latissimus-dorsi': {'back': ([(304.7, 137.8)], L)},
    'erector-spinae': {'back': ('fascia', L)},
    'triceps-brachii': {'back': ([(279.2, 117.4), (270.8, 131.4)], L)},
    'forearm-extensors': {'back': ([(270.4, 157.3), (258.2, 170.1), (263.8, 163.4)], L)},
    'thumb-extensors': {'back': ([(252.1, 175.8)], L)},
    'gluteus-medius': {'back': ([(294.6, 152.6)], L)},
    'gluteus-maximus': {'back': ([(296.8, 177.6)], L)},
    'biceps-femoris': {'back': ([(297.3, 212.8), (292.6, 207.4)], L)},
    'semitendinosus': {'back': ([(304.2, 207.4)], L)},
    'semimembranosus': {'back': ([(308.4, 206.3)], L)},
    'gastrocnemius-medial': {'back': ([(323.7, 260.7)], R)},
    'gastrocnemius-lateral': {'back': ([(334.0, 260.8)], R)},
    'soleus': {'back': ([(308.1, 295.3), (298.4, 296.6)], L)},
}

# Trapezius (back region 6) is split into three parts by horizontal cuts (y in art units).
TRAP_REGION, TRAP_CUTS = (307.2, 81.9), (77.0, 101.0)


def load(view):
    return {r['n']: r for r in json.load(open(f'seg_{view}.json'))}


SEG = {v: load(v) for v in ('front', 'back')}


def poly(r):
    return Polygon(r['pts']).buffer(0)


def find(view, pt):
    """The segmented region whose centre is at `pt` (fails loudly if the segmentation changed)."""
    r = min(SEG[view].values(), key=lambda r: abs(r['cx'] - pt[0]) + abs(r['cy'] - pt[1]))
    assert abs(r['cx'] - pt[0]) + abs(r['cy'] - pt[1]) < 1.5, (view, pt)
    return r['n']


def half_box(view, half):
    a = AXIS[view]
    return box(a - 200, -10, a, 400) if half == L else box(a, -10, a + 200, 400)


def mirror(p, view):
    a = AXIS[view]
    return Polygon([(2 * a - x, y) for x, y in p.exterior.coords]).buffer(0)


def counterpart(view, n):
    """The matching region on the other half, if the segmentation found a clean one."""
    src = SEG[view][n]
    mx = 2 * AXIS[view] - src['cx']
    best = None
    for r in SEG[view].values():
        if r['n'] == n:
            continue
        d = abs(r['cx'] - mx) + abs(r['cy'] - src['cy'])
        if d < 2.5 and 0.8 < r['area'] / src['area'] < 1.25 and (best is None or d < best[0]):
            best = (d, r['n'])
    return best and best[1]


def special(name, view):
    if name.startswith('trap-'):
        t = poly(SEG['back'][find('back', TRAP_REGION)])
        x0, y0, x1, y1 = t.bounds
        lo, hi = {'trap-upper': (y0 - 1, TRAP_CUTS[0]), 'trap-middle': TRAP_CUTS, 'trap-lower': (TRAP_CUTS[1], y1 + 1)}[name]
        return [t.intersection(box(x0 - 1, lo, x1 + 1, hi))], None
    if name == 'fascia':
        # The pale thoracolumbar fascia over the lower back: tendon-coloured component under the lats, left half only.
        im = cv2.imread('views/back.png')[:, :, ::-1].astype(int)
        r, g, b = im[..., 0], im[..., 1], im[..., 2]
        pale = ((b >= r - 4) & (r > 205)).astype(np.uint8)
        ox, oy = BOX['back'][:2]
        seed = (int((AXIS['back'] - 4 - ox) * SCALE), int((150 - oy) * SCALE))
        n, lab = cv2.connectedComponents(pale, connectivity=4)
        m = (lab == lab[seed[1], seed[0]]).astype(np.uint8)
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        c = cv2.approxPolyDP(max(cs, key=cv2.contourArea), 2.0, True)[:, 0, :]
        p = Polygon([(ox + x / SCALE, oy + y / SCALE) for x, y in c]).buffer(0)
        # keep the lower part (below the shoulder blades) of the left half
        p = p.intersection(box(AXIS['back'] - 40, 118, AXIS['back'], 168))
        return [p], None
    raise KeyError(name)


def shapes_for(view, spec):
    src, half = spec
    if isinstance(src, str):
        own, _ = special(src, view)
        other = [mirror(p, view) for p in own]
    else:
        own, other = [], []
        for pt in src:
            n = find(view, pt)
            own.append(poly(SEG[view][n]))
            m = counterpart(view, n)
            other.append(poly(SEG[view][m]) if m is not None else mirror(own[-1], view))
    left_side = LEFT_HALF_SIDE[view]
    right_side = 'l' if left_side == 'r' else 'r'
    own_side, other_side = (left_side, right_side) if half == L else (right_side, left_side)
    other_half = R if half == L else L
    # never let a shape cross the body's centre line
    own = [p.intersection(half_box(view, half)) for p in own]
    other = [p.intersection(half_box(view, other_half)) for p in other]
    return {own_side: own, other_side: other}


def to_d(polys, view):
    ox, oy = BOX[view][:2]
    parts = []
    for p in polys:
        geoms = getattr(p, 'geoms', [p])
        for g in geoms:
            if g.is_empty or g.area < 1:
                continue
            g = g.simplify(0.15)
            pts = list(g.exterior.coords)[:-1]
            parts.append('M' + 'L'.join(f'{x - ox:.1f} {y - oy:.1f}' for x, y in pts) + 'Z')
    assert parts, 'empty shape'
    return ''.join(parts)


def main(out):
    paths = {'front': {}, 'back': {}}
    for base, views in MAP.items():
        for view, spec in views.items():
            for side, polys in shapes_for(view, spec).items():
                paths[view][f'{base}-{side}'] = to_d(polys, view)
    lines = [
        '// GENERATED by tools/anatomy/build.py - do not edit by hand.',
        '//',
        '// Tap shapes traced from "Muscles front and back" by OpenStax, Tomáš Kebert & umimeto.org',
        '// (https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg), licensed CC BY-SA 4.0.',
        '// As a derivative of that drawing, this file is also licensed CC BY-SA 4.0 (see ATTRIBUTION.md).',
        '',
        "import type { View } from '../../data/muscles';",
        '',
        '/** Size of each view in art units; path coordinates are relative to the view\'s top-left corner. */',
        'export const ART_SIZE: Record<View, { width: number; height: number }> = {',
    ]
    for v in ('front', 'back'):
        lines.append(f'  {v}: {{ width: {BOX[v][2]}, height: {BOX[v][3]} }},')
    lines += ['};', '', '/** `<muscle base>-<l|r>` -> SVG path data, per view. */',
              'export const MUSCLE_PATHS: Record<View, Record<string, string>> = {']
    for v in ('front', 'back'):
        lines.append(f'  {v}: {{')
        for k in sorted(paths[v]):
            lines.append(f"    '{k}': '{paths[v][k]}',")
        lines.append('  },')
    lines.append('};')
    open(out, 'w').write('\n'.join(lines) + '\n')
    print(sum(len(p) for p in paths.values()), 'shapes;', len('\n'.join(lines)) // 1024, 'KiB')


main(sys.argv[1])
