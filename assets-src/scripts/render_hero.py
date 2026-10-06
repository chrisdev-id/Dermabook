"""Render gambar hero & OG dari model atlas sendiri (bukan stok foto).

Komposisi "wajah terbelah": sisi kanan pasien berkulit, sisi kiri memperlihatkan
otot, arteri, vena, saraf, dan kelenjar parotis. Dilihat dari ¾ kiri.

  blender -b --factory-startup --python assets-src/scripts/render_hero.py -- assets-src/cache/export public/images

Hasil: hero-atlas.webp (transparan) dan og.png (1200x630, latar biru muda).
Model sumber: Z-Anatomy/BodyParts3D (CC BY-SA), lihat CREDITS.md.
"""
import bpy, sys, os, math, re
from mathutils import Vector

args = sys.argv[sys.argv.index('--') + 1:]
SRC, OUT = os.path.abspath(args[0]), os.path.abspath(args[1])
os.makedirs(OUT, exist_ok=True)

for layer in ['kulit', 'smas-otot', 'arteri', 'vena', 'saraf', 'kelenjar']:
    bpy.ops.import_scene.gltf(filepath=os.path.join(SRC, f'{layer}.glb'))

def srgb(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

def material(name, hexcol, rough=0.55, sss=0.0, coat=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = srgb(hexcol)
    b.inputs['Roughness'].default_value = rough
    if sss:
        b.inputs['Subsurface Weight'].default_value = sss
        b.inputs['Subsurface Radius'].default_value = (0.9, 0.35, 0.2)
        b.inputs['Subsurface Scale'].default_value = 0.25
    if coat:
        b.inputs['Coat Weight'].default_value = coat
    return m

MAT = {
    'kulit': material('kulit', '#e2ae8f', 0.5, sss=0.15),
    'smas-otot': material('otot', '#b5473f', 0.45, coat=0.15),
    'arteri': material('arteri', '#d42b3f', 0.35, coat=0.3),
    'vena': material('vena', '#3f63d6', 0.35, coat=0.3),
    'saraf': material('saraf', '#f2c230', 0.4),
    'kelenjar': material('kelenjar', '#b48ad6', 0.5),
    'mata': material('mata', '#f4f1ea', 0.2, coat=0.6),
}

EAR = re.compile(r'helix|concha|auricle|lobule|tragus|scapha|fossa|eminentia|crura|incisure|tubercle|posterior-auricular|auricular')
for ob in list(bpy.data.objects):
    if ob.type != 'MESH':
        continue
    layer = ob.name.split('__')[0]
    side = ob.name[-2:]
    keep = True
    if layer == 'kulit':
        if 'lapisan-dasar' in ob.name:
            import bmesh
            bm = bmesh.new(); bm.from_mesh(ob.data)
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if (ob.matrix_world @ v.co).x > -0.3], context='VERTS')
            bm.to_mesh(ob.data); bm.free()
        elif 'eyeball' in ob.name:
            ob.data.materials.clear(); ob.data.materials.append(MAT['mata'])
            continue
        # Sisi kiri pasien (+X) dibuka; telinga kiri tetap ada sebagai orientasi
        elif side == '-l' and not EAR.search(ob.name):
            keep = False
    elif side == '-r':
        keep = False  # struktur dalam sisi kanan tertutup kulit, tidak perlu dirender
    if not keep:
        bpy.data.objects.remove(ob, do_unlink=True)
        continue
    ob.data.materials.clear()
    ob.data.materials.append(MAT.get(layer, MAT['kulit']))
    for p in ob.data.polygons:
        p.use_smooth = True

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 64
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'

world = bpy.data.worlds.new('w')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = srgb('#dfe7fb')
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.55

def area(name, loc, energy, size, color='#ffffff'):
    d = bpy.data.lights.new(name, 'AREA')
    d.energy, d.size = energy, size
    d.color = srgb(color)[:3]
    o = bpy.data.objects.new(name, d)
    scene.collection.objects.link(o)
    o.location = loc
    direction = Vector((0, 0, 1)) - o.location
    o.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return o

# Koordinat Blender: -Y = depan wajah, +X = sisi kiri pasien, +Z = atas (cm)
area('key', (35, -40, 30), 9000, 30)
area('fill', (-40, -30, 5), 2500, 40, '#dbe5ff')
area('rim', (10, 45, 25), 6000, 25, '#fff1e6')

cam_data = bpy.data.cameras.new('cam')
cam_data.lens = 70
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam

def shoot(loc, target, path, w, h, transparent=True, bg=None):
    cam.location = loc
    cam.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    scene.render.resolution_x, scene.render.resolution_y = w, h
    scene.render.film_transparent = transparent
    scene.use_nodes = bool(bg)
    if bg:
        scene.render.film_transparent = True
        nt = scene.node_tree
        nt.nodes.clear()
        rl = nt.nodes.new('CompositorNodeRLayers')
        rgb = nt.nodes.new('CompositorNodeRGB'); rgb.outputs[0].default_value = srgb(bg)
        over = nt.nodes.new('CompositorNodeAlphaOver')
        comp = nt.nodes.new('CompositorNodeComposite')
        nt.links.new(rgb.outputs[0], over.inputs[1]); nt.links.new(rl.outputs['Image'], over.inputs[2])
        nt.links.new(over.outputs[0], comp.inputs[0])
    ext = os.path.splitext(path)[1].lower()
    s = scene.render.image_settings
    s.file_format = 'WEBP' if ext == '.webp' else 'PNG'
    s.color_mode = 'RGBA' if transparent else 'RGB'
    if s.file_format == 'WEBP':
        s.quality = 82
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print('RENDER', path)

# Hero: potret ¾ kiri, latar transparan
cam_data.lens = 80
shoot((17, -62, 6), (0.6, 0, 3.4), os.path.join(OUT, 'hero-atlas.webp'), 1000, 1060)
# OG: lanskap, latar biru muda solid, wajah di kanan bingkai
cam_data.lens = 55
# Latar OG harus tepat warna brand: tampilkan tanpa tone mapping filmik
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
shoot((15, -66, 5), (-9, 0, 2.2), os.path.join(OUT, '..', 'og.png'), 1200, 630, transparent=False, bg='#edf2fd')
