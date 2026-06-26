# claude.md — Parfumary

> Konteks proyek untuk dilanjutkan sesi berikutnya.
> Diperbarui: 2026-06-27 (sesi #2 — brand guide + bugfix)

---

## ✅ Progress Terakhir

### Sesi #1 (2026-06-26) — Scaffold + Kalkulator v1
- **Buat** `index.html` — kalkulator racik parfum lengkap, single-file, no backend
- **Desain**: Aesop Minimal — cream/warm palette, Cormorant serif + DM Mono
- **Kalkulasi**: bibit % dari botol → booster % dari bibit → pelarut = sisa
- **Fitur**: preset botol (10/20/30/50/100ml), input custom, toggle kualitas bibit, slider bibit & booster, progress bar, drop counter
- **Preset**: Cologne (8%), EDT (13%), EDP (20%), Extrait (30%)

### Sesi #2 (2026-06-27) — Brand Guide + Bugfix
- **Bugfix** `setQuality()`: sebelumnya `clamp(S.bibitPct, 25, 35)` → bibit dari preset (misal 8%) di-clamp ke 25 saat klik Premium. Fix: reset ke default min range, bukan clamp.
- **Tambah** brand guide collapsible di bawah quality toggle — daftar merk premium (Luzi, Mane, Iberchem, dll) vs medium (Parfarome, Expression Parfum, dll)
- **Riset** merk bibit Indonesia: premium = asal Eropa/Swiss, medium = produk lokal

---

## 📁 Struktur File

```
Parfumary/
├── claude.md       ← file ini
└── index.html      ← kalkulator utama (v1.1)
```

---

## 🧮 Formula Racik (dari referensi 12hours)

| Komponen | Perhitungan | Range |
|----------|-------------|-------|
| Bibit Premium | % × volume botol | 25–35% |
| Bibit Medium  | % × volume botol | 40–47% |
| Booster/Fixative | % × volume **bibit** | 0.01–5% dari bibit |
| Pelarut | botol − bibit − booster | sisa |
| Konversi tetes | 1 ml = 20 tetes | pipet standar |

---

## 🏷️ Daftar Merk Bibit

| Merk | Asal | Grade |
|------|------|-------|
| Luzi | 🇨🇭 Swiss | Premium |
| Mane | 🇫🇷 Prancis | Premium |
| Charabot | 🇫🇷 Prancis | Premium |
| Iberchem | 🇪🇸 Spanyol | Premium |
| Parfex | 🇨🇭 Swiss | Premium |
| Givaudan | 🇨🇭 Swiss | Premium |
| Symrise | 🇩🇪 Jerman | Premium |
| Firmenich | 🇨🇭 Swiss | Premium |
| Argeville | 🇫🇷 Prancis | Premium |
| Parfarome | 🇮🇩 Lokal | Medium |
| Expression Parfum | 🇮🇩 Lokal | Medium |
| Macbrame | 🇮🇩 Lokal | Medium |
| Florentine | 🇮🇩 Lokal | Medium |
| X-Ultimate | 🇮🇩 Lokal | Medium |
| Al Tahaani | 🇮🇩 Lokal | Medium |

Kunci klasifikasi: **asal negara** — Eropa/Swiss = Premium, Produk lokal Indonesia = Medium.

---

## 🎨 Desain

- **Aesthetic**: Aesop Minimal — warm cream, Swiss precision, ultra clean
- **Palette**: `#f0ebe0` bg, `#1a1208` ink, `#a07828` gold-bibit, `#7a5070` purple-boost, `#2e7060` teal-pelarut
- **Font**: Cormorant (display) + DM Mono (angka) + Jost (body)
- **Hosting target**: Cloudflare Pages (bukan Vercel — sudah limit free)
- **GitHub**: github.com/JIAkbar/parfumary (sudah dibuat user)

---

## 🔧 Keputusan Teknis

1. **Single HTML file** — tidak perlu framework (kalkulator murni, no backend/DB/login)
2. **Cloudflare Pages** — hosting gratis paling generous, deploy static file langsung dari GitHub
3. **Booster = % dari bibit** (bukan total botol) — sesuai referensi produk "dari total fragrance oil"
4. **Slider booster**: internal 1–500 → dibagi 100 = 0.01%–5.00% (presisi 2 desimal)
5. **setQuality() reset ke default** (bukan clamp) — agar toggle tidak corrupt nilai dari preset

---

## 🚀 Next Step

- [ ] **Deploy** ke Cloudflare Pages: `git push` ke github.com/JIAkbar/parfumary → connect CF Pages
- [ ] **Tambah merk** ke brand guide jika ada temuan baru dari user
- [ ] **Save/share formula**: URL params atau tombol copy teks
- [ ] **Riwayat racikan**: simpan formula ke localStorage (tanpa login)
- [ ] **PWA**: tambah manifest.json + service worker agar bisa install di homescreen
- [ ] **Branding**: tambah logo/ikon Parfumary

---

## ⚠️ Catatan Penting

- File `index.html` bisa dibuka langsung di browser (no server needed)
- Untuk deploy: push ke GitHub repo → sambungkan di Cloudflare Pages → auto deploy
- Booster < 0.05ml → tampil warning "gunakan pipet mikro" (sudah diimplementasi)
- Preset Cologne & EDT expand slider range di luar range kualitas normal (override dinamis)
- **Bug lama (FIXED)**: clamp bibitPct saat toggle quality → sekarang selalu reset ke default min
