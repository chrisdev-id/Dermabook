# Arsitektur Dermabook.id

Dermabook.id adalah **situs statis** yang dibangun dari konten berbentuk file. Tidak ada backend, database, login,
atau cron di server. Validasi dan cek recall berjalan di GitHub Actions; build dan hosting di Vercel.

```
 Kontributor ──PR──▶ Repositori GitHub (kode + content/ + public/models/)
                           │
             ┌─────────────┴──────────────┐
       GitHub Actions                    Vercel
 ┌──────────────────────────┐   ┌───────────────────────────────┐
 │ Saat PR dan push main:   │   │ Saat PR: build + URL preview  │
 │ validasi skema, cek      │   │ Saat push main: build situs   │
 │ PubMed, openFDA, mesh 3D │   │ statis + indeks pencarian,    │
 │ Mingguan: cek recall     │   │ terbit di CDN (HTTPS)         │
 │ openFDA → buat issue     │   └───────────────────────────────┘
 └──────────────────────────┘
```

## Teknologi

| Kebutuhan | Pilihan |
|---|---|
| Generator situs | [Astro](https://astro.build) dengan *content collections* dan skema Zod |
| 3D | Three.js (`GLTFLoader`, `DRACOLoader`, `OrbitControls`, `DecalGeometry`) |
| Tampilan | Tailwind CSS 4, huruf Plus Jakarta Sans, ikon Phosphor |
| Pencarian | Pagefind (indeks statis dibuat saat build), halaman `/cari/` dengan filter jenis halaman |
| Gambar pratinjau | `satori` + `@resvg/resvg-js`: satu PNG 1200x630 per halaman, dibuat saat build di `/og/` |
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
public/                  Aset statis: model GLB, decoder Draco, gambar
.github/                 CI: validasi PR dan main, kualitas halaman (Lighthouse), cek recall mingguan
vercel.json              Konfigurasi Vercel: build, header keamanan (CSP), cache
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

Situs di-hosting di Vercel sebagai situs statis:

- Vercel terhubung ke repositori GitHub. Push ke `main` menerbitkan versi produksi, dan setiap *pull request*
  mendapat URL preview untuk ditinjau sebelum digabung.
- `vercel.json` mengatur perintah build (`npm run build`, termasuk indeks Pagefind), folder hasil (`dist`),
  garis miring di akhir URL, header keamanan (CSP dan lainnya; HSTS dipasang otomatis oleh Vercel), tipe file GLB, serta cache aset.
- Halaman 404 memakai `dist/404.html` yang dibuat Astro.
- Alamat situs (URL kanonik dan gambar pratinjau) mengikuti domain produksi Vercel lewat
  `VERCEL_PROJECT_PRODUCTION_URL`, atau bisa ditimpa dengan variabel `SITE_URL`.

Validasi isi (PubMed, openFDA, mesh 3D) tidak dijalankan di Vercel, melainkan di GitHub Actions. Karena itu
perubahan konten sebaiknya selalu lewat *pull request* agar dicek sebelum masuk ke `main`. Secret opsional di
GitHub: `NCBI_API_KEY`, `OPENFDA_API_KEY`, dan variable `NCBI_EMAIL`.

Situs ini tetap bisa dipindah ke hosting statis lain (Cloudflare Pages, Netlify, atau shared hosting) karena hasil
build hanyalah file di folder `dist/`. Header di `vercel.json` perlu diterjemahkan ke format hosting tujuan.
