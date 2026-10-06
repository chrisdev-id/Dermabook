"""Membangun lapisan SKEMATIK yang tidak ada di Z-Anatomy: kompartemen lemak superfisial,
kompartemen lemak dalam, ligamen retensi, dan lembaran SMAS.

Jalankan setelah export_head.py (memakai GLB mentah di cache/export):
  blender -b --factory-startup --python assets-src/scripts/build_schematic.py -- assets-src/cache/export

Semua struktur di sini adalah ILUSTRASI SKEMATIK (extras.schematic = True) yang disusun
dari deskripsi literatur, bukan hasil pencitraan:
  - Rohrich & Pessa 2007 (PMID 17519724), Gierloff dkk. 2012 (PMID 21915077, 22658728)
  - Swift dkk. 2021 (PMC8438644) bagian "Fat"; Clark dkk. 2023 (PMC10541169) bagian "Anatomy"
  - Alghoul & Codner 2013 (PMID 23855010); Mendelson dkk. 2002 (PMID 12172155); Mitz & Peyronie 1976
Posisi ditentukan relatif terhadap landmark model (region kulit, tulang, otot), bukan koordinat manual.

Sistem koordinat setelah impor glTF di Blender: cm, +Z atas, -Y ke depan wajah, +X sisi kiri pasien.
"""
import bpy, bmesh, sys, os, math, json
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree

SRC = sys.argv[sys.argv.index('--') + 1]
for layer in ['kulit', 'tulang', 'smas-otot']:
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, f'{layer}.glb'))

OBJ = {o.name: o for o in bpy.data.objects if o.type == 'MESH'}
SOURCE = 'Skematik Dermabook.id (berdasarkan literatur; lihat content/structures)'

# ── Utilitas ──────────────────────────────────────────────────────────────

def world_faces(name):
    """(pusat, normal, daftar koordinat sudut) setiap face dari objek, di koordinat dunia."""
    o = OBJ.get(name)
    if not o:
        return []
    mw = o.matrix_world
    nm = mw.to_3x3().inverted().transposed()
    me = o.data
    out = []
    for p in me.polygons:
        vs = [mw @ me.vertices[i].co for i in p.vertices]
        out.append((mw @ p.center, (nm @ p.normal).normalized(), vs))
    return out

def bvh_of(names):
    verts, polys = [], []
    for n in names:
        for _, _, vs in world_faces(n):
            base = len(verts)
            verts.extend(vs)
            polys.append(list(range(base, base + len(vs))))
    return BVHTree.FromPolygons(verts, polys)

def mesh_from_faces(faces, weld=0.03):
    bm = bmesh.new()
    for _, _, vs in faces:
        bvs = [bm.verts.new(v) for v in vs]
        try:
            bm.faces.new(bvs)
        except ValueError:
            pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=weld)
    drop_small_islands(bm)
    bm.normal_update()
    return bm

def drop_small_islands(bm, min_share=0.12, min_faces=12):
    """Buang potongan kecil yang terpisah (serpihan dari seleksi per face)."""
    bm.faces.ensure_lookup_table()
    seen, islands = set(), []
    for f in bm.faces:
        if f.index in seen:
            continue
        stack, island = [f], []
        seen.add(f.index)
        while stack:
            cur = stack.pop()
            island.append(cur)
            for e in cur.edges:
                for nb in e.link_faces:
                    if nb.index not in seen:
                        seen.add(nb.index)
                        stack.append(nb)
        islands.append(island)
    if not islands:
        return
    biggest = max(len(i) for i in islands)
    doomed = [f for i in islands if len(i) < max(min_faces, biggest * min_share) for f in i]
    if doomed:
        bmesh.ops.delete(bm, geom=doomed, context='FACES')

def center_of(name):
    o = OBJ[name]
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return sum(pts, Vector()) / 8

def side_x(x, side):
    return x if side == 'l' else -x

def mirror_name(n, side):
    return n.replace('-l', f'-{side}') if side == 'r' else n

new_objects = {'lemak-superfisial': [], 'lemak-dalam': [], 'ligamen': [], 'smas': []}

def finish(bm, name, layer, color, thickness, offset_out=0.0, offset_in=0.0, smooth=2):
    """Geser permukaan (keluar/dalam sepanjang normal), tebalkan, haluskan, lalu jadikan objek."""
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * (offset_out - offset_in)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if smooth:
        sm = ob.modifiers.new('smooth', 'SMOOTH')
        sm.factor, sm.iterations = 0.5, smooth
    so = ob.modifiers.new('solid', 'SOLIDIFY')
    so.thickness = thickness
    so.offset = 1.0 if offset_out > 0 else -1.0
    so.use_even_offset = True
    dg = bpy.context.evaluated_depsgraph_get()
    me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(dg), depsgraph=dg)
    ob.modifiers.clear()
    ob.data = me2
    me2.name = name
    for p in me2.polygons:
        p.use_smooth = True
    # Warna per struktur lewat atribut warna (COLOR_0 di glTF)
    attr = me2.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    for d in attr.data:
        d.color = (*color, 1.0)
    ob['schematic'] = True
    ob['source'] = SOURCE
    ob['side'] = name[-1] if name[-2:] in ('-l', '-r') else ''
    new_objects[layer].append(ob)
    print(f'SCHEMA {name}: {len(me2.polygons)} face')
    return ob

def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

# ── Landmark (sisi kiri; sisi kanan dicerminkan pada X) ─────────────────────
eye = center_of('kulit__anterior-segment-of-eyeball-l')
EYE_X, EYE_Z = eye.x, eye.z
sulcus = [c for c, _, _ in world_faces('kulit__nasolabial-sulcus-l')]

def sulcus_x_at(z):
    """Posisi X lipatan nasolabial pada ketinggian z (sisi kiri), interpolasi dari mesh sulcus."""
    near = sorted(sulcus, key=lambda p: abs(p.z - z))[:6]
    return sum(p.x for p in near) / len(near)

SULCUS_TOP = max(p.z for p in sulcus)
SULCUS_BOTTOM = min(p.z for p in sulcus)

# ── Lemak superfisial (di bawah kulit, di atas SMAS) ───────────────────────
SKIN_T = 0.15  # perkiraan tebal kulit (cm), ilustratif
SUP = srgb('#f6d16b')
superficial = [
    # nama, region kulit sumber, filter(pusat face, sisi), tebal (cm), warna
    ('dahi-sentral', ['kulit__frontal-region-l', 'kulit__frontal-region-r'],
     lambda c, s: abs(c.x) < 1.2 and c.z > EYE_Z + 2.9, 0.25, '#f3c95a', True),
    ('dahi-tengah', ['kulit__frontal-region-l'],
     lambda c, s: 1.2 <= side_x(c.x, s) < 4.6 and c.z > EYE_Z + 2.9, 0.25, '#f7d982', False),
    ('lateral-temporal-pipi', ['kulit__frontal-region-l', 'kulit__temporal-region-l', 'kulit__parotideomasseteric-region-l'],
     lambda c, s: side_x(c.x, s) >= 4.6 and c.y < 1.0, 0.35, '#e9b949', False),
    ('orbital-superior', ['kulit__orbital-region-l'],
     lambda c, s: c.z > EYE_Z + 0.9 and side_x(c.x, s) < EYE_X + 1.4, 0.15, '#f9e3a1', False),
    ('orbital-inferior', ['kulit__orbital-region-l'],
     lambda c, s: c.z < EYE_Z - 0.9 and side_x(c.x, s) < EYE_X + 1.4, 0.15, '#f5d27a', False),
    ('orbital-lateral', ['kulit__orbital-region-l'],
     lambda c, s: side_x(c.x, s) >= EYE_X + 1.4, 0.18, '#eec35f', False),
    ('nasolabial', ['kulit__infra-orbital-region-l', 'kulit__buccal-region-l', 'kulit__nasolabial-sulcus-l'],
     lambda c, s: SULCUS_BOTTOM - 0.3 < c.z < SULCUS_TOP + 0.4 and 0 <= side_x(c.x, s) - sulcus_x_at(c.z) < 1.0, 0.5, '#f2b84b', False),
    ('pipi-medial', ['kulit__infra-orbital-region-l', 'kulit__buccal-region-l'],
     lambda c, s: c.z < EYE_Z - 1.2 and c.z > SULCUS_TOP - 1.8 and side_x(c.x, s) - sulcus_x_at(c.z) >= 1.0 and side_x(c.x, s) < EYE_X + 1.0, 0.45, '#f7cd6a', False),
    ('pipi-tengah', ['kulit__zygomatic-region-l', 'kulit__infra-orbital-region-l', 'kulit__buccal-region-l'],
     lambda c, s: side_x(c.x, s) >= EYE_X + 1.0 and c.z > SULCUS_BOTTOM + 0.3 and side_x(c.x, s) < 5.6, 0.45, '#efc35e', False),
    ('jowl', ['kulit__buccal-region-l'],
     lambda c, s: c.z <= SULCUS_BOTTOM + 0.3 and side_x(c.x, s) - sulcus_x_at(max(c.z, SULCUS_BOTTOM)) >= 0.6, 0.45, '#e5ad3f', False),
    ('mental', ['kulit__mental-region-l', 'kulit__mental-region-r'],
     lambda c, s: True, 0.35, '#f0c766', True),
]
for name, regions, rule, thick, col, midline in superficial:
    sides = ['m'] if midline else ['l', 'r']
    for s in sides:
        regs = regions if midline else [mirror_name(r, s) for r in regions]
        faces = [f for r in regs for f in world_faces(r) if rule(f[0], 'l' if s == 'm' else s)]
        if len(faces) < 3:
            print('SKIP', name, s)
            continue
        bm = mesh_from_faces(faces)
        nm = f'lemak-superfisial__{name}' + ('' if s == 'm' else f'-{s}')
        finish(bm, nm, 'lemak-superfisial', srgb(col), thick, offset_in=SKIN_T, smooth=5)

# ── Lembaran SMAS (di bawah lemak superfisial) ─────────────────────────────
smas_regions = ['kulit__temporal-region-l', 'kulit__zygomatic-region-l', 'kulit__infra-orbital-region-l',
                'kulit__buccal-region-l', 'kulit__parotideomasseteric-region-l', 'kulit__submandibular-triangle-l']
for s in ['l', 'r']:
    faces = [f for r in smas_regions for f in world_faces(mirror_name(r, s))
             if side_x(f[0].x, s) - sulcus_x_at(min(max(f[0].z, SULCUS_BOTTOM), SULCUS_TOP)) >= 0.3 or f[0].z > SULCUS_TOP]
    bm = mesh_from_faces(faces)
    finish(bm, f'smas__smas-{s}', 'smas', srgb('#c9b8e8'), 0.06, offset_in=SKIN_T + 0.55, smooth=4)

# ── Lemak dalam (di atas tulang, di bawah otot/SMAS) ───────────────────────
# Permukaan tulang wajah sangat tidak rata (prosesus alveolaris, tepi piriform, akar gigi).
# Karena itu lemak dalam dibentuk sebagai BANTALAN HALUS berbentuk lensa: grid elips
# diproyeksikan ke tulang dari depan, kontur kedalamannya dihaluskan, lalu diberi
# ketebalan yang memuncak di tengah dan menipis ke tepi.
face_bone_bvh = bvh_of(['tulang__zygomatic-bone-l', 'tulang__zygomatic-bone-r', 'tulang__maxilla-l',
                        'tulang__maxilla-r', 'tulang__frontal-bone'])

def make_object(bm, name, layer, color, side):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    for d in attr.data:
        d.color = (*color, 1.0)
    ob['schematic'] = True
    ob['source'] = SOURCE
    ob['side'] = side
    new_objects[layer].append(ob)
    print(f'SCHEMA {name}: {len(me.polygons)} face')
    return ob

def ellipse_shape(cx, cz, a, b):
    """Bentuk elips: (u, v) di dalam lingkaran satuan → (x, z, profil 0..1)."""
    def f(u, v):
        r2 = u * u + v * v
        if r2 > 1.0001:
            return None
        return cx + a * u, cz + b * v, math.sqrt(max(0.0, 1 - r2))
    return f

def arc_shape(theta0, theta1, radius, width, kz=0.92):
    """Bentuk bulan sabit mengikuti lengkung tepi orbita (sudut dalam derajat, sisi kiri:
    180° = medial, 270° = bawah, 0°/360° = lateral, 90° = atas)."""
    def f(u, v):
        t = math.radians(theta0 + (theta1 - theta0) * (u + 1) / 2)
        r = radius + width * v
        prof = math.sqrt(max(0.0, 1 - v * v)) * math.sqrt(max(0.0, 1 - u ** 4))
        return EYE_X + r * math.cos(t), EYE_Z + kz * r * math.sin(t), prof
    return f

def bone_pad(name, shape, thick, color, side, gap=0.08, nu=26, nv=18, smooth_iter=6):
    """Bantalan berbentuk lensa/sabit di atas tulang. `shape(u, v)` → (x, z, profil tebal)."""
    sx = 1 if side == 'l' else -1
    grid = {}
    for i in range(nu + 1):
        for j in range(nv + 1):
            u, v = -1 + 2 * i / nu, -1 + 2 * j / nv
            pt = shape(u, v)
            if pt is None:
                continue
            x, z, prof = sx * pt[0], pt[1], pt[2]
            hit = face_bone_bvh.ray_cast(Vector((x, -30.0, z)), Vector((0, 1, 0)))
            if hit[0] is not None:
                grid[(i, j)] = [x, hit[0].y, z, prof]
    if len(grid) < 12:
        print('SKIP', name)
        return
    # Haluskan kontur kedalaman (y) agar lekukan tajam tulang tidak terbawa
    for _ in range(smooth_iter):
        new_y = {}
        for (i, j), p in grid.items():
            nb = [grid[k][1] for k in ((i + 1, j), (i - 1, j), (i, j + 1), (i, j - 1)) if k in grid]
            new_y[(i, j)] = (p[1] + sum(nb)) / (1 + len(nb)) if nb else p[1]
        for k, y in new_y.items():
            grid[k][1] = y
    # Tepi yang menjorok terlalu dalam (mis. masuk ke lubang hidung) diratakan ke median
    ys = sorted(p[1] for p in grid.values())
    median = ys[len(ys) // 2]
    bm = bmesh.new()
    front, back = {}, {}
    for k, (x, y, z, prof) in grid.items():
        y = min(y, median + 0.6)
        h = thick * prof
        back[k] = bm.verts.new((x, y - gap, z))
        front[k] = bm.verts.new((x, y - gap - h, z))
    edge_use = {}
    for (i, j) in grid:
        quad = [(i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)]
        if all(q in grid for q in quad):
            bm.faces.new([front[q] for q in quad])
            bm.faces.new([back[q] for q in reversed(quad)])
            for e in zip(quad, quad[1:] + quad[:1]):
                key = tuple(sorted(e))
                edge_use[key] = edge_use.get(key, 0) + 1
    # Dinding tepi: tutup sisi bantalan agar menjadi benda tertutup
    for (p, q), n in edge_use.items():
        if n == 1:
            try:
                bm.faces.new([front[p], front[q], back[q], back[p]])
            except ValueError:
                pass
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return make_object(bm, name, 'lemak-dalam', srgb(color), side)

deep = [
    # nama, bentuk, tebal maksimum (cm), warna — semua ilustratif
    # SOOF: sabit di sepanjang tepi orbita inferior (medial) dan inferolateral (lateral)
    ('soof-medial', arc_shape(212, 266, 2.15, 0.38), 0.4, '#d99a2b'),
    ('soof-lateral', arc_shape(266, 338, 2.2, 0.42), 0.4, '#c98a22'),
    # Deep medial cheek fat: di atas maksila, lateral dari piriform, di bawah elevator bibir
    ('pipi-medial-dalam-medial', ellipse_shape(1.75, SULCUS_TOP - 0.25, 0.55, 0.8), 0.5, '#d4932c'),
    ('pipi-medial-dalam-lateral', ellipse_shape(2.7, SULCUS_TOP + 0.15, 0.6, 0.85), 0.55, '#c4851f'),
    # ROOF: sabit di bawah alis, dua pertiga lateral
    ('roof', arc_shape(18, 118, 2.55, 0.3), 0.3, '#dca43c'),
]
for name, shape, thick, col in deep:
    for s in ['l', 'r']:
        bone_pad(f'lemak-dalam__{name}-{s}', shape, thick, col, s)

# Bantalan lemak bukal: elipsoid di antara buccinator dan tepi depan masseter
for s in ['l', 'r']:
    bucc = center_of(mirror_name('smas-otot__bucinator-l', s))
    mas = OBJ[mirror_name('smas-otot__superficial-part-of-masseter-l', s)]
    mas_front = min((mas.matrix_world @ Vector(c)).y for c in mas.bound_box)
    cx = bucc.x + (0.9 if s == 'l' else -0.9)
    center = Vector((cx, (bucc.y + mas_front) / 2 + 0.6, bucc.z + 1.2))
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=24, v_segments=16, radius=1.0)
    bmesh.ops.scale(bm, vec=Vector((0.55, 1.15, 0.85)), verts=bm.verts)
    bmesh.ops.translate(bm, vec=center, verts=bm.verts)
    me = bpy.data.meshes.new('tmp')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(f'lemak-dalam__bantalan-lemak-bukal-{s}', me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    for d in attr.data:
        d.color = (*srgb('#e0a640'), 1.0)
    ob['schematic'] = True
    ob['source'] = SOURCE
    ob['side'] = s
    new_objects['lemak-dalam'].append(ob)
    print(f'SCHEMA {ob.name}: elipsoid')

# ── Ligamen retensi (pita dari tulang ke kulit) ─────────────────────────────
skin_bvh = bvh_of([n for n in OBJ if n.startswith('kulit__') and 'eyeball' not in n and 'lapisan-dasar' not in n])
bone_bvh = bvh_of([n for n in OBJ if n.startswith('tulang__')])
masseter_bvh = bvh_of([n for n in OBJ if 'masseter' in n and 'fascia' not in n])

def surface_point(bvh, x, z, from_front=True):
    """Titik pertama yang terkena sinar dari depan wajah (arah +Y) di posisi (x, z)."""
    hit = bvh.ray_cast(Vector((x, -30.0, z)), Vector((0, 1, 0)))
    return hit[0]

def ribbon(points_xz, deep_bvh, name, color, side, width=0.09, skin_gap=SKIN_T):
    """Pita ligamen: deretan garis dari permukaan struktur dalam ke bawah kulit."""
    pairs = []
    for x, z in points_xz:
        b = surface_point(deep_bvh, x, z)
        k = surface_point(skin_bvh, x, z)
        if b is None or k is None or (b - k).length < 0.2:
            continue
        k = k + (b - k).normalized() * skin_gap
        pairs.append((b, k))
    if len(pairs) < 2:
        print('SKIP', name)
        return
    bm = bmesh.new()
    prev = None
    for b, k in pairs:
        cur = (bm.verts.new(b), bm.verts.new(k))
        if prev:
            bm.faces.new((prev[0], cur[0], cur[1], prev[1]))
        prev = cur
    finish(bm, name, 'ligamen', srgb(color), width, offset_out=0.0, smooth=0)

for s in ['l', 'r']:
    sx = 1 if s == 'l' else -1
    # Ligamen retensi orbital: busur di sepanjang tepi orbita inferior dan lateral
    arc = []
    for i in range(15):
        t = math.radians(200 + i * (150 / 14))  # dari inferomedial ke lateral
        arc.append((sx * (EYE_X + 2.2 * math.cos(t)) if sx > 0 else -(EYE_X + 2.2 * math.cos(t)), EYE_Z + 1.95 * math.sin(t)))
    ribbon(arc, bone_bvh, f'ligamen__ligamen-retensi-orbital-{s}', '#7dd3c0', s)
    # Ligamen zygomaticocutaneous: tepi bawah korpus zigomatik
    zcl = [(sx * (EYE_X + 0.9 + i * 0.25), EYE_Z - 2.9) for i in range(7)]
    ribbon(zcl, bone_bvh, f'ligamen__ligamen-zigomatikokutan-{s}', '#5bbfa8', s, width=0.14)
    # Ligamen mandibula (osteokutan): di parasimfisis, sekitar 1 cm di atas tepi bawah mandibula
    mand = [(sx * (2.0 + i * 0.2), SULCUS_BOTTOM - 2.2) for i in range(5)]
    ribbon(mand, bone_bvh, f'ligamen__ligamen-mandibula-{s}', '#4aa894', s, width=0.14)
    # Ligamen maseterik: sepanjang tepi depan masseter
    mas = OBJ[mirror_name('smas-otot__superficial-part-of-masseter-l', s)]
    front_x = sx * (min(abs((mas.matrix_world @ Vector(c)).x) for c in mas.bound_box) + 0.35)
    mst = [(front_x, -0.6 - i * 0.5) for i in range(9)]
    ribbon(mst, masseter_bvh, f'ligamen__ligamen-maseterik-{s}', '#68c7b2', s)

# ── Ekspor per lapisan ─────────────────────────────────────────────────────
for layer, objs in new_objects.items():
    if not objs:
        continue
    scene = bpy.data.scenes.new(f'export_{layer}')
    for ob in objs:
        for c in ob.users_collection:
            c.objects.unlink(ob)
        scene.collection.objects.link(ob)
    with bpy.context.temp_override(scene=scene, view_layer=scene.view_layers[0]):
        bpy.ops.export_scene.gltf(
            filepath=os.path.join(SRC, f'{layer}.glb'), export_format='GLB', use_active_scene=True,
            export_apply=True, export_extras=True, export_materials='NONE', export_normals=True,
            export_texcoords=False, export_vertex_color='ACTIVE', export_yup=True,
        )
    print(f'EXPORT {layer}: {len(objs)} objek')

manifest_path = os.path.join(SRC, 'schematic-manifest.json')
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump({k: [o.name for o in v] for k, v in new_objects.items()}, f, indent=1)
print('SCHEMATIC DONE')
