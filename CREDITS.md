# Kredit & Atribusi

## Model anatomi 3D
Atribusi wajib (teks persis sesuai `License.txt` Z-Anatomy):

- **"BodyParts3D - The Database Center for Life Science - CC-BY-SA 2.1 Japan"**
  (https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html)
- **"Z-Anatomy - The libre 3D atlas of anatomy - CC-BY-SA 4.0"**
  (https://github.com/Z-Anatomy/Models-of-human-anatomy)

File Z-Anatomy juga memuat model yang diadaptasi dari pihak lain. Bagian saraf kranial kemungkinan berasal dari:
- **"Cranial Nerves and Foramina - by University of Dundee, CAHID - CC-BY 4.0"** (kompatibel dengan CC BY-SA)

Modifikasi oleh Dermabook.id: pemotongan area kepala-leher, penyederhanaan mesh, kompresi Draco,
dan penambahan struktur skematik (ditandai `schematic` di konten dan di metadata GLB).
Proses lengkapnya ada di `assets-src/README.md` dan `docs/3d-inventory.md`.

**Yang tidak boleh diambil dari file Z-Anatomy:** file tersebut juga memuat model pihak ketiga
dengan lisensi **non-komersial**, misalnya *Anatomy of the Inner Ear* (University of Dundee,
CC BY-NC-SA 4.0) dan *Kidney* (CC BY-NC 4.0). Model-model itu **tidak diekspor**, agar seluruh
aset Dermabook.id tetap CC BY-SA. Jangan pula memakai GLB hasil konversi pihak ketiga yang sudah
tercampur lisensi non-komersial (misalnya repositori `Connacri/3d-anatomy`).

## Data
- **openFDA** (U.S. Food and Drug Administration): data 510(k) dan recall perangkat.
  openFDA tidak dimaksudkan untuk pengambilan keputusan klinis. Dermabook.id tidak berafiliasi dengan FDA.
- **PubMed / NCBI E-utilities** (U.S. National Library of Medicine): metadata referensi.

## Gambar
_Belum ada gambar pihak ketiga. Setiap gambar yang ditambahkan wajib dicatat di sini:_

| File | Sumber | Penulis | Lisensi | Perubahan |
|---|---|---|---|---|

## Perangkat lunak
- Decoder Draco (`public/vendor/draco/`, dari paket three.js): Apache License 2.0, © Google.
- Astro, Three.js, Tailwind CSS, Pagefind, glTF-Transform, dan dependensi lain di `package.json`, masing-masing dengan lisensinya.
- Model diproses dengan Blender 4.5 LTS (GPL). Blender tidak ikut didistribusikan.
