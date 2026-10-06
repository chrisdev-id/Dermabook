# Arsitektur Dermabook.id

Dermabook.id adalah **situs statis** yang dibangun dari konten berbentuk file. Tidak ada backend, database, login,
atau cron di server. Semua proses berat (validasi, build, cek recall) berjalan di GitHub Actions.

```
 Kontributor ──PR──▶ Repositori GitHub (kode + content/ + public/models/)
                           │
                     GitHub Actions
       ┌───────────────────┼──────────────────────────────┐
       │ Saat PR:          │ Saat merge ke main:          │ Mingguan:
       │ validasi skema    │ build situs statis           │ cek recall openFDA
       │ cek PubMed        │ + indeks pencarian           │ → buat issue bila ada
       │ cek openFDA       │ unggah via FTPS ─────────────┼──▶ Hosting
       │ cek mesh 3D       │                              │   (file statis + .htaccess)
       └───────────────────┴──────────────────────────────┘
```

## Teknologi

| Kebutuhan | Pilihan |
|---|---|
| Generator situs | [Astro](https://astro.build) dengan *content collections* dan skema Zod |
| 3D | Three.js (`GLTFLoader`, `DRACOLoader`, `OrbitControls`, `DecalGeometry`) |
| Tampilan | Tailwind CSS 4, huruf Plus Jakarta Sans, ikon Phosphor |
| Pencarian | Pagefind (indeks statis dibuat saat build) |
| QR | `qrcode`, dibuat di browser |
| Skrip verifikasi | TypeScript di `scripts/`, dijalankan langsung oleh Node 24 |
| Model 3D | Blender (skrip Python di `assets-src/scripts/`) dan `gltf-transform` untuk kompresi Draco |

## Struktur repositori

```
content/                 Konten (Markdown + frontmatter YAML), CC BY-SA 4.0
  references.yaml        Registri referensi; PMID dicek ke PubMed
  structures/            Struktur anatomi (dikaitkan ke nama mesh di model 3D)
  danger-zones/          Zona bahaya vaskular (posisi penanda di model)
  procedures/            Prosedur: materi pasien, fakta singkat, adegan presentasi, pembahasan klinis
  complications/         Edukasi komplikasi
  tech-categories/       Kategori teknologi perangkat
  devices/               Alat: data 510(k) dan teks asli Indications for Use
  recalls-reviewed.yaml  Recall FDA yang sudah ditinjau
src/
  content.config.ts      Skema dan aturan validasi semua koleksi
  layouts/ pages/ components/ styles/
  lib/viewer/            Viewer 3D (lapisan, preset kamera, zona, adegan)
scripts/                 Verifikasi PubMed/openFDA/mesh dan pembangun model
assets-src/              Skrip ekspor Blender + manifest mesh (file .blend tidak disimpan di repo)
public/                  Aset statis: model GLB, decoder Draco, .htaccess, gambar
.github/                 CI: validasi PR, deploy FTPS, cek recall mingguan
docs/                    Dokumentasi
```

## Model konten

Setiap koleksi didefinisikan di `src/content.config.ts`. Aturan yang ditegakkan saat build:

- Setiap entri wajib punya minimal satu referensi (`refs`), dengan `locator` (bagian, tabel, atau gambar) bila memungkinkan.
- `status` hanya boleh `draft`, `community`, atau `doctor`. Status selain `draft` wajib mencantumkan peninjau.
- Prosedur jenis `tindakan` wajib punya materi pasien (`patient`).
- Nama mesh di struktur dan adegan presentasi harus ada di model 3D (`npm run verify:meshes`).

Prosedur memiliki beberapa bagian:

| Field | Isi |
|---|---|
| `category` | Kelompok di halaman daftar: `injeksi`, `benang`, `perawatan-kulit`, `konsep` |
| `aka` | Nama lain yang dikenal pasien atau dokter |
| `quick_facts` | Fakta singkat untuk pasien: pemulihan, kapan hasil terlihat, lama efek, jumlah sesi, bisa dibatalkan, catatan kulit sawo matang |
| `depths` | Lapisan kulit yang dicapai (untuk perawatan permukaan kulit) |
| `patient` | Materi awam: apa itu, prosedurnya, setelah tindakan, tanda bahaya, harapan |
| `scenes` | Adegan mode presentasi: lapisan, struktur fokus, preset kamera, narasi awam |
| isi Markdown | Pembahasan klinis, tampil di balik konfirmasi "tenaga medis" |

## Viewer 3D

- Model kepala-leher diekspor dari Z-Anatomy/BodyParts3D (CC BY-SA), ditambah lapisan skematik buatan sendiri
  (kompartemen lemak, SMAS, ligamen) yang diberi label "Ilustrasi skematik".
- Setiap lapisan adalah satu file GLB terkompresi Draco dan dimuat saat dibutuhkan.
- Penamaan mesh: `lapisan__nama` dengan akhiran `-l`/`-r` untuk sisi. Skala 1 unit = 1 cm.
- Cara membangun ulang model ada di [assets-src/README.md](../assets-src/README.md); inventaris model di
  [3d-inventory.md](3d-inventory.md).

## Hosting

Cukup hosting yang bisa melayani file statis dan membaca `.htaccess` (PHP tidak diperlukan):

- Akses FTPS atau SFTP untuk deploy otomatis, dan SSL.
- Modul `mod_rewrite`, `mod_headers`, `mod_mime`, `mod_deflate`, `mod_expires`.
- `public/.htaccess` sudah mengatur tipe MIME GLB/WASM, cache, kompresi, HSTS, dan CSP.

Secret repositori untuk deploy: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR`. Opsional:
`NCBI_API_KEY`, `OPENFDA_API_KEY`, dan variable `NCBI_EMAIL`.
