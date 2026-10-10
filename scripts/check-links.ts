// Cek tautan internal di hasil build (dist/): setiap href/src yang mengarah ke halaman atau file
// di situs sendiri harus ada. Jalankan setelah `npm run build`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
if (!existsSync(DIST)) {
  console.error('Folder dist/ belum ada. Jalankan npm run build lebih dulu.');
  process.exit(1);
}

function* htmlFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* htmlFiles(p);
    else if (p.endsWith('.html')) yield p;
  }
}

function exists(url: string): boolean {
  const clean = decodeURIComponent(url.split(/[?#]/)[0]);
  if (clean === '/' || clean === '') return true;
  const target = join(DIST, clean);
  if (clean.endsWith('/')) return existsSync(join(target, 'index.html'));
  return existsSync(target) || existsSync(join(target, 'index.html'));
}

const broken = new Map<string, Set<string>>();
let checked = 0;
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"]*)"/g)) {
    const url = m[1];
    if (url.startsWith('//') || url.startsWith('/pagefind/')) continue;
    checked++;
    if (!exists(url)) {
      if (!broken.has(url)) broken.set(url, new Set());
      broken.get(url)!.add(file.replace(/\\/g, '/'));
    }
  }
}

if (broken.size > 0) {
  console.error(`✗ check:links: ${broken.size} tautan internal rusak`);
  for (const [url, files] of broken) {
    console.error(`  ${url}\n    di: ${[...files].slice(0, 3).join(', ')}${files.size > 3 ? ` (+${files.size - 3})` : ''}`);
  }
  process.exit(1);
}
console.log(`✓ check:links: ${checked} tautan internal valid`);
