# Inventaris Model 3D Z-Anatomy untuk Dermabook.id

Dibuat 5 Oktober 2026 dari `Startup.blend` Z-Anatomy (commit repositori `Z-Anatomy/Models-of-human-anatomy`, branch master).
File sumber berisi 7.184 objek (4.569 mesh, 951 kurva). Area kepala-leher yang relevan diekspor dengan
`assets-src/scripts/export_head.py`, dan rinciannya ada di `assets-src/manifest.json`.

## Ringkasan

| Lapisan | Status | Mesh | Segitiga | Ukuran (Draco) |
|---|---|---|---|---|
| Kulit | ✅ Z-Anatomy (region permukaan) + lapisan dasar | 95 | 104.240 | 401 KB |
| Lemak superfisial | **Skematik** (build_schematic.py): dahi sentral/tengah, lateral temporal-pipi, orbital sup/inf/lat, nasolabial, pipi medial/tengah, jowl, mental | 20 | – | 75 KB |
| Otot | ✅ Z-Anatomy (termasuk fasia temporal, aponeurosis epikranial, fasia masseter, platysma) | 74 | 165.738 | 613 KB |
| SMAS | **Skematik**: lembaran di bawah lemak superfisial (pelipis, midface lateral, pipi, parotis) | 2 | – | 30 KB |
| Lemak dalam | **Skematik**: SOOF medial/lateral, deep medial cheek (medial/lateral), bantalan lemak bukal, ROOF | 12 | – | 42 KB |
| Ligamen | **Skematik**: retensi orbital, zygomaticocutaneous, mandibula, maseterik | 8 | – | 10 KB |
| Tulang | ✅ | 33 | 128.201 | 450 KB |
| Arteri | ✅ Sebagian besar ada | 48 | 42.096 | 165 KB |
| Vena | ✅ | 36 | 14.112 | 75 KB |
| Saraf | ⚠️ Batang utama ada, cabang wajah tidak terpisah | 18 | 23.056 | 81 KB |
| Kelenjar | ✅ | 10 | 5.648 | 28 KB |
| **Total** | | **356** | | **≈ 1,9 MB** |

Performa: 60 fps di desktop dengan semua lapisan utama aktif. **Uji di tablet belum dilakukan**: buka
`/atlas/?fps=1` di iPad/Android untuk menampilkan penghitung fps (target ≥ 30 fps).

## Lapisan skematik

Dibangun oleh `assets-src/scripts/build_schematic.py` dari GLB hasil ekspor. Posisi setiap struktur ditentukan relatif terhadap landmark model (region kulit Z-Anatomy, tulang, dan otot), lalu ditebalkan menjadi lapisan. Semua struktur ini berlabel `schematic: true` dan memiliki halaman penjelasan bersumber di `content/structures/`. Bentuknya ilustratif dan **bukan** hasil pencitraan.

## Celah dibanding daftar struktur minimum

| Struktur | Status di Z-Anatomy | Rencana |
|---|---|---|
| Foramen supraorbital, infraorbital, mental | Hanya ada sebagai penanda titik (`Supra-orbital notch`, `Mental foramen`). Foramen infraorbital tidak ada. | Jadikan hotspot landmark |
| Kompartemen lemak (dahi/temporal, orbital, SOOF, deep medial cheek, nasolabial, superficial cheek, buccal fat) | ✅ Skematik | Disempurnakan bila ada reviewer/ilustrator medis |
| SMAS sebagai lapisan utuh | ✅ Skematik | – |
| Ligamen retensi orbital, zygomaticocutaneous, mandibula, maseterik | ✅ Skematik. Ruang prezigomatik dan malar equator belum digambar | Tambahkan sebagai hotspot/penanda |
| a. dorsalis nasi, a. nasalis lateralis | ❌ Tidak ada | Skematik (kurva) atau catatan teks, acuan Cotofana 2019 |
| Cabang n. facialis (temporal, zigomatik, bukal, marginal mandibula, servikal) | ⚠️ Satu kurva "Facial nerve (VII)" tanpa nama cabang | Pisahkan atau beri hotspot per cabang |
| n. supraorbital, supratrochlear, infraorbital | ❌ Tidak ada sebagai kurva bernama | Skematik (kurva pendek dari foramen) |
| Duktus parotis (Stensen) | ✅ Ada (`Parotid duct`) | – |
| Depressor supercilii | ❌ Tidak ada | Catatan teks (sering dianggap bagian orbicularis oculi) |

**Acuan kelengkapan:** konsensus Delphi *core syllabus* (Kumar 2018, PMID 29707450). Tabel strukturnya di
artikel berbentuk gambar, sehingga perbandingan baris per baris harus dilakukan manual. Artikel tersebut berlisensi
CC BY-NC-ND, jadi daftarnya hanya dipakai sebagai acuan pengecekan dan tidak disalin ke repo.

## Bagian yang sengaja tidak diekspor

- **Lisensi tidak kompatibel**: model telinga dalam (Univ. Dundee, CC BY-NC-SA), ginjal (CC BY-NC), dan otak
  "Brainder"/"White matter" (lisensi tidak dinyatakan).
- **Tidak relevan untuk tindakan estetika wajah**: otak, otot leher dalam/punggung, laring, lidah, faring,
  otot ekstraokular, gigi, rambut kepala, kelenjar getah bening, serta arteri intrakranial.

## Struktur yang diekspor

### Arteri: 25 struktur (48 mesh, 42.096 segitiga)

Angular artery, Anterior deep temporal artery, Anterior ethmoidal artery, Buccal artery, External carotid artery, Facial artery, Frontal branch of superficial temporal artery, Inferior alveolar artery, Inferior labial artery, Infra-orbital artery, Internal carotid artery, Lacrimal artery, Left common carotid artery, Maxillary artery, Mental branch of inferior alveolar artery, Occipital artery, Ophthalmic artery, Posterior deep temporal artery, Right common carotid artery, Submental artery, Superficial temporal artery, Superior labial artery, Supra-orbital artery, Supratrochlear artery, Transverse facial artery

### Kelenjar & duktus: 5 struktur (10 mesh, 5.648 segitiga)

Accessory parotid gland, Parotid duct, Parotid gland, Sublingual gland, Submandibular gland

### Kulit (region permukaan): 48 struktur (95 mesh, 104.240 segitiga)

Angle of mouth, Anterior notch of auricle, Anterior segment of eyeball, Antihelix, Antitragus, Apex of auricle, Auricular region, Auricular tubercle, Buccal region, Carotid triangle, Cavity of concha, Concha of auricle, Crura of antihelix, Cymba conchae, Eminentia conchae, Eminentia fossae triangularis, Eminentia scaphae, Eyebrow, Fossa antihelica, Frontal region, Helix, Infra-orbital region, Intertragic incisure, Labial commissure, Lobule of auricle, Mastoid region, Mental region, Mentolabial sulcus, Nasal region, Nasolabial sulcus, Occipital region, Oral region, Orbital region, Parietal region, Parotideomasseteric region, Philtrum, Posterior auricular groove, Posterior segment of eyeball, Scapha, Sternocleidomastoid region, Submandibular triangle, Submental triangle, Temporal region, Tragus, Triangular fossa, Tubercle of upper lip, Zygomatic region, kulit__lapisan-dasar

### Saraf: 9 struktur (18 mesh, 23.056 segitiga)

Anterior division of mandibular nerve, Buccal nerve, Facial nerve (VII), Inferior alveolar nerve, Maxillary nerve, Mental nerve, Ophthalmic nerve, Posterior division of mandibular nerve, Trigeminal nerve (V)

### Otot & fasia: 37 struktur (74 mesh, 165.738 segitiga)

Anterior belly of digastric muscle, Bucinator, Corrugator supercilii, Deep part of masseter, Depressor anguli oris, Depressor labii inferioris, Depressor septi nasi, Epicranial aponeurosis, Frontalis muscle, Inferior head of lateral pterygoid muscle, Inferior tarsus, Levator anguli oris, Levator labii superioris, Levator nasolabialis, Masseteric fascia, Medial pterygoid muscle, Mentalis muscle, Mylohyoid muscle, Nasalis muscle, Occipitalis muscle, Orbicularis oris muscle, Orbital part of orbicularis oculi, Palpebral part of orbicularis oculi, Platysma, Posterior belly of digastric muscle, Procerus muscle, Risorius muscle, Sternocleidomastoid muscle, Stylohyoid muscle, Superficial layer of temporal fascia, Superficial part of masseter, Superior head of lateral pterygoid muscle, Superior tarsus, Temporalis muscle, Temporoparietalis muscle, Zygomaticus major muscle, Zygomaticus minor muscle

### Tulang & kartilago: 24 struktur (33 mesh, 128.201 segitiga)

Atlas (C1), Axis (C2), Ethmoid bone, Frontal bone, Hyoid bone, Inferior nasal concha bone, Lacrimal bone, Lateral process of nasal septal cartilage, Major alar cartilage, Mandible, Maxilla, Nasal bone, Nasal septal cartilage, Occipital bone, Parietal bone, Sphenoid bone, Temporal bone, Vertebra C3, Vertebra C4, Vertebra C5, Vertebra C6, Vertebra C7, Vomer, Zygomatic bone

### Vena: 18 struktur (36 mesh, 14.112 segitiga)

Angular vein, Anterior division of retromandibular vein, Anterior jugular vein, Common facial vein, External jugular vein, Facial vein, Inferior labial veins, Inferior ophthalmic vein, Internal jugular vein, Maxillary veins, Occipital vein, Posterior auricular vein, Posterior division of retromandibular vein, Retromandibular vein, Submental vein, Superficial temporal veins, Superior labial vein, Superior ophthalmic vein

