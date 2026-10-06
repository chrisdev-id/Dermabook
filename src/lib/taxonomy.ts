// Taksonomi bersama antara skema konten dan tampilan.

export const layerKeys = [
  'kulit',
  'lemak-superfisial',
  'smas',
  'smas-otot',
  'lemak-dalam',
  'ligamen',
  'tulang',
  'arteri',
  'vena',
  'saraf',
  'kelenjar',
] as const;

/** Harus sama dengan kunci CAMERA_PRESETS di lib/viewer/layers.ts */
export const cameraPresetKeys = ['depan', 'kiri-34', 'kanan-34', 'profil-kiri', 'profil-kanan'] as const;

/** Jenis tindakan yang membuat sebuah struktur penting untuk dipahami. */
export const relevanceKeys = ['toksin', 'filler', 'benang', 'energi'] as const;

export const relevanceLabel: Record<(typeof relevanceKeys)[number], string> = {
  toksin: 'Botox',
  filler: 'Filler',
  benang: 'Thread lift',
  energi: 'Perangkat energi',
};

export const skinConcerns = [
  'pigmen',
  'vaskular',
  'tekstur-bekas-jerawat',
  'kerutan',
  'kekenduran',
  'rambut',
  'lemak',
  'akne',
  'tato',
] as const;

export const skinDepths = [
  'epidermis',
  'dermis-papiler',
  'dermis-retikular',
  'subkutan',
  'smas',
] as const;


/** Kelompok prosedur di halaman daftar. */
export const procedureCategories = ['injeksi', 'benang', 'perawatan-kulit', 'konsep'] as const;

export const procedureCategoryLabel: Record<(typeof procedureCategories)[number], string> = {
  injeksi: 'Injeksi',
  benang: 'Benang',
  'perawatan-kulit': 'Perawatan kulit',
  konsep: 'Konsep dasar',
};
