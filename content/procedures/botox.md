---
title: Botox (botulinum toxin)
order: 2
category: injeksi
aka:
  - toksin botulinum tipe A
  - neuromodulator
summary: Obat suntik yang membuat otot wajah tertentu lebih rileks untuk sementara, sehingga kerutan saat berekspresi menjadi lebih halus.
quick_facts:
  downtime: Hampir tidak ada. Bentol kecil di titik suntikan biasanya hilang dalam setengah jam, dan sebagian orang memar selama beberapa hari.
  onset: Mulai terasa dalam 3 sampai 5 hari. Hasil penuh baru bisa dinilai sekitar 2 minggu setelah suntikan.
  duration: Umumnya 3 sampai 4 bulan, lalu gerakan otot kembali seperti semula.
  sessions: Satu kali suntik, lalu diulang bila efeknya sudah memudar.
  reversible: Tidak ada penawarnya. Bila hasilnya kurang sesuai, efeknya harus ditunggu sampai hilang sendiri, biasanya beberapa minggu.
  skin_tone: Obatnya sendiri tidak menimbulkan masalah pigmen. Memar di titik suntikan dapat meninggalkan bercak gelap sementara yang memudar dalam beberapa minggu sampai bulan.
structures:
  - frontalis
  - corrugator-supercilii
  - procerus
  - orbicularis-oculi
  - nasalis
  - levator-labii-superioris-alaeque-nasi
  - zygomaticus-major
  - orbicularis-oris
  - depressor-anguli-oris
  - mentalis
  - platysma
  - masseter
  - kelenjar-parotis
danger_zones: []
patient:
  what: Botox adalah obat suntik berisi toksin botulinum dalam jumlah sangat kecil. Obat ini membuat otot tertentu lebih rileks untuk sementara, sehingga kerutan yang muncul saat berekspresi, misalnya garis di antara alis, kerutan dahi, dan kerutan di sudut mata, menjadi lebih halus.
  how: Dokter memperhatikan wajah Anda saat diam dan saat berekspresi untuk menentukan otot mana yang membentuk kerutan. Setelah kulit dibersihkan, obat disuntikkan dengan jarum sangat halus di beberapa titik. Tindakannya biasanya hanya 10 sampai 20 menit.
  recovery:
    - Bentol kecil seperti bekas gigitan nyamuk di titik suntikan biasanya hilang dalam setengah jam.
    - Memar ringan dapat muncul, terutama di sekitar mata. Kompres dingin sebentar setelah tindakan dapat membantu.
    - Sakit kepala ringan di hari-hari pertama cukup sering terjadi dan akan hilang sendiri.
    - Banyak dokter menyarankan agar area suntikan tidak dipijat dan Anda tidak tidur tengkurap di malam pertama. Ini langkah kehati-hatian; konsensus para ahli tidak menemukan bukti kuat yang mengharuskannya.
  warning_signs:
    - Kelopak mata atas turun sehingga mata tampak lebih kecil.
    - Alis turun atau terasa berat.
    - Senyum atau bibir menjadi tidak simetris.
    - Penglihatan ganda, atau mata terasa kering dan berpasir.
  expectations: Botox melemaskan otot. Botox tidak mengisi volume, tidak mengencangkan kulit, dan tidak memperbaiki noda atau tekstur kulit. Kerutan yang sudah terlihat saat wajah diam hanya membaik perlahan dan sebagian. Bila tidak diulang, wajah kembali seperti sebelum perawatan, bukan menjadi lebih buruk.
scenes:
  - title: Kerutan saat berekspresi
    preset: depan
    layers:
      kulit: 1
    narration: Sebagian kerutan muncul saat kita berekspresi, karena otot di bawah kulit menarik kulit. Kerutan jenis inilah yang diperbaiki dengan Botox.
  - title: Otot-otot ekspresi wajah
    preset: depan
    layers:
      smas-otot: 1
    narration: Ini otot-otot ekspresi wajah. Setiap otot menarik ke arah tertentu, dan kerutan terbentuk melintang terhadap arah tarikannya.
  - title: Dahi
    preset: depan
    focus:
      - smas-otot__frontalis-muscle
    layers:
      smas-otot: 1
    narration: Otot dahi (frontalis) mengangkat alis. Saat otot ini bekerja, terbentuk kerutan mendatar di dahi.
  - title: Di antara alis
    preset: depan
    focus:
      - smas-otot__corrugator-supercilii
      - smas-otot__procerus-muscle
    layers:
      smas-otot: 1
    narration: Di antara alis ada otot corrugator dan procerus. Keduanya menarik alis ke tengah dan ke bawah, sehingga muncul garis kerut saat mengernyit.
  - title: Sudut mata
    preset: kiri-34
    focus:
      - smas-otot__orbital-part-of-orbicularis-oculi
    layers:
      smas-otot: 1
    narration: Otot melingkar di sekitar mata (orbicularis oculi) membentuk kerutan di sudut mata, yang sering disebut crow's feet, saat kita tersenyum.
  - title: Wajah bagian bawah
    preset: depan
    focus:
      - smas-otot__depressor-anguli-oris
      - smas-otot__mentalis-muscle
    layers:
      smas-otot: 1
    narration: Di wajah bagian bawah, otot penarik sudut mulut dan otot dagu juga bisa menjadi sasaran. Area ini sering dikombinasikan dengan filler.
refs:
  - id: sundaram-2016-bont-consensus
    locator: bagian "Indications", "Patient-Tailored Approach", "Upper Face", "Midface", "Lower Face and Neck", "Contraindications…"
  - id: camargo-2021-bont-cochrane
    locator: abstrak, "Main results" dan "Authors' conclusions"
  - id: boggio-2017-dynamic-model-botox
    locator: bagian "Introduction" dan "Discussion"
  - id: dermapedia-botox
    locator: bagian "Key Facts", "Recovery", "Risks", dan "In Deeper Skin Tones" (untuk fakta singkat pasien)
status: draft
---

## Tentang nama "Botox"

"Botox" sebenarnya merek dagang salah satu produk toksin botulinum tipe A, tetapi di Indonesia nama ini sudah lazim dipakai untuk semua jenisnya. Di halaman ini "Botox" berarti toksin botulinum tipe A secara umum. Produk yang berbeda bekerja dengan cara serupa, tetapi **satuan dosisnya tidak bisa disamakan** antarmerek.

## Prinsip

- Botox memperbaiki kerutan dinamis dengan merelaksasi otot. Karena itu pemahaman anatomi terapan, yaitu origo, insersi, dan fungsi otot ekspresi, mutlak diperlukan. Titik injeksi ditentukan sesuai kebutuhan tiap pasien.
- Konsensus Global Aesthetics mendorong penilaian **seluruh wajah** dan pendekatan yang disesuaikan dengan pasien. Konsensus juga mengingatkan bahwa pemberian berulang dengan dosis tinggi dapat menyebabkan atrofi otot sasaran dan hipertrofi kompensasi pada otot di sekitarnya.

## Bukti efektivitas

- Tinjauan Cochrane atas 65 uji acak (14.919 peserta) menyimpulkan bahwa toksin botulinum tipe A **mengurangi kerutan dalam empat minggu**, terutama pada garis glabela yang paling banyak diteliti.
- Cochrane juga mencatat bahwa bukti tentang lama efek, pemberian berulang, dan perbandingan langsung dengan perawatan lain masih terbatas.
- **Wajah atas:** bukti untuk garis glabela dan garis di sudut mata paling kuat. Untuk garis dahi, tujuannya memperbaiki kerutan tanpa membuat alis turun.
- **Wajah tengah:** data untuk Botox saja masih terbatas. Pada garis miring di pangkal hidung, levator labii superioris alaeque nasi sering berperan utama. Senyum gusi dapat dipengaruhi faktor tulang, gusi, dan/atau otot.
- **Wajah bawah dan leher:** DAO, mentalis, masseter, orbicularis oris, dan platysma. Kombinasi dengan filler memberi hasil lebih baik daripada masing-masing saja. Sebelum menyasar masseter, bedakan hipertrofi masseter sejati dari pembesaran kelenjar parotis.

## Keamanan

- Efek samping utama berasal dari obat yang bekerja pada otot di luar sasaran. Tinjauan sistematis yang dikutip konsensus mencatat ptosis kelopak **2,5%**, ptosis alis **3,1%**, gangguan sensorik mata **3%**, dan asimetri bibir atau wajah bawah **6,9%**. Cochrane juga menyimpulkan bahwa risiko ptosis kemungkinan lebih tinggi dibanding plasebo.
- Efek ini tidak bisa dibatalkan dan akan hilang sendiri setelah beberapa minggu. Lihat [ptosis setelah Botox](/komplikasi/ptosis-pasca-botox/) dan [asimetri setelah Botox](/komplikasi/asimetri-pasca-botox/).
- Injeksi diperlakukan sebagai tindakan bedah minor: riasan dan kulit dibersihkan dengan cermat, dan teknik injeksi dilakukan secara steril.
- **Kulit sawo matang atau gelap:** obatnya tidak menimbulkan risiko pigmen. Yang perlu diwaspadai adalah memar dan peradangan di titik suntikan, karena bisa meninggalkan hiperpigmentasi pascainflamasi sementara.
- Halaman ini tidak memuat dosis. Rujuk konsensus lengkap di daftar referensi.
