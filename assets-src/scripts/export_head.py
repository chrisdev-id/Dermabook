"""Ekspor area kepala-leher dari Z-Anatomy ke GLB per lapisan (untuk Dermabook.id).

Jalankan dari root repo:
  blender -b assets-src/cache/z-anatomy/Z-Anatomy/Startup.blend \
          --python assets-src/scripts/export_head.py -- assets-src/cache/export

Hasil: <outdir>/<layer>.glb (belum dikompresi) + <outdir>/manifest.json.
Kompresi Draco dilakukan terpisah oleh `npm run models:build` (lihat assets-src/README.md).

Lisensi: model sumber CC BY-SA (BodyParts3D 2.1 JP, Z-Anatomy 4.0). Bagian berlisensi
non-komersial (mis. model telinga dalam Univ. Dundee) dan model tanpa lisensi jelas
(otak "Brainder"/"White matter") TIDAK diekspor — lihat EXCLUDE di bawah dan CREDITS.md.
"""
import bpy, json, os, re, sys
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'export'
os.makedirs(OUT, exist_ok=True)

# Kotak area kepala-leher (meter, koordinat Z-Anatomy: Z ke atas, -Y ke depan)
Z_MIN, Z_MAX, X_MAX = 1.42, 1.83, 0.13

# Nama yang tidak boleh diekspor (lisensi NC / tidak jelas, atau tidak relevan untuk wajah)
EXCLUDE = re.compile(
    r'cochle|vestib|semicircular|ampulla|utricle|saccule|endolymph|perilymph|spiral|modiolus|'
    r'organ of corti|malleus|incus|stapes|tympan|auditory ossicle|'          # telinga dalam/tengah
    r'brain|cerebr|cerebell|gyrus|lobe of|ventricle|white matter|nucleus|thalam|'  # otak
    r'tongue|lingual muscle|pharyn|laryn|palat|uvula|epiglott|trache|oesophag|esophag|'
    r'hair|eyelash|tooth|teeth|dental|molar|incisor|canine|premolar|'
    r'rectus|oblique muscle of eye|levator palpebrae|ciliary|iris|retina|lens|choroid|sclera|cornea|'
    r'node|lymph',
    re.I,
)

# Daftar struktur yang diekspor per lapisan (fokus: wajah & area tindakan estetika).
# Pencocokan pada nama sumber tanpa akhiran sisi (.l/.r), huruf kecil.
ALLOW = {
    'tulang': r'^(frontal bone|parietal bone|temporal bone|occipital bone|sphenoid bone|ethmoid bone|'
              r'zygomatic bone|maxilla|mandible|nasal bone|lacrimal bone|vomer|inferior nasal concha bone|'
              r'hyoid bone|major alar cartilage|nasal septal cartilage|lateral process of nasal septal cartilage|'
              r'atlas \(c1\)|axis \(c2\)|vertebra c[3-7])$',
    'smas-otot': r'^(frontalis muscle|occipitalis muscle|temporoparietalis muscle|epicranial aponeurosis|'
                 r'corrugator supercilii|procerus muscle|orbital part of orbicularis oculi|'
                 r'palpebral part of orbicularis oculi|nasalis muscle|depressor septi nasi|levator nasolabialis|'
                 r'levator labii superioris|levator anguli oris|zygomaticus major muscle|zygomaticus minor muscle|'
                 r'risorius muscle|bucinator|orbicularis oris muscle|depressor anguli oris|'
                 r'depressor labii inferioris|mentalis muscle|platysma|superficial part of masseter|'
                 r'deep part of masseter|masseteric fascia|temporalis muscle|superficial layer of temporal fascia|'
                 r'superior head of lateral pterygoid muscle|inferior head of lateral pterygoid muscle|'
                 r'medial pterygoid muscle|anterior belly of digastric muscle|posterior belly of digastric muscle|'
                 r'mylohyoid muscle|stylohyoid muscle|sternocleidomastoid muscle|superior tarsus|inferior tarsus)$',
    'arteri': r'^(facial artery|angular artery|superior labial artery|inferior labial artery|submental artery|'
              r'transverse facial artery|superficial temporal artery|frontal branch of superficial temporal artery|'
              r'supratrochlear artery|supra-orbital artery|ophthalmic artery|lacrimal artery|infra-orbital artery|'
              r'mental branch of inferior alveolar artery|inferior alveolar artery|buccal artery|maxillary artery|'
              r'anterior deep temporal artery|posterior deep temporal artery|anterior ethmoidal artery|'
              r'occipital artery|external carotid artery|internal carotid artery|'
              r'(left|right) common carotid artery)$',
    'vena': r'^(facial vein|angular vein|common facial vein|superior labial vein|inferior labial veins|submental vein|'
            r'superficial temporal veins|retromandibular vein|anterior division of retromandibular vein|'
            r'posterior division of retromandibular vein|maxillary veins|superior ophthalmic vein|'
            r'inferior ophthalmic vein|external jugular vein|internal jugular vein|anterior jugular vein|'
            r'posterior auricular vein|occipital vein)$',
    'saraf': r'^(facial nerve \(vii\)|trigeminal nerve \(v\)|ophthalmic nerve|maxillary nerve|'
             r'anterior division of mandibular nerve|posterior division of mandibular nerve|buccal nerve|'
             r'mental nerve|inferior alveolar nerve)$',
    'kelenjar': r'^(parotid gland|accessory parotid gland|parotid duct|submandibular gland|sublingual gland)$',
    'kulit': r'^(?!greater supraclavicular|lesser supraclavicular|lateral region of neck|posterior region of neck|'
             r'muscular triangle).*(region|triangle|auricle|helix|tragus|concha|'
             r'conchae|scapha|fossa|eminentia|crura|incisure|tubercle|groove|sulcus|eyebrow|philtrum|commissure|'
             r'angle of mouth|segment of eyeball)',
}
ALLOW = {k: re.compile(v) for k, v in ALLOW.items()}

def base_name(name):
    return re.sub(r'\.(l|r)$', '', name).replace('(', '').replace(')', '').lower() \
        if name.startswith('(') else re.sub(r'\.(l|r)$', '', name).lower()

def slug(s):
    s = re.sub(r'\((.*?)\)', r'\1', s)
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def side_of(name):
    m = re.search(r'\.(l|r)$', name)
    return m.group(1) if m else None

# Peta objek -> koleksi sistem (level 1 di bawah Scene Collection)
system_of = {}
for top in bpy.context.scene.collection.children:
    def walk(c, sysname):
        for o in c.objects:
            system_of.setdefault(o.name, sysname)
        for ch in c.children:
            walk(ch, sysname)
    walk(top, top.name)

def layer_for(obj):
    sysname = system_of.get(obj.name, '')
    n = obj.name.lower()
    if sysname.startswith('1:') and obj.type == 'MESH':
        return 'tulang'
    if sysname.startswith('4:') and obj.type == 'MESH':
        return 'smas-otot'
    if sysname.startswith('5:') and obj.type == 'CURVE':
        if 'arter' in n:
            return 'arteri'
        if 'vein' in n or 'venous' in n:
            return 'vena'
    if sysname.startswith('7:') and obj.type == 'CURVE':
        return 'saraf'
    if sysname.startswith('8:') and obj.type == 'MESH' and 'gland' in n:
        return 'kelenjar'
    if obj.type == 'CURVE' and 'parotid duct' in n:
        return 'kelenjar'
    if sysname.startswith('9:') and obj.type == 'MESH':
        return 'kulit'
    # Bola mata ikut lapisan kulit sebagai orientasi visual
    if sysname.startswith('7:') and obj.type == 'MESH' and re.search(r'(anterior|posterior) segment of eyeball', n):
        return 'kulit'
    return None

def is_landmark(obj):
    # Objek penanda label Z-Anatomy berakhiran .j/.i/.o1l/.e2r dst. (bukan struktur utuh)
    return re.search(r'\.(j|i|e\d*[lr]?|o\d*[lr]?)$', obj.name) is not None

depsgraph = bpy.context.evaluated_depsgraph_get()

def world_bbox(eval_obj, mesh):
    mw = eval_obj.matrix_world
    xs, ys, zs = [], [], []
    for v in mesh.vertices:
        p = mw @ v.co
        xs.append(p.x); ys.append(p.y); zs.append(p.z)
    return (min(xs), min(ys), min(zs)), (max(xs), max(ys), max(zs))

# Kumpulkan kandidat
selected = []
for obj in list(bpy.data.objects):
    if obj.type not in ('MESH', 'CURVE'):
        continue
    if is_landmark(obj):
        continue
    if EXCLUDE.search(obj.name) and not re.search(r'segment of eyeball', obj.name, re.I):
        continue
    layer = layer_for(obj)
    if not layer or not ALLOW[layer].search(base_name(obj.name)):
        continue
    if obj.type == 'CURVE':
        # Turunkan resolusi tabung pembuluh/saraf agar ringan di browser
        obj.data.resolution_u = min(obj.data.resolution_u, 4)
        obj.data.bevel_resolution = min(obj.data.bevel_resolution, 1)
        depsgraph.update()
    if layer == 'kulit' and obj.type == 'MESH' and 'eyeball' not in obj.name.lower():
        # Region kulit Z-Anatomy memakai Solidify 3 mm (cangkang dua lapis). Untuk web cukup
        # satu permukaan; ganti dengan subdivisi 1 tingkat agar siluet lebih halus.
        for m in obj.modifiers:
            if m.type == 'SOLIDIFY':
                m.show_viewport = False
        if not any(m.type == 'SUBSURF' for m in obj.modifiers):
            sub = obj.modifiers.new('web_subsurf', 'SUBSURF')
            sub.levels = 1
        depsgraph.update()
    ev = obj.evaluated_get(depsgraph)
    try:
        me = bpy.data.meshes.new_from_object(ev, depsgraph=depsgraph)
    except RuntimeError:
        continue
    if me is None or len(me.vertices) == 0:
        if me: bpy.data.meshes.remove(me)
        continue
    lo, hi = world_bbox(ev, me)
    inside = lo[2] >= Z_MIN - 0.02 and hi[2] <= Z_MAX and max(abs(lo[0]), abs(hi[0])) <= X_MAX and lo[2] < Z_MAX
    # struktur yang sebagian besar di area kepala (mis. platysma) tetap ikut
    center_z = (lo[2] + hi[2]) / 2
    if not (inside or (center_z >= Z_MIN and hi[2] <= Z_MAX + 0.02 and max(abs(lo[0]), abs(hi[0])) <= X_MAX + 0.05)):
        bpy.data.meshes.remove(me)
        continue
    me.transform(ev.matrix_world)
    if ev.matrix_world.determinant() < 0:
        # Objek sisi kiri Z-Anatomy adalah cerminan (skala negatif): balik arah face
        # agar normal menghadap keluar setelah transformasi diterapkan.
        me.flip_normals()
    selected.append((obj, layer, me, lo, hi))

def smooth_across_patches(meshes, merge_dist=0.0004):
    """Region kulit Z-Anatomy adalah potongan-potongan terpisah sehingga muncul garis
    sambungan saat di-shade. Hitung normal halus dari gabungan semua potongan, lalu
    salin ke tiap potongan sebagai custom normal (potongan tetap terpisah untuk klik)."""
    import bmesh
    from mathutils.kdtree import KDTree
    # 1) Arahkan setiap potongan menghadap keluar dari pusat kepala
    pts = [v.co for me in meshes for v in me.vertices]
    c = sum(pts, Vector()) / len(pts)
    for me in meshes:
        score = sum(p.normal.dot(p.center - c) * p.area for p in me.polygons)
        if score < 0:
            me.flip_normals()
    # 2) Normal halus dari gabungan semua potongan
    bm = bmesh.new()
    for me in meshes:
        bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=merge_dist)
    bm.normal_update()
    kd = KDTree(len(bm.verts))
    for i, v in enumerate(bm.verts):
        kd.insert(v.co, i)
    kd.balance()
    normals = [v.normal.copy() for v in bm.verts]
    bm.free()
    for me in meshes:
        for p in me.polygons:
            p.use_smooth = True
        vn = []
        for v in me.vertices:
            _, idx, _ = kd.find(v.co)
            vn.append(normals[idx])
        me.normals_split_custom_set_from_vertices(vn)

def build_backing(meshes, inset=0.0006, merge_dist=0.0004):
    """Lapisan dasar kulit (satu mesh tersambung, sedikit ke dalam) untuk menutup retakan
    kecil di batas antar-region. Tidak bisa diklik di viewer (extras.pickable = False)."""
    import bmesh
    bm = bmesh.new()
    for me in meshes:
        bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=merge_dist)
    bm.normal_update()
    for v in bm.verts:
        v.co -= v.normal * inset
    out = bpy.data.meshes.new('kulit-backing')
    bm.to_mesh(out)
    bm.free()
    for p in out.polygons:
        p.use_smooth = True
    return out

def close_patch_cracks(meshes, max_gap=0.0025):
    """Tutup retakan antar-region (sambungan-T): titik di tepi sebuah region ditempelkan
    ke titik terdekat pada tepi region lain bila jaraknya di bawah max_gap (meter)."""
    from mathutils.geometry import intersect_point_line
    from mathutils.kdtree import KDTree

    def boundary_edges(me):
        count = {}
        for p in me.polygons:
            for ek in p.edge_keys:
                count[ek] = count.get(ek, 0) + 1
        return [ek for ek, n in count.items() if n == 1]

    edges = []  # (patch index, a, b)
    for i, me in enumerate(meshes):
        for a, b in boundary_edges(me):
            edges.append((i, me.vertices[a].co.copy(), me.vertices[b].co.copy()))
    kd = KDTree(len(edges))
    for k, (_, a, b) in enumerate(edges):
        kd.insert((a + b) / 2, k)
    kd.balance()
    moved = 0
    for i, me in enumerate(meshes):
        bverts = {v for ek in boundary_edges(me) for v in ek}
        for vi in bverts:
            co = me.vertices[vi].co
            best = None
            for _, k, _ in kd.find_range(co, 0.02):
                j, a, b = edges[k]
                if j == i:
                    continue
                pt, t = intersect_point_line(co, a, b)
                t = min(max(t, 0.0), 1.0)
                pt = a.lerp(b, t)
                d = (pt - co).length
                if d < max_gap and (best is None or d < best[0]):
                    best = (d, pt)
            if best and best[0] > 1e-7:
                me.vertices[vi].co = best[1]
                moved += 1
    print(f'CRACKS: {moved} titik tepi ditempelkan')

skin = [s[2] for s in selected if s[1] == 'kulit' and 'eyeball' not in s[0].name.lower()]
extra = {}
if skin:
    close_patch_cracks(skin)
    smooth_across_patches(skin)
    extra['kulit'] = [('kulit__lapisan-dasar', build_backing(skin), {'pickable': False})]
for obj, layer, me, *_ in selected:
    if layer != 'kulit':
        for p in me.polygons:
            p.use_smooth = True

# Titik pusat: tengah bounding box tulang tengkorak yang terpilih
bones = [s for s in selected if s[1] == 'tulang']
lo = Vector((min(s[3][0] for s in bones), min(s[3][1] for s in bones), min(s[3][2] for s in bones)))
hi = Vector((max(s[4][0] for s in bones), max(s[4][1] for s in bones), max(s[4][2] for s in bones)))
center = (lo + hi) / 2
SCALE = 100.0  # meter -> cm
to_local = Matrix.Scale(SCALE, 4) @ Matrix.Translation(-center)

# Bangun scene ekspor per lapisan
manifest = {'center_m': list(center), 'scale': SCALE, 'units': 'cm', 'layers': {}}
used = set()
for layer in sorted({s[1] for s in selected}):
    scene = bpy.data.scenes.new(f'export_{layer}')
    items = []
    for obj, lyr, me, lo_, hi_ in selected:
        if lyr != layer:
            continue
        me.transform(to_local)
        base = slug(re.sub(r'\.(l|r)$', '', obj.name))
        side = side_of(obj.name)
        name = f'{layer}__{base}' + (f'-{side}' if side else '')
        k = 2
        while name in used:
            name = f'{layer}__{base}-{k}'; k += 1
        used.add(name)
        me.name = name
        ob = bpy.data.objects.new(name, me)
        ob['source_name'] = obj.name
        ob['side'] = side or ''
        ob['schematic'] = False
        ob['source'] = 'Z-Anatomy / BodyParts3D (CC BY-SA)'
        scene.collection.objects.link(ob)
        items.append({'mesh': name, 'source_name': obj.name, 'tris': sum(len(p.vertices) - 2 for p in me.polygons)})
    for name, me, props in extra.get(layer, []):
        me.transform(to_local)
        me.name = name
        ob = bpy.data.objects.new(name, me)
        for k, v in props.items():
            ob[k] = v
        ob['schematic'] = False
        ob['source'] = 'Z-Anatomy / BodyParts3D (CC BY-SA)'
        scene.collection.objects.link(ob)
        items.append({'mesh': name, 'source_name': name, 'tris': sum(len(p.vertices) - 2 for p in me.polygons)})
    # Ekspor
    win = bpy.context.window
    if win:
        win.scene = scene
    bpy.context.window_manager  # noqa
    with bpy.context.temp_override(scene=scene, view_layer=scene.view_layers[0]):
        for ob in scene.objects:
            ob.select_set(True)
        bpy.ops.export_scene.gltf(
            filepath=os.path.join(OUT, f'{layer}.glb'),
            export_format='GLB',
            use_selection=False,
            use_active_scene=True,
            export_apply=True,
            export_extras=True,
            export_materials='NONE',
            export_normals=True,
            export_texcoords=False,
            export_yup=True,
        )
    manifest['layers'][layer] = {
        'objects': len(items),
        'tris': sum(i['tris'] for i in items),
        'items': items,
    }
    print(f'EXPORT {layer}: {len(items)} objek, {manifest["layers"][layer]["tris"]} segitiga')

with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)
print('EXPORT DONE ->', OUT)
