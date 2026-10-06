# Aset sumber 3D

Model di `public/models/*.glb` dibangun dari **Z-Anatomy** (CC BY-SA 4.0, turunan BodyParts3D CC BY-SA 2.1 JP)
dengan skrip di folder ini. File besar (sumber `.blend` dan Blender) **tidak** disimpan di repo, melainkan di
`assets-src/cache/` yang di-ignore.

## Menyiapkan (sekali saja)

1. Unduh `Z-Anatomy.zip` (±87 MB) dari https://github.com/Z-Anatomy/Models-of-human-anatomy,
   lalu ekstrak ke `assets-src/cache/z-anatomy/`. Hasilnya `assets-src/cache/z-anatomy/Z-Anatomy/Startup.blend`.
2. Unduh **Blender 4.5 LTS** portable (Windows: `blender-4.5.x-windows-x64.zip`) dari
   https://download.blender.org/release/Blender4.5/, cek SHA-256-nya, lalu ekstrak ke `assets-src/cache/`.
   Untuk lokasi lain, atur variabel lingkungan `BLENDER` ke path `blender.exe`.

## Membangun ulang model

```bash
npm run models:build
```

Proses ini menjalankan `scripts/export_head.py` di Blender (mode latar belakang), lalu mengompres hasilnya dengan
Draco ke `public/models/`. Daftar struktur yang diekspor tercatat di `manifest.json`.

## Isi skrip

| File | Fungsi |
|---|---|
| `scripts/inventory.py` | Mendaftar semua objek di file Z-Anatomy (untuk menyusun `docs/3d-inventory.md`) |
| `scripts/export_head.py` | Mengekspor area kepala-leher per lapisan, dengan daftar struktur yang diizinkan (`ALLOW`) dan dikecualikan (`EXCLUDE`) |
| `scripts/build_schematic.py` | Membangun lapisan **skematik** dari hasil ekspor: kompartemen lemak superfisial & dalam, SMAS, dan ligamen retensi. Posisinya relatif terhadap landmark model. |
| `scripts/landmarks.py` | Mencetak posisi landmark (bola mata, region kulit, tulang, otot) untuk menyusun aturan di `build_schematic.py` |

Hal penting yang dilakukan `export_head.py`:
- **Lisensi**: model non-komersial di file Z-Anatomy (telinga dalam Univ. Dundee, ginjal) dan model otak tanpa
  lisensi jelas tidak pernah diekspor.
- **Kulit**: modifier Solidify 3 mm dimatikan dan diganti satu tingkat subdivisi. Tepi antar-region ditempelkan
  agar tidak retak, normal dihaluskan lintas region, dan ditambahkan `kulit__lapisan-dasar` (tidak bisa diklik)
  untuk menutup sisa celah.
- **Pembuluh & saraf** (kurva): resolusi diturunkan agar ringan.
- **Objek cermin** (sisi kiri, skala negatif): arah face dibalik setelah transformasi diterapkan.
- **Koordinat**: dipusatkan di tengah tengkorak, satuan **cm**, +Y ke atas, +Z ke depan wajah.
- **Penamaan mesh**: `<lapisan>__<nama-struktur>[-l|-r]`, sama dengan field `mesh` di `content/structures/`.
  Nama asli Z-Anatomy disimpan di `extras.source_name`.
