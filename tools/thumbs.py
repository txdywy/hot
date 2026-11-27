#!/usr/bin/env python3
"""Small copies of every logo and character picture for the team cards.

The cards show each picture about 38 px tall, so loading the full picture (up to
250 KB each, 10 to 16 per series) for every card wastes the phone's data. This
writes public/assets/logos/thumbs/<same path>, at most 200 x 120 px, for each
file listed in `logos` in public/assets/teams.js. The frame itself still draws
from the full picture.

Run after adding or replacing a picture:  python3 tools/thumbs.py
Needs Pillow (pip install pillow). Uses pngquant to shrink PNGs when installed.
After replacing a picture at the same path, also raise logoVersion in teams.js,
or phones that saw the old picture keep showing it.
"""
import re, shutil, subprocess, sys
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent / 'public' / 'assets'
logos = root / 'logos'
thumbs = logos / 'thumbs'
BOX = (200, 120)

table = (root / 'teams.js').read_text(encoding='utf-8')
block = re.search(r'export const logos = \{(.*?)\n\};', table, re.S)
if not block:
    sys.exit('Could not find "export const logos = {" in teams.js')
paths = sorted(set(re.findall(r':\s*"([^"]+)"', block.group(1))) | set(re.findall(r":\s*'([^']+)'", block.group(1))))
pngquant = shutil.which('pngquant')
made = 0
for rel in paths:
    src = logos / rel
    if not src.exists() or src.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
        continue
    dst = thumbs / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    im.load()
    im = im.convert('RGBA' if src.suffix.lower() == '.png' else 'RGB')
    im.thumbnail(BOX, Image.LANCZOS)
    if src.suffix.lower() == '.png':
        im.save(dst, optimize=True)
        if pngquant:
            subprocess.run([pngquant, '--quality=70-95', '--speed', '1', '--skip-if-larger',
                            '--force', '--ext', '.png', str(dst)], check=False)
    else:
        im.save(dst, quality=82, optimize=True, progressive=True)
    made += 1
listed = {logos / 'thumbs' / rel for rel in paths}
for old in thumbs.rglob('*'):
    if old.is_file() and old not in listed:
        old.unlink()
print(f'{made} thumbnails in {thumbs.relative_to(root.parent.parent)}')
