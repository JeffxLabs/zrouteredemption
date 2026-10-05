#!/usr/bin/env python3
"""Export lossless Fighter artwork from original UI_Icon sprite exports.
Usage: python3 tools/export_fighter_assets.py /path/to/original-sprite-pngs
No screenshots, crops, reconstructed art or opaque backgrounds are used.
"""
import json
import sys
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/fighter.json').read_text())
icons = {v['icon'] for key in ('components', 'modules', 'resources') for v in data[key].values()}
icons.add('../assets/fighter/UVA_icon_skin_01.webp')
provenance = {'client': 'v1.30.07', 'catalog': 'P1_V202609071132',
    'atlas': 'SpriteAtlas/UI_Icon.spriteatlas', 'bundle_hash': '70eecdde4d520e321b23d3083e2e5bc4',
    'encoding': 'Lossless WebP; original transparent sprite pixels', 'sprites': {}}
for icon in sorted(icons):
    target = ROOT / icon.removeprefix('../')
    image = Image.open(Path(sys.argv[1]) / (target.stem + '.png')).convert('RGBA')
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, 'WEBP', lossless=True, exact=True)
    assert Image.open(target).convert('RGBA').tobytes() == image.tobytes()
    provenance['sprites'][target.name] = {'sprite': target.stem, 'width': image.width, 'height': image.height}
(ROOT / 'assets/fighter/provenance.json').write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + '\n')
print('Exported and pixel-checked', len(icons), 'original sprites')
