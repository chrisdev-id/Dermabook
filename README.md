# Dermabook.id

Platform edukasi **open-source** tentang anatomi wajah 3D, prosedur estetika, dan teknologi perangkat untuk dokter dan tenaga medis.

> Dermabook.id adalah materi belajar dan referensi umum. Dermabook.id tidak dimaksudkan untuk diagnosis, penentuan terapi,
> perencanaan tindakan, atau pengambilan keputusan klinis bagi pasien individual.

- **Tanpa akun, tanpa database, tanpa data pribadi.** Situsnya statis.
- **Setiap klaim bersumber.** Build gagal jika ada konten tanpa referensi.
- **Diverifikasi otomatis.** Setiap PMID dicek ke PubMed dan setiap nomor 510(k) ke openFDA.
- **Status transparan** di setiap halaman: draf, ditinjau komunitas, atau ditinjau dokter.

Dokumentasi: [Arsitektur](docs/ARSITEKTUR.md) · [Sumber konten](docs/SOURCES.md) · [Model 3D](docs/3d-inventory.md) · [Berkontribusi](CONTRIBUTING.md)

## Menjalankan secara lokal

Butuh Node.js ≥ 22.12.

```bash
npm install
```
```bash
npm run dev
```
Buka http://localhost:4321.

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build situs statis ke `dist/` (termasuk validasi skema dan indeks pencarian) |
| `npm run preview` | Melihat hasil build |
| `npm run verify:references` | Cek semua PMID di `content/references.yaml` ke PubMed |
| `npm run verify:devices` | Cek semua nomor 510(k) di `content/devices/` ke openFDA |
| `npm run check:recalls` | Cari recall FDA baru untuk alat di katalog |

## Struktur

```
content/            Konten (Markdown + frontmatter YAML), CC BY-SA 4.0
  references.yaml   Registri referensi (diverifikasi ke PubMed)
  tech-categories/  Kategori teknologi
  devices/          Alat (data 510(k) + teks asli Indications for Use)
  structures/ …     Struktur anatomi, zona bahaya, prosedur, komplikasi
src/
  content.config.ts Skema & aturan validasi konten
  pages/ layouts/ components/
scripts/            Skrip verifikasi PubMed/openFDA
public/             Aset statis (.htaccess, model 3D)
.github/            CI: validasi PR, deploy FTP, cek recall mingguan
```

## Berkontribusi

Panduan lengkap ada di [CONTRIBUTING.md](CONTRIBUTING.md). Ringkasnya:

1. Laporkan kesalahan lewat tombol **"Laporkan kesalahan"** di setiap halaman, atau buat issue.
2. Untuk mengubah konten, edit file di `content/`, tambahkan sumber ke `content/references.yaml`, lalu buka *pull request*.
   CI akan memeriksa sumber dan skema secara otomatis.
3. Ikuti checklist batas aplikasi edukasi (R1–R9) di template PR.

Aturan sumber dan penulisan ada di [docs/SOURCES.md](docs/SOURCES.md).

## Deploy

Setiap push ke `main` menjalankan validasi, build, lalu mengunggah `dist/` ke hosting via FTPS.
Atur secret repositori berikut: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`, `FTP_SERVER_DIR` (mis. `public_html/`).
Secret opsional: `NCBI_API_KEY`, `OPENFDA_API_KEY`, dan variable `NCBI_EMAIL`.

## Lisensi

- Kode: [MIT](LICENSE)
- Konten dan model 3D: [CC BY-SA 4.0](LICENSE-CONTENT)
- Atribusi pihak ketiga: [CREDITS.md](CREDITS.md)
