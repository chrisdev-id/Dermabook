// Membangun ulang model 3D atlas dari file sumber Z-Anatomy.
//
//   npm run models:build
//
// Prasyarat (tidak ikut di repo, lihat assets-src/README.md):
//   - assets-src/cache/z-anatomy/Z-Anatomy/Startup.blend
//   - Blender 4.5 LTS; path diatur lewat env BLENDER atau default di assets-src/cache/.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib.ts';

const blender =
  process.env.BLENDER ?? join(ROOT, 'assets-src/cache/blender-4.5.14-windows-x64/blender.exe');
const source = join(ROOT, 'assets-src/cache/z-anatomy/Z-Anatomy/Startup.blend');
const rawDir = join(ROOT, 'assets-src/cache/export');
const outDir = join(ROOT, 'public/models');

for (const [label, path] of [['Blender', blender], ['Z-Anatomy Startup.blend', source]] as const) {
  if (!existsSync(path)) {
    console.error(`✗ ${label} tidak ditemukan: ${path}\n  Lihat assets-src/README.md.`);
    process.exit(1);
  }
}

rmSync(rawDir, { recursive: true, force: true });
console.log('1/3 Ekspor dari Blender…');
const log = execFileSync(
  blender,
  ['-b', source, '--python', join(ROOT, 'assets-src/scripts/export_head.py'), '--', rawDir],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
for (const line of log.split('\n')) if (/^(EXPORT|CRACKS)/.test(line)) console.log('   ' + line);

console.log('2/3 Lapisan skematik (lemak, SMAS, ligamen)…');
const log2 = execFileSync(
  blender,
  ['-b', '--factory-startup', '--python', join(ROOT, 'assets-src/scripts/build_schematic.py'), '--', rawDir],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
);
for (const line of log2.split('\n')) if (/^(EXPORT|SKIP)/.test(line)) console.log('   ' + line);

console.log('3/3 Kompresi Draco…');
mkdirSync(outDir, { recursive: true });
for (const f of readdirSync(rawDir).filter((f) => f.endsWith('.glb'))) {
  const cli = join(ROOT, 'node_modules/@gltf-transform/cli/bin/cli.js');
  execFileSync(process.execPath, [cli, 'draco', join(rawDir, f), join(outDir, f)], { stdio: 'ignore' });
}
copyFileSync(join(rawDir, 'manifest.json'), join(ROOT, 'assets-src/manifest.json'));
copyFileSync(join(rawDir, 'schematic-manifest.json'), join(ROOT, 'assets-src/schematic-manifest.json'));
console.log('✓ Model tersimpan di public/models/, manifest di assets-src/manifest.json');
