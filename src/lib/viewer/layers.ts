// Konfigurasi lapisan atlas 3D. Kunci harus sama dengan `layerKeys` di taxonomy.ts
// dan dengan nama file di public/models/<key>.glb.
import type { layerKeys } from '../taxonomy';

export type LayerKey = (typeof layerKeys)[number];

export interface LayerConfig {
  key: LayerKey;
  label: string;
  color: string;
  /** Tampil saat atlas pertama dibuka */
  visible: boolean;
  opacity: number;
  /** false = belum ada modelnya */
  available: boolean;
  /** true = lapisan ilustrasi skematik (bukan dari Z-Anatomy) */
  schematic?: boolean;
  /** true = warna per struktur diambil dari atribut warna di GLB */
  vertexColors?: boolean;
}

export const LAYERS: LayerConfig[] = [
  { key: 'kulit', label: 'Kulit', color: '#e3b195', visible: true, opacity: 1, available: true },
  { key: 'lemak-superfisial', label: 'Lemak superfisial', color: '#f2d36b', visible: false, opacity: 1, available: true, schematic: true, vertexColors: true },
  { key: 'smas', label: 'SMAS', color: '#c9b8e8', visible: false, opacity: 0.6, available: true, schematic: true, vertexColors: true },
  { key: 'smas-otot', label: 'Otot', color: '#b6463e', visible: false, opacity: 1, available: true },
  { key: 'lemak-dalam', label: 'Lemak dalam', color: '#e8b84a', visible: false, opacity: 1, available: true, schematic: true, vertexColors: true },
  { key: 'ligamen', label: 'Ligamen retensi', color: '#5bbfa8', visible: false, opacity: 1, available: true, schematic: true, vertexColors: true },
  { key: 'tulang', label: 'Tulang', color: '#ece4d0', visible: false, opacity: 1, available: true },
  { key: 'arteri', label: 'Arteri', color: '#d7263d', visible: false, opacity: 1, available: true },
  { key: 'vena', label: 'Vena', color: '#3a5bd9', visible: false, opacity: 1, available: true },
  { key: 'saraf', label: 'Saraf', color: '#f4c430', visible: false, opacity: 1, available: true },
  { key: 'kelenjar', label: 'Kelenjar', color: '#b48ad6', visible: false, opacity: 1, available: true },
];

/**
 * Arah kamera preset (ruang model: +Z = depan wajah, +Y = atas, +X = sisi kiri pasien).
 * Jaraknya dihitung otomatis agar kepala muat di layar.
 */
export const CAMERA_PRESETS = {
  depan: { direction: [0, 0.05, 1], label: 'Depan' },
  'kiri-34': { direction: [0.7, 0.08, 0.7], label: '¾ kiri' },
  'kanan-34': { direction: [-0.7, 0.08, 0.7], label: '¾ kanan' },
  'profil-kiri': { direction: [1, 0.05, 0], label: 'Profil kiri' },
  'profil-kanan': { direction: [-1, 0.05, 0], label: 'Profil kanan' },
} as const;

export type CameraPreset = keyof typeof CAMERA_PRESETS;

/** Perkiraan ukuran area kepala-leher model (cm) untuk menghitung jarak kamera. */
export const HEAD_SIZE = { width: 20, height: 32 };
