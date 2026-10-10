# Berkontribusi ke Dermabook.id

Terima kasih ingin membantu. Dermabook.id adalah materi edukasi untuk dokter dan tenaga medis, sehingga setiap
perubahan harus **bersumber** dan tetap berada di **batas aplikasi edukasi**.

Dengan berpartisipasi, Anda setuju mengikuti [kode etik](CODE_OF_CONDUCT.md) proyek ini.

## Cara paling mudah: laporkan kesalahan

Setiap halaman punya tombol **"Laporkan kesalahan"** yang membuka formulir issue GitHub dengan alamat halaman sudah
terisi. Sertakan sumber yang mendukung koreksi Anda bila ada. Untuk mengusulkan topik baru, pakai template
issue **Usulan konten baru**.

## Mengubah atau menambah konten

1. Edit atau buat file di `content/`. Lihat file lain di folder yang sama sebagai contoh format.
2. Tambahkan setiap sumber baru ke `content/references.yaml`. Untuk PubMed, judul harus sama persis dengan judul di
   PubMed karena dicek otomatis.
3. Jalankan pemeriksaan lokal:
   ```bash
   npm run verify:references
   ```
   ```bash
   npm run build
   ```
4. Buka *pull request* dan isi checklist di templatenya. CI akan memeriksa skema, sumber, nomor 510(k), mesh 3D,
   tautan internal, serta aksesibilitas dan performa halaman (Lighthouse). Vercel juga membuat alamat preview
   untuk melihat hasilnya sebelum digabung.

Aturan sumber, hierarki, dan cara menulis ada di [docs/SOURCES.md](docs/SOURCES.md). Gambaran teknis ada di
[docs/ARSITEKTUR.md](docs/ARSITEKTUR.md).

## Batas aplikasi edukasi (R1 sampai R9)

Dermabook.id dirancang agar tetap menjadi materi edukasi umum, bukan perangkat lunak klinis. Fitur dan konten
**tidak boleh** memuat:

| # | Tidak boleh |
|---|---|
| R1 | Menerima data pasien (foto, scan, usia, kondisi) |
| R2 | Output yang dipersonalisasi ("cocok untuk pasien Anda", titik atau volume untuk wajah tertentu) |
| R3 | Kalkulator klinis (dosis, unit, mL, setelan energi laser) |
| R4 | Fitur kritis waktu (timer protokol darurat, alarm, triase) |
| R5 | Skor risiko atau prediksi hasil (*before/after*) |
| R6 | Koneksi ke atau kontrol atas alat |
| R7 | AI yang menjawab pertanyaan klinis |
| R8 | Klaim tanpa referensi, klaim superlatif, harga, atau testimoni |
| R9 | Parameter perawatan. Panjang gelombang boleh (pengetahuan), fluence atau energi tidak boleh |

Komplikasi dijelaskan secara naratif dengan rujukan ke pedoman resmi, tanpa dosis atau langkah demi langkah.

## Menulis konten

- Gunakan bahasa Indonesia yang natural dan dipakai sehari-hari oleh dokter dan pasien. Nama yang lazim boleh
  dipakai dengan istilah formalnya dalam kurung, misalnya "Botox (botulinum toxin)".
- Materi pasien (`patient`, `quick_facts`, narasi adegan) memakai bahasa awam. Pembahasan klinis boleh memakai
  istilah medis.
- Tulis ulang dengan kata-kata sendiri; jangan menyalin kalimat sumber.
- Angka sebaiknya dari dua sumber atau lebih. Bila hanya satu, tandai sebagai "sumber tunggal".
- Konten baru berstatus `draft` sampai ditinjau.

## Menambah alat ke katalog

Sebuah alat hanya dimasukkan bila **semua** syarat ini terpenuhi:

1. Terdaftar di database FDA 510(k) (dicek lewat openFDA).
2. Teks *Indications for Use* serta teknologi atau panjang gelombangnya bisa dibaca langsung dari dokumen 510(k) resmi.
3. Nama dagang di dokumen tidak ambigu, jelas model mana yang dicakup.

Bila salah satu tidak terpenuhi, alat belum dimasukkan. Simpan teks asli indikasi di file alat, dan jangan menulis
indikasi yang melebihi teks resmi. Status FDA di Amerika Serikat tidak sama dengan izin edar di Indonesia.

## Model 3D

Model turunan Z-Anatomy/BodyParts3D wajib berlisensi CC BY-SA 4.0. Jangan memakai model berlisensi non-komersial
atau tanpa lisensi jelas. Struktur buatan sendiri diberi label "Ilustrasi skematik". Lihat
[assets-src/README.md](assets-src/README.md).

## Lisensi kontribusi

Dengan berkontribusi, Anda setuju kode dirilis dengan lisensi MIT dan konten serta model 3D dengan CC BY-SA 4.0.
