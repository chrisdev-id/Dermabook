// Memastikan setiap nama mesh yang dirujuk konten benar-benar ada di model 3D:
// structures.meshes, danger-zones.overlay.anchor, dan procedures.scenes.focus.
//
//   npm run verify:meshes
//
// Daftar mesh diambil dari assets-src/manifest.json (ekspor Z-Anatomy) dan
// assets-src/schematic-manifest.json (lapisan skematik), keduanya hasil `npm run models:build`.
import { readCollection, readYaml, fail } from './lib.ts';

type Manifest = { layers: Record<string, { items: { mesh: string }[] }> };
const zan = readYaml<Manifest>('assets-src/manifest.json'); // JSON adalah YAML yang sah
const schematic = readYaml<Record<string, string[]>>('assets-src/schematic-manifest.json');

const meshes = new Set<string>();
for (const l of Object.values(zan.layers)) for (const i of l.items) meshes.add(i.mesh);
for (const list of Object.values(schematic)) for (const m of list) meshes.add(m);
const bases = new Set([...meshes].map((m) => m.replace(/-(l|r)$/, '')));

const errors: string[] = [];
const checkBase = (file: string, name: string) => {
  if (!bases.has(name) && !meshes.has(name)) errors.push(`${file}: mesh "${name}" tidak ada di model`);
};
const checkExact = (file: string, name: string) => {
  if (!meshes.has(name)) errors.push(`${file}: mesh "${name}" tidak ada di model`);
};

for (const { file, data } of readCollection<{ meshes: string[] }>('content/structures')) {
  for (const m of data.meshes ?? []) checkBase(file, m);
}
for (const { file, data } of readCollection<{ overlay: { anchor: string[] }[] }>('content/danger-zones')) {
  for (const o of data.overlay ?? []) for (const a of o.anchor) checkExact(file, a);
}
for (const { file, data } of readCollection<{ scenes?: { focus?: string[] }[] }>('content/procedures')) {
  for (const s of data.scenes ?? []) for (const f of s.focus ?? []) checkBase(file, f);
}

console.log(`Memeriksa rujukan mesh terhadap ${meshes.size} mesh di model`);
fail(errors, 'verify:meshes');
