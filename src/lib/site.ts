// Konfigurasi situs dan label tampilan.

export const REPO_URL = 'https://github.com/chrisdev-id/Dermabook';

export const SITE_NAME = 'Dermabook.id';
export const SITE_TAGLINE = 'Edukasi anatomi wajah, prosedur, dan teknologi estetika untuk dokter';

export const INTENDED_USE =
  'Dermabook.id adalah materi belajar dan referensi umum tentang anatomi wajah dan kulit, prosedur estetika, ' +
  'dan teknologi perangkat estetika, ditujukan bagi dokter dan tenaga medis. Dermabook.id tidak dimaksudkan untuk ' +
  'diagnosis, penentuan terapi, perencanaan tindakan, atau pengambilan keputusan klinis bagi pasien individual, ' +
  'dan tidak menggantikan pendidikan formal maupun penilaian klinis.';

export const statusLabel = {
  draft: { text: 'Draf, bersumber literatur, belum ditinjau dokter', tone: 'draft' },
  community: { text: 'Ditinjau komunitas', tone: 'community' },
  doctor: { text: 'Ditinjau dokter', tone: 'doctor' },
} as const;

export const concernLabel: Record<string, string> = {
  pigmen: 'Pigmen & bintik',
  vaskular: 'Kemerahan & pembuluh darah',
  'tekstur-bekas-jerawat': 'Tekstur & bekas jerawat',
  kerutan: 'Kerutan',
  kekenduran: 'Kekenduran',
  rambut: 'Rambut',
  lemak: 'Lemak lokal',
  akne: 'Jerawat',
  tato: 'Tato',
};

export const depthLabel: Record<string, string> = {
  epidermis: 'Epidermis',
  'dermis-papiler': 'Dermis papiler',
  'dermis-retikular': 'Dermis retikular',
  subkutan: 'Subkutan (lemak)',
  smas: 'SMAS',
};

export const energyLabel: Record<string, string> = {
  laser: 'Laser',
  cahaya: 'Cahaya (non-laser)',
  radiofrekuensi: 'Radiofrekuensi',
  ultrasound: 'Ultrasound',
  dingin: 'Pendinginan',
};

export function reportIssueUrl(pageUrl: string, title: string) {
  const params = new URLSearchParams({
    template: 'laporkan-kesalahan.yml',
    title: `[Koreksi] ${title}`,
    halaman: pageUrl,
  });
  return `${REPO_URL}/issues/new?${params}`;
}

export function historyUrl(filePath: string | undefined) {
  return filePath ? `${REPO_URL}/commits/main/${filePath.replace(/^\.\//, '')}` : REPO_URL;
}

export function fdaUrl(k: string) {
  return `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=${k}`;
}

export function formatNm(n: number) {
  return n.toLocaleString('id-ID');
}

export function formatDate(d: Date) {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
