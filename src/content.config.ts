import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { cameraPresetKeys, layerKeys, procedureCategories, relevanceKeys, skinConcerns, skinDepths } from './lib/taxonomy';

/*
 * Skema konten Dermabook.id.
 * Aturan inti (lihat docs/ARSITEKTUR.md): setiap konten wajib bersumber, dan status
 * di atas "draft" wajib mencantumkan peninjau. Build gagal bila dilanggar.
 */

const isoDate = z.coerce.date();

const status = z.enum(['draft', 'community', 'doctor']);

const reviewer = z.object({
  name: z.string().min(1),
  role: z.string().optional(), // mis. "Dokter umum", "Sp.DVE"
  github: z.string().optional(),
  date: isoDate,
});

const citation = z.object({
  id: reference('references'),
  locator: z.string().optional(), // halaman / tabel / gambar
});

/** Field status + sumber yang dipakai bersama oleh semua konten edukasi. */
const sourced = {
  status,
  reviewers: z.array(reviewer).default([]),
  refs: z.array(citation).min(1, 'Setiap konten wajib punya minimal 1 referensi.'),
};

function requireReviewers<T extends { status: string; reviewers: unknown[] }>(d: T) {
  return d.status === 'draft' || d.reviewers.length > 0;
}
const reviewerMessage = {
  message: 'Status "community"/"doctor" wajib mencantumkan minimal 1 peninjau.',
  path: ['reviewers'],
};

const references = defineCollection({
  loader: file('content/references.yaml'),
  schema: z
    .object({
      type: z.enum(['pubmed', 'doi', 'url', 'book']),
      pmid: z.string().regex(/^\d+$/).optional(),
      pmcid: z.string().regex(/^PMC\d+$/).optional(),
      doi: z.string().optional(),
      url: z.url().optional(),
      title: z.string().min(1),
      first_author: z.string().min(1),
      journal: z.string().optional(),
      year: z.number().int().min(1800),
      license: z.string().optional(), // untuk sumber terbuka, mis. "CC BY 4.0"
      verified_at: isoDate,
    })
    .refine((r) => r.type !== 'pubmed' || !!r.pmid, {
      message: 'Referensi bertipe pubmed wajib punya pmid.',
      path: ['pmid'],
    }),
});

const structures = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/structures' }),
  schema: z
    .object({
      name_id: z.string(),
      name_en: z.string(),
      name_latin: z.string(),
      layer: z.enum(layerKeys),
      // Nama mesh di model 3D tanpa akhiran sisi (-l/-r), mis. "smas-otot__frontalis-muscle"
      meshes: z.array(z.string().regex(/^[a-z0-9-]+__[a-z0-9-]+$/, 'Format mesh: lapisan__nama')).min(1),
      schematic: z.boolean().default(false),
      summary: z.string(), // ringkasan awam 1-2 kalimat
      relevance: z.array(z.enum(relevanceKeys)).default([]),
      ...sourced,
    })
    .refine(requireReviewers, reviewerMessage),
});

const dangerZones = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/danger-zones' }),
  schema: z
    .object({
      name: z.string(),
      summary: z.string(), // penjelasan awam
      order: z.number().default(100),
      risk_level: z.enum(['tinggi', 'sedang']),
      structures: z.array(reference('structures')).default([]),
      // Penanda di atlas: pusat mesh-mesh "anchor" diproyeksikan ke kulit, lalu
      // digambar lingkaran berjari-jari `radius_cm`. Satu entri = satu penanda.
      overlay: z
        .array(
          z.object({
            anchor: z.array(z.string().regex(/^[a-z0-9-]+__[a-z0-9-]+$/)).min(1),
            radius_cm: z.number().positive().max(6),
            offset_cm: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
          }),
        )
        .min(1),
      ...sourced,
    })
    .refine(requireReviewers, reviewerMessage),
});

/**
 * Satu langkah presentasi. Kamera tidak ditulis manual: viewer mengarahkan kamera ke
 * struktur `focus` (nama mesh dasar) atau ke `preset`. Lapisan yang tidak disebut disembunyikan.
 */
const scene = z.object({
  title: z.string(),
  narration: z.string(), // bahasa awam
  preset: z.enum(cameraPresetKeys).default('depan'),
  focus: z.array(z.string().regex(/^[a-z0-9-]+__[a-z0-9-]+$/)).default([]),
  layers: z.partialRecord(z.enum(layerKeys), z.number().min(0).max(1)).default({ kulit: 1 }),
  zones: z.boolean().default(false),
});

/** Materi untuk pasien (bahasa awam), dipakai di mode presentasi, halaman materi, dan versi cetak. */
const patientInfo = z.object({
  what: z.string(),
  how: z.string(),
  recovery: z.array(z.string()).min(1),
  warning_signs: z.array(z.string()).min(1),
  expectations: z.string(),
});

const procedures = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/procedures' }),
  schema: z
    .object({
      title: z.string(),
      summary: z.string(),
      order: z.number().default(100),
      kind: z.enum(['tindakan', 'konsep']).default('tindakan'),
      // Pengelompokan di halaman daftar prosedur
      category: z.enum(procedureCategories).default('injeksi'),
      // Nama lain yang dikenal pasien/dokter, mis. "Botox", "neuromodulator"
      aka: z.array(z.string()).default([]),
      // Fakta singkat untuk pasien (bahasa awam). Bukan dosis atau parameter tindakan.
      quick_facts: z
        .object({
          downtime: z.string(), // masa pemulihan
          onset: z.string(), // kapan hasil terlihat
          duration: z.string(), // berapa lama bertahan
          sessions: z.string(), // perkiraan jumlah sesi
          reversible: z.string(), // bisa dibatalkan?
          skin_tone: z.string(), // catatan untuk kulit sawo matang/gelap
        })
        .partial()
        .optional(),
      // Lapisan kulit yang dicapai (untuk perawatan permukaan kulit), ilustratif
      depths: z.array(z.enum(skinDepths)).default([]),
      structures: z.array(reference('structures')).default([]),
      danger_zones: z.array(reference('danger-zones')).default([]),
      patient: patientInfo.optional(),
      scenes: z.array(scene).default([]),
      ...sourced,
    })
    .refine(requireReviewers, reviewerMessage)
    .refine((d) => d.kind === 'konsep' || !!d.patient, {
      message: 'Prosedur tindakan wajib memiliki materi pasien (patient).',
      path: ['patient'],
    }),
});

const complications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/complications' }),
  schema: z
    .object({
      title: z.string(),
      summary: z.string(),
      order: z.number().default(100),
      severity: z.enum(['ringan', 'serius']),
      related_procedures: z.array(reference('procedures')).default([]),
      structures: z.array(reference('structures')).default([]),
      // Tanda bahaya dalam bahasa awam: kapan pasien harus segera menghubungi dokter
      patient_signs: z.array(z.string()).default([]),
      ...sourced,
    })
    .refine(requireReviewers, reviewerMessage),
});

const techCategories = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/tech-categories' }),
  schema: z
    .object({
      name: z.string(),
      short: z.string(), // satu kalimat awam
      order: z.number(),
      energy: z.enum(['laser', 'cahaya', 'radiofrekuensi', 'ultrasound', 'dingin']),
      wavelengths_nm: z.array(z.number().int().positive()).default([]),
      target: z.string(),
      depths: z.array(z.enum(skinDepths)).min(1),
      concerns: z.array(z.enum(skinConcerns)).min(1),
      ...sourced,
    })
    .refine(requireReviewers, reviewerMessage),
});

const fdaClearance = z.object({
  k_number: z.string().regex(/^K\d{6}$/),
  decision_date: isoDate,
  device_name: z.string(),
  applicant: z.string(),
});

const devices = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/devices' }),
  schema: z
    .object({
      name: z.string(),
      manufacturer: z.string(),
      categories: z.array(reference('tech-categories')).min(1),
      // Hanya masalah kulit yang disebut di indikasi resmi; boleh kosong
      // bila indikasinya umum (mis. "elektrokoagulasi dan hemostasis").
      concerns: z.array(z.enum(skinConcerns)).default([]),
      lay: z.string(), // ringkasan awam, tidak melebihi indikasi resmi
      technology: z.string(), // persis sesuai dokumen 510(k)
      fda: z.array(fdaClearance).min(1, 'Alat wajib punya minimal 1 nomor 510(k) terverifikasi.'),
      official_url: z.url(),
      verified_at: isoDate,
      status,
      reviewers: z.array(reviewer).default([]),
      refs: z.array(citation).default([]), // literatur tambahan (opsional)
    })
    .refine(requireReviewers, reviewerMessage),
});

export const collections = {
  references,
  structures,
  'danger-zones': dangerZones,
  procedures,
  complications,
  'tech-categories': techCategories,
  devices,
};
