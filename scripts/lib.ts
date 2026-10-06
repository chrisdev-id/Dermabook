// Utilitas bersama untuk skrip verifikasi (dijalankan langsung oleh Node ≥ 22.18
// yang mendukung TypeScript tanpa build).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));

export function readYaml<T>(relPath: string): T {
  return parse(readFileSync(join(ROOT, relPath), 'utf8')) as T;
}

/** Membaca frontmatter YAML dari semua file .md di sebuah folder konten. */
export function readCollection<T>(relDir: string): { file: string; data: T }[] {
  const dir = join(ROOT, relDir);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(dir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) throw new Error(`Frontmatter tidak ditemukan: ${relDir}/${f}`);
      return { file: `${relDir}/${f}`, data: parse(m[1]) as T };
    });
}

/** Normalisasi teks untuk perbandingan longgar (huruf kecil, tanpa tanda baca). */
export function norm(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function getJson(url: string, tries = 3): Promise<any> {
  for (let i = 1; ; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'dermabook-verify (+https://github.com)' } });
    if (res.status === 404) return null; // openFDA: "No matches found"
    if (res.ok) return res.json();
    if (i >= tries) throw new Error(`HTTP ${res.status} untuk ${url}`);
    await sleep(1000 * i);
  }
}

export function fail(errors: string[], label: string): never | void {
  if (errors.length) {
    console.error(`\n✗ ${label}: ${errors.length} masalah ditemukan`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`✓ ${label}: semua cocok`);
}
