# Perbaikan Kartu Riwayat & Booster Otomatis — Design

> Tanggal: 2026-07-02
> Status: Disetujui, siap masuk tahap implementation plan

## Konteks

User melaporkan 4 masalah setelah memakai `index.html` (kalkulator + riwayat) dan
`parfumdb.html` (database racikan):

1. Isi botol (`ml`) tertulis dua kali di kartu riwayat.
2. Grouping di tab "Resep Saya" mengelompokkan racikan berdasarkan **nama**, padahal
   yang lebih berguna adalah dikelompokkan berdasarkan **merk bibit**.
3. Tidak ada indikasi apakah persentase bibit racikan (mis. "25%") berasal dari salah
   satu preset (Cologne/EDT/EDP/Extrait) atau input manual (custom).
4. Field "Catatan Merk" (opsional) saat ini dipakai user secara manual untuk mencatat
   info booster (mis. "Booster 1 Tetes") — ini harus otomatis, bukan ketik manual.
   Juga, slider booster tidak bisa diset ke 0% murni (minimum 0.01%), padahal user
   perlu opsi "tanpa booster sama sekali".

Item terkait (izin viewer read-only vs owner JIA99 full-access) **di luar scope**
dokumen ini — akan dibahas di sesi brainstorm terpisah setelah 4 item ini selesai
dan terverifikasi.

## 1. Bug: Volume botol tertulis 2×

**Root cause**: di `index.html`, kartu riwayat menampilkan `e.vol` dua kali —
sekali di baris meta teks (`riwayat-meta`, baris ~1807) dan sekali lagi di badge
angka besar terpisah (`riwayat-vol`, baris ~1811).

**Fix**: hapus `${e.vol}ml` dari string `riwayat-meta`. Baris meta jadi:
`${e.merk} · ${e.quality} · ${e.bibitPct}% · ${e.tanggal}` (badge `riwayat-vol`
tetap menampilkan volume seperti sekarang).

**File**: `index.html` (fungsi `renderRiwayat`, sekitar baris 1803-1814).

## 2. Grouping Resep Saya: per merk, bukan per nama

**Current**: `renderGrouped()` di `parfumdb.html` mengelompokkan array racikan
dengan key `e.nama`.

**Fix**: ganti key grouping jadi `e.merk`. Racikan dengan merk kosong/`'—'`
dikelompokkan ke grup "Tanpa merk". Label counter grup diubah dari "N varian"
menjadi "N racikan" (lebih akurat karena grup sekarang berisi racikan
berbeda-beda nama dari merk yang sama, bukan varian dari satu nama).

**File**: `parfumdb.html` (fungsi `renderGrouped`, sekitar baris 998-1013).

## 3. Indikator Preset (baru)

**Pendekatan**: tidak perlu kolom database baru. `PRESET_PCT` di `index.html`
sudah mendefinisikan pemetaan deterministik `{quality, presetKey} → bibitPct`.
Karena tiap racikan yang tersimpan sudah punya `bibitPct` dan `quality`, preset
asal bisa **diturunkan ulang saat render** dengan reverse-lookup pada
`PRESET_PCT`:

```js
function inferPreset(quality, bibitPct) {
  const table = PRESET_PCT[quality] || {};
  const key = Object.keys(table).find(k => table[k] === bibitPct);
  return key || null; // null → custom
}
```

Label tampilan: `{cologne: 'Cologne', edt: 'EDT', edp: 'EDP', extrait: 'Extrait'}`,
fallback `'Custom'` kalau `null`.

**Tampil di**: kartu riwayat `index.html`, kartu "Resep Saya" & "Katalog" di
`parfumdb.html` — ditambahkan sebagai teks kecil di baris meta, mis.
`25% · Custom` atau `30% · Extrait`.

**Duplikasi kode**: karena `PRESET_PCT` saat ini hanya didefinisikan di
`index.html`, definisi yang sama (atau hasil inferensi) perlu tersedia juga di
`parfumdb.html`. Duplikasikan konstanta `PRESET_PCT` + fungsi `inferPreset` di
`parfumdb.html` (file terpisah, tidak ada shared JS module saat ini — konsisten
dengan pola project single-HTML-file yang sudah ada).

## 4. Booster: izinkan 0%, catatan otomatis, hapus field Catatan Merk

**4a. Slider booster bisa 0%**
- `#slBoost`: ubah `min="1"` → `min="0"` (nilai slider tetap ÷100 jadi persen,
  jadi 0 berarti 0.00%).
- `calc()` di `index.html`: tambah cabang eksplisit untuk `S.boostPct === 0` →
  tampilkan teks "Tanpa booster" / "0 tetes", **jangan** tampilkan warning pipet
  mikro (`rWarn`). Behavior lama (warning saat `boostMl < MICRO_ML` tapi > 0)
  tetap dipertahankan untuk kasus booster sangat kecil non-nol.

**4b. Hapus field "Catatan Merk" dari form simpan**
- Hapus input `#saveCatatanMerk` dari form (`index.html`).
- Hapus pemakaian `catatanMerk` di `confirmSave()` (tidak lagi dikirim ke
  `rwSave`).
- Kolom `catatan_merk` di `schema.sql` / D1 **tidak dihapus** — dibiarkan
  dormant (tidak ada tulisan baru ke kolom ini) supaya tidak perlu migrasi.
  Data lama di kolom ini tidak lagi ditampilkan di UI manapun.

**4c. Badge booster otomatis**
Ganti seluruh tempat yang sebelumnya merender `🏷 {e.catatanMerk}` dengan badge
yang dihitung otomatis dari `e.boostMl` / `e.boostPct` (data yang sudah
tersimpan, tidak perlu field baru):

```js
function boosterBadge(e) {
  if (!e.boostPct || e.boostPct <= 0) return '';
  const drops = Math.round(e.boostMl * 20); // 1 ml = 20 tetes
  return `🏷 Booster ${drops < 1 ? '< 1' : '~' + drops} tetes`;
}
```

Tampil di 3 tempat: kartu riwayat `index.html`, kartu "Resep Saya" &
"Katalog" `parfumdb.html`. Kalau `boostPct` 0 → badge tidak muncul sama
sekali (bukan cuma disembunyikan, memang tidak dirender).

**File yang terdampak (item 4)**: `index.html` (form, `confirmSave`,
`calc()`, render kartu), `parfumdb.html` (render kartu Resep Saya & Katalog).
`schema.sql` dan `functions/api/*.js` **tidak diubah**.

## Non-goals / Out of Scope

- Kolom `catatan_merk` tidak dihapus dari database (tidak ada migrasi).
- Fitur akses viewer read-only vs owner JIA99 full-access — dibahas terpisah.
- Tidak ada perubahan pada `wrangler.toml`, `schema.sql`, atau endpoint
  `functions/api/*`.

## Verifikasi

- Cek manual di browser (`preview_start` / dev server lokal):
  1. Simpan racikan baru dengan booster 0% → tidak ada badge booster, tidak ada
     warning pipet mikro, tersimpan sukses.
  2. Simpan racikan dengan booster > 0% → badge "🏷 Booster ~N tetes" muncul
     otomatis di semua 3 tampilan kartu.
  3. Kartu riwayat `index.html`: volume `ml` hanya muncul sekali per kartu.
  4. `parfumdb.html` tab Resep Saya, mode grouped: grup berdasarkan merk, bukan
     nama.
  5. Racikan dengan `bibitPct` yang cocok salah satu preset menampilkan nama
     preset-nya; yang tidak cocok menampilkan "Custom".
  6. Field "Catatan Merk" sudah tidak ada di form simpan; field "Catatan" biasa
     masih ada dan berfungsi normal.
