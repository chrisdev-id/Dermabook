// Viewer anatomi 3D berlapis (Three.js). Model per lapisan dimuat saat dibutuhkan.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { LAYERS, CAMERA_PRESETS, HEAD_SIZE, type CameraPreset, type LayerKey } from './layers';

export interface PickInfo {
  mesh: string;
  /** Nama mesh tanpa akhiran sisi (-l/-r); kunci untuk mencari konten struktur */
  base: string;
  sourceName: string;
  layer: LayerKey;
  side: string;
  schematic: boolean;
}

export interface ZoneDef {
  slug: string;
  overlay: { anchor: string[]; radius_cm: number; offset_cm: [number, number, number] }[];
}

export interface SceneDef {
  preset: CameraPreset;
  focus: string[];
  layers: Partial<Record<LayerKey, number>>;
  zones: boolean;
}

interface LayerState {
  group: THREE.Group;
  material: THREE.MeshStandardMaterial;
  loaded: boolean;
  loading?: Promise<void>;
  visible: boolean;
  opacity: number;
}

interface ZoneMark {
  slug: string;
  point: THREE.Vector3;
  normal: THREE.Vector3;
}

const layerOfMesh = (name: string) => name.split('__')[0] as LayerKey;
export const baseName = (name: string) => name.replace(/-(l|r)$/, '');

export class AnatomyViewer {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private loader: GLTFLoader;
  private layers = new Map<LayerKey, LayerState>();
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downAt: { x: number; y: number } | null = null;
  private selected: THREE.Mesh[] = [];
  private isolated = false;
  private needsRender = true;
  private tween: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; t0: number } | null =
    null;
  private preset: CameraPreset = 'depan';
  private frames = 0;
  private fpsT0 = performance.now();
  private zoneGroup = new THREE.Group();
  private zoneMarks: ZoneMark[] = [];
  private zoneTexture: THREE.Texture | null = null;

  onPick: (info: PickInfo | null) => void = () => {};
  onLoading: (layer: LayerKey, loading: boolean) => void = () => {};
  onFps: ((fps: number) => void) | null = null;

  constructor(private container: HTMLElement, private modelBase = '/models/') {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Ukuran tampilan kanvas mengikuti wadah; resolusi internalnya (× devicePixelRatio)
    // diatur di resize(). Tanpa ini kanvas meluber pada layar ber-DPR tinggi.
    Object.assign(this.renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(35, 1, 1, 500);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 160;
    this.controls.target.set(0, 0, 0);
    this.controls.addEventListener('change', () => (this.needsRender = true));

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8f99, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(20, 30, 40);
    this.camera.add(key); // cahaya mengikuti kamera agar sisi yang dilihat selalu terang
    this.scene.add(this.camera);
    this.zoneGroup.name = 'zona-bahaya';
    this.zoneGroup.visible = false;
    this.scene.add(this.zoneGroup);

    const draco = new DRACOLoader().setDecoderPath('/vendor/draco/');
    this.loader = new GLTFLoader().setDRACOLoader(draco);

    for (const cfg of LAYERS) {
      const group = new THREE.Group();
      group.name = cfg.key;
      group.visible = cfg.visible;
      // DoubleSide: sebagian mesh sumber (potongan kulit, tabung pembuluh) tidak tertutup penuh
      const material = new THREE.MeshStandardMaterial({
        color: cfg.vertexColors ? '#ffffff' : cfg.color,
        vertexColors: !!cfg.vertexColors,
        roughness: 0.7,
        metalness: 0,
        side: THREE.DoubleSide,
      });
      this.scene.add(group);
      this.layers.set(cfg.key, { group, material, loaded: false, visible: cfg.visible, opacity: cfg.opacity });
    }

    const ro = new ResizeObserver(() => this.resize());
    ro.observe(container);
    this.resize();

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => (this.downAt = { x: e.clientX, y: e.clientY }));
    canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));

    this.renderer.setAnimationLoop(() => this.tick());
  }

  static isSupported(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  async init() {
    await Promise.all(LAYERS.filter((l) => l.visible && l.available).map((l) => this.ensureLoaded(l.key)));
  }

  // ── Lapisan ───────────────────────────────────────────────────

  ensureLoaded(key: LayerKey): Promise<void> {
    const state = this.layers.get(key)!;
    if (state.loaded) return Promise.resolve();
    if (state.loading) return state.loading;
    this.onLoading(key, true);
    state.loading = this.loader
      .loadAsync(`${this.modelBase}${key}.glb`)
      .then((gltf) => {
        gltf.scene.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            const mesh = o as THREE.Mesh;
            mesh.material = state.material;
            mesh.userData.layer = key;
          }
        });
        state.group.add(gltf.scene);
        state.group.updateMatrixWorld(true);
        state.loaded = true;
        this.applyOpacity(key);
        this.needsRender = true;
      })
      .finally(() => this.onLoading(key, false));
    return state.loading;
  }

  isLayerVisible(key: LayerKey) {
    return this.layers.get(key)!.visible;
  }

  layerState(key: LayerKey) {
    const { visible, opacity } = this.layers.get(key)!;
    return { visible, opacity };
  }

  async setLayerVisible(key: LayerKey, visible: boolean) {
    const state = this.layers.get(key)!;
    state.visible = visible;
    if (visible) await this.ensureLoaded(key);
    state.group.visible = visible;
    if (!visible && this.selected.some((m) => m.userData.layer === key)) this.select([]);
    this.needsRender = true;
  }

  setLayerOpacity(key: LayerKey, opacity: number) {
    this.layers.get(key)!.opacity = opacity;
    this.applyOpacity(key);
  }

  private applyOpacity(key: LayerKey) {
    const { material, opacity } = this.layers.get(key)!;
    material.opacity = opacity;
    material.transparent = opacity < 1;
    material.depthWrite = opacity >= 1;
    material.needsUpdate = true;
    this.needsRender = true;
  }

  private meshesNamed(names: string[]): THREE.Mesh[] {
    const wanted = new Set(names);
    const found: THREE.Mesh[] = [];
    for (const { group } of this.layers.values()) {
      group.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && (wanted.has(o.name) || wanted.has(baseName(o.name)))) found.push(o as THREE.Mesh);
      });
    }
    return found;
  }

  private forEachMesh(fn: (m: THREE.Mesh) => void) {
    for (const { group } of this.layers.values()) {
      group.traverse((o) => (o as THREE.Mesh).isMesh && fn(o as THREE.Mesh));
    }
  }

  // ── Kamera ────────────────────────────────────────────────────

  /** Posisi kamera untuk preset, dengan jarak yang membuat kepala muat di layar. */
  private fitDistance() {
    const tan = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    const byHeight = HEAD_SIZE.height / 2 / tan;
    const byWidth = HEAD_SIZE.width / 2 / (tan * this.camera.aspect);
    return Math.max(byHeight, byWidth) * 1.12 + HEAD_SIZE.width / 2;
  }

  setPreset(name: CameraPreset, animate = true) {
    this.preset = name;
    const dir = new THREE.Vector3(...(CAMERA_PRESETS[name].direction as unknown as [number, number, number])).normalize();
    this.moveCamera(dir.multiplyScalar(this.fitDistance()), new THREE.Vector3(0, 0, 0), animate);
  }

  private moveCamera(position: THREE.Vector3, target: THREE.Vector3, animate = true) {
    if (animate) {
      this.tween = {
        from: this.camera.position.clone(),
        to: position,
        tFrom: this.controls.target.clone(),
        tTo: target,
        t0: performance.now(),
      };
    } else {
      this.camera.position.copy(position);
      this.controls.target.copy(target);
    }
    this.needsRender = true;
  }

  /** Arahkan kamera ke sebuah titik di permukaan dari arah normalnya. */
  private lookAtSurface(point: THREE.Vector3, normal: THREE.Vector3, distance = this.fitDistance() * 0.55) {
    const target = point.clone().lerp(new THREE.Vector3(0, point.y, 0), 0.35);
    this.moveCamera(target.clone().add(normal.clone().normalize().multiplyScalar(distance)), target);
  }

  // ── Seleksi ───────────────────────────────────────────────────

  /** Tampilkan hanya struktur terpilih (toggle). */
  toggleIsolate() {
    if (this.isolated || this.selected.length === 0) {
      this.isolated = false;
      this.forEachMesh((m) => (m.visible = true));
    } else {
      this.isolated = true;
      const keep = new Set(this.selected);
      this.forEachMesh((m) => (m.visible = keep.has(m)));
      for (const m of this.selected) this.layers.get(m.userData.layer as LayerKey)!.group.visible = true;
    }
    this.needsRender = true;
    return this.isolated;
  }

  /**
   * Pilih struktur berdasarkan nama mesh dasar (tanpa sisi), muat lapisannya,
   * tampilkan, dan arahkan kamera ke sana. Dipakai untuk tautan ?fokus=.
   */
  async focusStructure(meshBases: string[], adjustSkin = true, fromPreset?: CameraPreset) {
    const layers = [...new Set(meshBases.map(layerOfMesh))];
    await Promise.all(layers.map((l) => this.setLayerVisible(l, true)));
    // Kulit dibuat transparan agar struktur di bawahnya terlihat
    if (adjustSkin && !layers.includes('kulit') && this.isLayerVisible('kulit')) this.setLayerOpacity('kulit', 0.2);
    const meshes = this.meshesNamed(meshBases);
    if (!meshes.length) return false;
    this.select(meshes);
    const box = new THREE.Box3();
    meshes.forEach((m) => box.expandByObject(m));
    const center = box.getCenter(new THREE.Vector3());
    if (fromPreset && fromPreset !== 'depan') {
      // Sudut kamera ditentukan adegan; arahkan ke pusat struktur dari arah preset
      const dir = new THREE.Vector3(...(CAMERA_PRESETS[fromPreset].direction as unknown as [number, number, number])).normalize();
      const target = new THREE.Vector3(0, center.y, 0);
      this.moveCamera(target.clone().add(dir.multiplyScalar(this.fitDistance() * 0.85)), target);
      return true;
    }
    const out = new THREE.Vector3(center.x, 0, Math.max(center.z, 0) + 6).normalize();
    if (Math.abs(center.x) < 1.5) out.set(0, 0.05, 1); // struktur di garis tengah: lihat dari depan
    if (meshes.length > 1 && meshes.some((m) => m.name.endsWith('-l')) && meshes.some((m) => m.name.endsWith('-r'))) {
      out.set(0, 0.05, 1); // struktur berpasangan: lihat kedua sisi dari depan
      center.x = 0;
    }
    this.lookAtSurface(center, out, this.fitDistance() * 0.75);
    return true;
  }

  private handlePointerUp(e: PointerEvent) {
    if (!this.downAt) return;
    const moved = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
    this.downAt = null;
    if (moved > 6) return; // itu gerakan memutar, bukan klik

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const targets: THREE.Object3D[] = [];
    for (const { group } of this.layers.values()) if (group.visible) targets.push(group);
    const hit = this.raycaster
      .intersectObjects(targets, true)
      .find(
        (h) =>
          h.object.visible &&
          (h.object as THREE.Mesh).isMesh &&
          h.object.userData.pickable !== false &&
          this.isOpaqueEnough(h.object),
      );
    this.select(hit ? [hit.object as THREE.Mesh] : []);
  }

  /** Lapisan yang sangat transparan bisa "ditembus" klik. */
  private isOpaqueEnough(o: THREE.Object3D) {
    return this.layers.get(o.userData.layer as LayerKey)!.opacity > 0.35;
  }

  private select(meshes: THREE.Mesh[]) {
    for (const m of this.selected) {
      (m.material as THREE.Material).dispose();
      m.material = this.layers.get(m.userData.layer as LayerKey)!.material;
    }
    this.selected = meshes;
    for (const mesh of meshes) {
      const hl = this.layers.get(mesh.userData.layer as LayerKey)!.material.clone();
      // Warna sorot berbeda jelas dari semua warna lapisan (termasuk merah arteri)
      hl.vertexColors = false;
      hl.color = new THREE.Color(0x22d3ee);
      hl.emissive = new THREE.Color(0x0e7490);
      hl.emissiveIntensity = 0.6;
      hl.opacity = 1;
      hl.transparent = false;
      hl.depthWrite = true;
      mesh.material = hl;
    }
    const first = meshes[0];
    if (first) {
      const ex = first.userData;
      this.onPick({
        mesh: first.name,
        base: baseName(first.name),
        sourceName: String(ex.source_name ?? first.name),
        layer: ex.layer,
        side: meshes.length > 1 ? '' : String(ex.side ?? ''),
        schematic: Boolean(ex.schematic),
      });
    } else {
      this.onPick(null);
    }
    this.needsRender = true;
  }

  // ── Zona bahaya ───────────────────────────────────────────────

  private getZoneTexture() {
    if (this.zoneTexture) return this.zoneTexture;
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(220,38,38,0.75)');
    grad.addColorStop(0.7, 'rgba(220,38,38,0.45)');
    grad.addColorStop(0.92, 'rgba(220,38,38,0.85)');
    grad.addColorStop(1, 'rgba(220,38,38,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    this.zoneTexture = new THREE.CanvasTexture(c);
    this.zoneTexture.colorSpace = THREE.SRGBColorSpace;
    return this.zoneTexture;
  }

  /**
   * Bangun penanda zona: pusat mesh "anchor" diproyeksikan ke permukaan kulit,
   * lalu digambar decal lingkaran di kulit. Hanya dibangun sekali.
   */
  async buildZones(zones: ZoneDef[]) {
    if (this.zoneMarks.length) return;
    const anchorLayers = new Set<LayerKey>(['kulit']);
    zones.forEach((z) => z.overlay.forEach((o) => o.anchor.forEach((a) => anchorLayers.add(layerOfMesh(a)))));
    await Promise.all([...anchorLayers].map((l) => this.ensureLoaded(l)));

    const skin: THREE.Mesh[] = [];
    this.layers.get('kulit')!.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.userData.pickable !== false && !/eyeball/.test(o.name)) skin.push(o as THREE.Mesh);
    });
    const material = new THREE.MeshBasicMaterial({
      map: this.getZoneTexture(),
      transparent: true,
      depthTest: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -4,
    });

    for (const zone of zones) {
      for (const ov of zone.overlay) {
        const anchors = this.meshesNamed(ov.anchor);
        if (!anchors.length) continue;
        const box = new THREE.Box3();
        anchors.forEach((m) => box.expandByObject(m));
        const c0 = box.getCenter(new THREE.Vector3()).add(new THREE.Vector3(...ov.offset_cm));
        // Proyeksikan ke kulit: tembak sinar dari luar wajah ke arah titik anchor.
        // Bila meleset (mis. lewat celah mulut/mata), coba geser sedikit ke atas/bawah.
        let hit: THREE.Intersection | undefined;
        let out = new THREE.Vector3();
        for (const dy of [0, 0.5, -0.5, 1, -1]) {
          const c = c0.clone().add(new THREE.Vector3(0, dy, 0));
          out = new THREE.Vector3(c.x, 0, Math.max(c.z, 0) + 6).normalize();
          this.raycaster.set(c.clone().add(out.clone().multiplyScalar(40)), out.clone().negate());
          hit = this.raycaster.intersectObjects(skin, false)[0];
          if (hit) break;
        }
        if (!hit) continue;
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : out.clone();
        if (normal.dot(out) < 0) normal.negate();
        this.zoneMarks.push({ slug: zone.slug, point: hit.point.clone(), normal });

        const orient = new THREE.Euler().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(hit.point, hit.point.clone().add(normal), new THREE.Vector3(0, 1, 0)),
        );
        const d = ov.radius_cm * 2;
        const size = new THREE.Vector3(d, d, d * 1.2);
        for (const m of skin) {
          const mb = new THREE.Box3().setFromObject(m);
          if (mb.distanceToPoint(hit.point) > ov.radius_cm * 1.2) continue;
          const geo = new DecalGeometry(m, hit.point, orient, size);
          if (geo.attributes.position.count === 0) continue;
          const decal = new THREE.Mesh(geo, material);
          decal.userData.zone = zone.slug;
          decal.renderOrder = 2;
          this.zoneGroup.add(decal);
        }
      }
    }
    this.needsRender = true;
  }

  async setZonesVisible(zones: ZoneDef[], visible: boolean) {
    if (visible) {
      await this.buildZones(zones);
      await this.setLayerVisible('kulit', true);
      await this.setLayerVisible('arteri', true);
    }
    this.zoneGroup.visible = visible;
    this.needsRender = true;
  }

  focusZone(slug: string) {
    const marks = this.zoneMarks.filter((m) => m.slug === slug);
    if (!marks.length) return;
    if (marks.length === 1) {
      this.lookAtSurface(marks[0].point, marks[0].normal);
    } else {
      // Zona berpasangan kiri-kanan: lihat dari depan agak serong ke sisi kiri pasien
      const p = marks[0].point;
      this.lookAtSurface(new THREE.Vector3(0, p.y, p.z), new THREE.Vector3(0.35, 0.05, 1), this.fitDistance() * 0.8);
    }
  }

  // ── Adegan presentasi ─────────────────────────────────────────

  /**
   * Terapkan satu langkah presentasi: lapisan yang disebut di `layers` ditampilkan dengan
   * opasitasnya, lapisan lain disembunyikan; kamera mengarah ke `focus` atau ke `preset`.
   */
  async applyScene(scene: SceneDef, zones: ZoneDef[] = []) {
    if (this.isolated) this.toggleIsolate();
    const wanted = scene.layers;
    await Promise.all(
      LAYERS.filter((l) => l.available).map(async (l) => {
        const on = wanted[l.key] !== undefined;
        if (on) this.setLayerOpacity(l.key, wanted[l.key]!);
        await this.setLayerVisible(l.key, on);
      }),
    );
    await this.setZonesVisibleOnly(zones, scene.zones);
    if (scene.focus.length) {
      await this.focusStructure(scene.focus, false, scene.preset);
    } else {
      this.select([]);
      this.setPreset(scene.preset);
    }
  }

  private async setZonesVisibleOnly(zones: ZoneDef[], visible: boolean) {
    if (visible) await this.buildZones(zones);
    this.zoneGroup.visible = visible;
    this.needsRender = true;
  }

  // ── Render ────────────────────────────────────────────────────

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const first = this.camera.aspect === 1 && this.camera.position.lengthSq() === 0;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (first) this.setPreset(this.preset, false);
    this.needsRender = true;
  }

  private tick() {
    if (this.tween) {
      const t = Math.min(1, (performance.now() - this.tween.t0) / 650);
      const k = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
      this.camera.position.lerpVectors(this.tween.from, this.tween.to, k);
      this.controls.target.lerpVectors(this.tween.tFrom, this.tween.tTo, k);
      if (t >= 1) this.tween = null;
      this.needsRender = true;
    }
    const damping = this.controls.update();
    if (this.needsRender || damping || this.onFps) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
    }
    if (this.onFps) {
      this.frames++;
      const now = performance.now();
      if (now - this.fpsT0 >= 1000) {
        this.onFps((this.frames * 1000) / (now - this.fpsT0));
        this.frames = 0;
        this.fpsT0 = now;
      }
    }
  }
}
