// Gambar pratinjau (Open Graph) per halaman: daftar halaman + teksnya, dipakai oleh
// endpoint /og/[...slug].png dan oleh Base.astro untuk memilih gambar yang tepat.
import { getCollection } from 'astro:content';
import { LAYERS } from './viewer/layers';
import { procedureCategoryLabel } from './taxonomy';

export interface OgEntry {
  /** Pathname halaman, dengan garis miring di akhir, mis. "/prosedur/botox/" */
  path: string;
  kicker: string;
  title: string;
  subtitle?: string;
}

const STATIC: OgEntry[] = [
  { path: '/atlas/', kicker: 'Anatomi Wajah 3D', title: 'Buka lapisan wajah satu per satu', subtitle: 'Kulit, lemak, SMAS, otot, ligamen, tulang, pembuluh darah, dan saraf, lengkap dengan zona bahaya.' },
  { path: '/atlas/struktur/', kicker: 'Anatomi Wajah 3D', title: 'Daftar struktur anatomi', subtitle: 'Struktur wajah yang penting untuk tindakan estetika, masing-masing dengan sumber.' },
  { path: '/atlas/zona-bahaya/', kicker: 'Anatomi Wajah 3D', title: 'Zona bahaya vaskular', subtitle: 'Enam area wajah yang paling berisiko saat injeksi filler.' },
  { path: '/prosedur/', kicker: 'Prosedur & konsep', title: 'Materi prosedur estetika', subtitle: 'Penjelasan untuk pasien, fakta singkat, dan pembahasan klinis bersumber.' },
  { path: '/teknologi/', kicker: 'Teknologi estetika', title: 'Cara kerja teknologi perangkat', subtitle: 'Laser, cahaya, radiofrekuensi, ultrasound, dan pendinginan.' },
  { path: '/alat/', kicker: 'Katalog alat', title: 'Alat estetika dan indikasi resminya', subtitle: 'Hanya alat yang teknologi dan indikasinya bisa dicek di dokumen FDA 510(k).' },
  { path: '/tentang/', kicker: 'Tentang', title: 'Edukasi bersumber, bukan keputusan klinis', subtitle: 'Tujuan, batas penggunaan, dan cara konten divalidasi.' },
  { path: '/privasi/', kicker: 'Privasi', title: 'Tanpa akun, tanpa pelacak', subtitle: 'Dermabook.id tidak mengumpulkan data pribadi.' },
  { path: '/kredit/', kicker: 'Kredit & lisensi', title: 'Sumber model, data, dan lisensi', subtitle: 'Kode MIT, konten dan model 3D CC BY-SA 4.0.' },
];

let cache: Promise<OgEntry[]> | undefined;

export function ogEntries(): Promise<OgEntry[]> {
  cache ??= (async () => {
    const [procedures, complications, structures, zones, tech, devices] = await Promise.all([
      getCollection('procedures'),
      getCollection('complications'),
      getCollection('structures'),
      getCollection('danger-zones'),
      getCollection('tech-categories'),
      getCollection('devices'),
    ]);
    const layerLabel = Object.fromEntries(LAYERS.map((l) => [l.key, l.label]));
    return [
      ...STATIC,
      ...procedures.map((p) => ({
        path: `/prosedur/${p.id}/`,
        kicker: `Prosedur: ${procedureCategoryLabel[p.data.category]}`,
        title: p.data.title,
        subtitle: p.data.summary,
      })),
      ...complications.map((c) => ({
        path: `/komplikasi/${c.id}/`,
        kicker: 'Edukasi komplikasi',
        title: c.data.title,
        subtitle: c.data.summary,
      })),
      ...structures.map((s) => ({
        path: `/atlas/struktur/${s.id}/`,
        kicker: `Struktur anatomi: ${layerLabel[s.data.layer] ?? s.data.layer}`,
        title: s.data.name_id,
        subtitle: s.data.summary,
      })),
      ...zones.map((z) => ({
        path: `/atlas/zona-bahaya/${z.id}/`,
        kicker: 'Zona bahaya vaskular',
        title: z.data.name,
        subtitle: z.data.summary,
      })),
      ...tech.map((t) => ({
        path: `/teknologi/${t.id}/`,
        kicker: 'Teknologi estetika',
        title: t.data.name,
        subtitle: t.data.short,
      })),
      ...devices.map((d) => ({
        path: `/alat/${d.id}/`,
        kicker: `Katalog alat: ${d.data.manufacturer}`,
        title: d.data.name,
        subtitle: d.data.lay,
      })),
    ];
  })();
  return cache;
}

/** "/prosedur/botox/" -> "prosedur/botox" */
export const ogSlug = (path: string) => path.replace(/^\/|\/$/g, '');

/** URL gambar pratinjau untuk sebuah pathname; jatuh ke gambar umum bila halaman tidak punya gambar sendiri. */
export async function ogImageFor(pathname: string): Promise<string> {
  const normalized = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const entries = await ogEntries();
  return entries.some((e) => e.path === normalized) ? `/og/${ogSlug(normalized)}.png` : '/og.png';
}
