"""Split the art into front.svg and back.svg (cropped viewBox, editor metadata removed). python3 split.py art.svg outdir"""
import sys, copy, re
from lxml import etree
src, outdir = sys.argv[1:3]
INK = 'http://www.inkscape.org/namespaces/inkscape'
SOD = 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd'
BOX = {'front': (8, 5, 189, 342), 'back': (231, 3.5, 168, 342)}  # x, y, w, h — same height for both views
DROP = {'front': ['g3613', 'path1379', 'path1381'], 'back': ['g4116']}
CREDIT = ('"Muscles front and back" by OpenStax, Tomáš Kebert &amp; umimeto.org, CC BY-SA 4.0, '
          'https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg — cropped to the {v} view, '
          'editor metadata removed. This file is licensed CC BY-SA 4.0.')
for view in ('front', 'back'):
    root = copy.deepcopy(etree.parse(src).getroot())
    for e in list(root.iter()):
        if not isinstance(e.tag, str):
            continue
        q = etree.QName(e)
        if q.namespace in (INK, SOD) or q.localname in ('metadata',) or (e.get('id') in DROP[view]):
            e.getparent().remove(e)
            continue
        for a in list(e.attrib):
            if etree.QName(a).namespace in (INK, SOD):
                del e.attrib[a]
    x, y, w, h = BOX[view]
    root.set('viewBox', f'{x} {y} {w} {h}')
    root.set('width', str(w)); root.set('height', str(h))
    root.insert(0, etree.fromstring(f'<desc xmlns="http://www.w3.org/2000/svg">{CREDIT.format(v=view)}</desc>'))
    etree.cleanup_namespaces(root)
    s = etree.tostring(root, xml_declaration=True, encoding='UTF-8').decode()
    s = re.sub(r'\n\s*\n', '\n', s)
    open(f'{outdir}/{view}.svg', 'w').write(s)
    print(view, len(s))
