"""Inventaris isi file Z-Anatomy (Startup.blend).

Jalankan:
  blender -b assets-src/cache/z-anatomy/Z-Anatomy/Startup.blend --python assets-src/scripts/inventory.py -- out.json

Menulis JSON berisi semua objek mesh: nama, jalur koleksi, jumlah vertex/face,
dan bounding box di koordinat dunia. Dipakai untuk menyusun docs/3d-inventory.md.
"""
import bpy, json, sys
from mathutils import Vector

out = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'inventory.json'

# Peta objek -> jalur koleksi
paths = {}
def walk(coll, prefix):
    p = prefix + [coll.name]
    for o in coll.objects:
        paths.setdefault(o.name, '/'.join(p))
    for c in coll.children:
        walk(c, p)
walk(bpy.context.scene.collection, [])

items = []
for o in bpy.data.objects:
    entry = {
        'name': o.name,
        'type': o.type,
        'collection': paths.get(o.name, ''),
        'parent': o.parent.name if o.parent else None,
        'hidden': o.hide_get() if o.name in bpy.context.view_layer.objects else None,
    }
    if o.type == 'MESH':
        me = o.data
        corners = [o.matrix_world @ Vector(c) for c in o.bound_box]
        entry.update({
            'verts': len(me.vertices),
            'faces': len(me.polygons),
            'min': [round(min(c[i] for c in corners), 4) for i in range(3)],
            'max': [round(max(c[i] for c in corners), 4) for i in range(3)],
            'materials': [m.name for m in me.materials if m],
        })
    items.append(entry)

colls = sorted({i['collection'] for i in items})
with open(out, 'w', encoding='utf-8') as f:
    json.dump({'unit_scale': bpy.context.scene.unit_settings.scale_length,
               'collections': colls, 'objects': items}, f, ensure_ascii=False, indent=1)
print(f'INVENTORY objects={len(items)} meshes={sum(1 for i in items if i["type"]=="MESH")} collections={len(colls)} -> {out}')
