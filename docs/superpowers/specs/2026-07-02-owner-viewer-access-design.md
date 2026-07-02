# Akses Owner vs Viewer + Hapus localStorage — Design

> Tanggal: 2026-07-02
> Status: Disetujui, langsung eksekusi (tanpa sesi implementation plan terpisah, sesuai preferensi user)

## Konteks

User (kode akun "JIA99") mau membagikan koleksi racikan pribadinya ke orang lain
supaya bisa dilihat (hasil ujicoba lab, berharga), tapi khawatir orang lain yang
tahu kode "JIA99" bisa sengaja menghapus/mengubahnya. Diskusi menghasilkan 2
keputusan:

1. **localStorage dihapus total** — semua fitur simpan/lihat racikan wajib
   online + kode akun. Tidak ada lagi mode offline/lokal-saja.
2. **Pisahkan "kode akun" (untuk lihat) dari "password Owner" (untuk
   ubah/hapus)** — supaya kode "JIA99" bisa dibagi terbuka untuk viewing tanpa
   membuka akses tulis.

**Root cause masalah lama**: `functions/api/verify-owner.js` mencocokkan
`kode` (yang sama dipakai untuk simpan/lihat racikan pribadi) langsung ke
`env.OWNER_KEY`. Jadi satu string "JIA99" = baik identitas akun maupun kunci
admin. Siapapun yang tahu "JIA99" otomatis dapat kedua-duanya.

## A. Hapus localStorage

- `api.js`: hapus `localLoad`, `localSave`, `isOnline()`-fallback di
  `rwLoad`/`rwSave`/`rwDelete`, dan hapus `migrateToD1()` seluruhnya (fungsi
  ini sekaligus jadi sumber bug duplikasi entri yang ditemukan sebelumnya —
  terhapus otomatis bersama penghapusan ini).
- `rwSave`/`rwLoad`/`rwDelete` baru: selalu butuh `kode` terisi; kalau
  kosong → lempar/return gagal dengan pesan jelas, UI blok tombol simpan dan
  arahkan ke "Masukkan Kode Akun" dulu. Kalau fetch API gagal (offline/D1
  down) → tampilkan error jelas ke user, **tidak** diam-diam nyimpan lokal.
- `index.html` & `parfumdb.html`: hapus badge/logic "Tersimpan di HP ini".
  Badge sync selalu berbentuk "☁ [kode] · Tersinkron" atau (kalau kode
  belum diisi) ajakan mengisi kode sebelum bisa simpan.
- Katalog publik tidak berubah (sudah online-only dari awal).

## B. Server: pisah verifikasi Owner dari kode akun

- **`functions/api/verify-owner.js`**: ganti total. Endpoint sekarang
  menerima `{ ownerPassword }` (bukan `kode`), dicocokkan ke `env.OWNER_KEY`
  (secret BARU, nilainya harus beda dari kode akun "JIA99" — user ganti
  manual di CF Pages dashboard).
- **`functions/api/riwayat.js`**: tambah konstanta `OWNER_KODE = 'JIA99'`
  (kode akun yang datanya dilindungi — hardcode di file ini, tidak perlu
  kolom DB baru). Untuk POST dan DELETE: kalau `kode` (body/query) sama
  dengan `OWNER_KODE`, wajib ada header `X-Owner-Key` yang cocok dengan
  `env.OWNER_KEY`, pola persis seperti fungsi `isOwner()` yang sudah ada di
  `functions/api/katalog.js`. Kalau tidak cocok → `401 Unauthorized`. GET
  tetap terbuka tanpa syarat tambahan (siapapun yang tahu kode bisa baca).
- Kode akun selain "JIA99" tidak terpengaruh — tetap kode = akses penuh baca
  + tulis ke racikan miliknya sendiri (tidak ada pemisahan Owner untuk kode
  lain, sesuai scope yang disepakati).

## C. Client: Mode Owner terpisah dari kode akun

- Tambah UI baru "🔓 Mode Owner" (tombol terpisah dari kotak kode akun) di
  `parfumdb.html` (dan `index.html` kalau area riwayatnya perlu). Klik buka
  modal kecil minta `ownerPassword`, kirim ke `/api/verify-owner` versi baru,
  simpan status di `sessionStorage` (pola sama seperti cache `isOwnerCached`
  yang sudah ada untuk Katalog).
- Semua request `rwSave`/`rwDelete` yang menyasar kode "JIA99" ikut
  menyertakan header `X-Owner-Key` (ambil dari `ownerPassword` yang
  tersimpan sesi, kosong kalau belum unlock).
- **UX saat kode akun = "JIA99" tapi Mode Owner belum aktif**: tombol
  Simpan/Hapus/Edit tetap tampil (supaya user tahu ini area yang sama), tapi
  begitu diklik tanpa Mode Owner aktif, tampilkan pesan eksplisit "Mode
  lihat saja — aktifkan Mode Owner untuk mengubah" (dicek di client
  sebelum kirim request, supaya tidak bikin request percuma yang pasti
  ditolak server).
- Untuk kode akun selain "JIA99": tidak ada perubahan UX, tombol
  Simpan/Hapus jalan seperti biasa.

## D. Setup manual yang perlu user lakukan

1. Di CF Pages dashboard → ganti secret `OWNER_KEY` jadi password BARU yang
   beda dari kode akun "JIA99" (kode akun "JIA99" sendiri **tidak** berubah,
   tetap dipakai untuk identifikasi/lihat racikan).
2. Kalau masih ada data racikan yang cuma ada di localStorage HP (belum
   pernah tersinkron ke D1), export dulu lewat tombol "Export JSON" yang
   sudah ada **sebelum** deploy perubahan ini, supaya bisa di-import balik
   manual via kode akun setelah localStorage dimatikan.

## Non-goals / Out of Scope

- Tidak ada pemisahan viewer/owner untuk kode akun selain "JIA99" — fitur
  ini spesifik untuk melindungi koleksi racikan JIA99 dari user lain.
- Tidak ada rate-limiting atau audit log percobaan akses Owner yang gagal —
  di luar scope permintaan saat ini.
- Task terpisah `task_8771afe2` (fix duplikasi `migrateToD1`) jadi tidak
  relevan lagi karena fungsi tersebut dihapus total di sini — perlu
  dikoordinasikan manual oleh user saat merge (lihat catatan di percakapan).

## Verifikasi

1. Tanpa kode akun sama sekali → tombol Simpan di kalkulator diblok dengan
   pesan jelas, tidak ada data tersimpan ke manapun.
2. Kode akun = "JIA99", Mode Owner **belum** aktif → racikan JIA99 bisa
   dilihat (GET jalan), tapi klik Simpan/Hapus menampilkan pesan "Mode
   lihat saja" dan **tidak** mengirim request ke server.
3. Aktifkan Mode Owner dengan password baru yang benar → Simpan/Hapus ke
   racikan kode "JIA99" berhasil normal.
4. Aktifkan Mode Owner dengan password salah → ditolak, status tetap
   read-only.
5. Kode akun selain "JIA99" → simpan/hapus racikan sendiri tetap jalan
   normal tanpa perlu Mode Owner sama sekali.
6. Coba panggil `POST /api/riwayat` langsung (curl/devtools) dengan
   `kode: "JIA99"` tanpa header `X-Owner-Key` → server balas `401`
   (verifikasi ini ditegakkan di server, bukan cuma disembunyikan di UI).
