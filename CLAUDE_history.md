# claude_history.md — Parfumary

> Arsip sesi lama. Dipindah dari CLAUDE.md saat auto-trim (lihat CLAUDE.md untuk update terbaru).

---

### Sesi #5 (2026-06-27) — Kode Akun + Katalog Publik + Owner Mode
- **Redesign auth**: hapus Google Sign-In → ganti dengan **Kode Akun** (teks bebas)
  - User ketik kode sendiri (misal `JIA99`) → kode = identitas di D1
  - Kode yang sama di device lain → data yang sama (cross-device) ✅
  - Tanpa kode → pakai kalkulator + lihat katalog, resep di localStorage saja
- **3 tier akses**:
  - Tamu → pakai kalkulator, lihat katalog, salin formula
  - User (ada kode) → + simpan resep pribadi ke D1 cross-device
  - Owner (kode = OWNER_KEY env var) → + kelola katalog publik
- **Buat** `functions/api/katalog.js` — GET (publik), POST/DELETE (owner via X-Owner-Key header)
- **Buat** `functions/api/verify-owner.js` — cek kode vs OWNER_KEY server-side
- **Update** `functions/api/riwayat.js` — rename device_id → kode
- **Rewrite** `api.js` — kode akun system + katalog functions (katalogLoad/Save/Delete)
- **Update** `schema.sql` — tambah tabel `katalog`, ubah `device_id` → `kode` di racikan
- **Update** `parfumdb.html` — 2 tab: Katalog (publik) + Resep Saya (kode akun)
  - Tab Katalog: tampil ke semua orang, owner ada tombol "×" (hapus)
  - Tab Resep Saya: perlu kode, owner ada tombol "Publik" (push ke katalog)
  - Kode badge di header (hijau jika ada kode, abu-abu jika belum)
  - Owner badge muncul jika kode = OWNER_KEY
- **Update** `index.html` — kode akun widget di header (gantikan Google login overlay)

### Sesi #4 (2026-06-27) — D1 Backend (superseded by sesi #5)
- Buat backend D1 + parfumdb.html + Google auth (kemudian diganti kode akun)

### Sesi #3 (2026-06-27) — Brand Guide Expand + Autocomplete
- **Riset** 4 agent paralel → temukan merk baru (Expressions Parfumees, dll)
- **Update** brand guide → 3 tier, BRANDS array di JS (23 merk + grade + origin)
- **Implementasi** autocomplete/searchable dropdown field "Merk Bibit"
- **Konfirmasi hapus**: X-Ultimate, IFF, Symrise, NICA, Al Tahaani (tidak ada di Shopee)

### Sesi #2 (2026-06-27) — Brand Guide + Bugfix
- **Bugfix** `setQuality()`: reset ke default min, bukan clamp
- **Tambah** brand guide collapsible

### Sesi #1 (2026-06-26) — Scaffold + Kalkulator v1
- **Buat** `index.html` — kalkulator single-file, Aesop Minimal design
- Formula: bibit % botol → booster % bibit → pelarut = sisa
- Preset: Cologne/EDT/EDP/Extrait
