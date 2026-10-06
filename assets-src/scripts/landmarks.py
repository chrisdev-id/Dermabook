"""Cetak landmark dari GLB hasil ekspor (cm, sistem Blender: +Z atas, -Y depan wajah).

  blender -b --factory-startup --python assets-src/scripts/landmarks.py -- assets-src/cache/export
"""
import bpy, sys, os
from mathutils import Vector

src = sys.argv[sys.argv.index('--') + 1]
for layer in ['kulit', 'tulang', 'smas-otot']:
    bpy.ops.import_scene.gltf(filepath=os.path.join(src, f'{layer}.glb'))

def bbox(name):
    o = bpy.data.objects.get(name)
    if not o:
        return None
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi

names = [
    'kulit__anterior-segment-of-eyeball-l', 'kulit__nasal-region-l', 'kulit__oral-region-l', 'kulit__nasolabial-sulcus-l',
    'kulit__infra-orbital-region-l', 'kulit__zygomatic-region-l', 'kulit__buccal-region-l', 'kulit__orbital-region-l',
    'kulit__frontal-region-l', 'kulit__temporal-region-l', 'kulit__parotideomasseteric-region-l', 'kulit__mental-region-l',
    'kulit__eyebrow-l', 'kulit__angle-of-mouth-l', 'kulit__mentolabial-sulcus-l', 'kulit__auricular-region-l',
    'tulang__zygomatic-bone-l', 'tulang__maxilla-l', 'tulang__mandible', 'tulang__frontal-bone', 'tulang__nasal-bone-l',
    'smas-otot__superficial-part-of-masseter-l', 'smas-otot__bucinator-l', 'smas-otot__orbital-part-of-orbicularis-oculi-l',
    'smas-otot__zygomaticus-major-muscle-l', 'smas-otot__levator-labii-superioris-l', 'smas-otot__depressor-anguli-oris-l',
    'smas-otot__platysma-l', 'smas-otot__frontalis-muscle-l', 'smas-otot__temporalis-muscle-l',
]
for n in names:
    b = bbox(n)
    if b:
        lo, hi = b
        c = (lo + hi) / 2
        print(f'LM {n:52s} center=({c.x:6.2f},{c.y:6.2f},{c.z:6.2f}) min=({lo.x:6.2f},{lo.y:6.2f},{lo.z:6.2f}) max=({hi.x:6.2f},{hi.y:6.2f},{hi.z:6.2f})')
    else:
        print('LM missing', n)
