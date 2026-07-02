/**
 * Parfumary — API Layer v4
 *
 * Auth: Kode Akun (teks bebas, disimpan di localStorage)
 *   - Kode = identitas user di D1, lintas device
 *   - Wajib online + kode akun untuk simpan/lihat racikan — tidak ada lagi
 *     fallback localStorage
 *   - Owner check → Mode Owner terpisah (password beda dari kode akun),
 *     lihat unlockOwner()/isOwnerUnlocked()
 *
 * Tier akses:
 *   Tamu        → pakai kalkulator, lihat racikan siapapun yang kodenya
 *                 diketahui (baca saja)
 *   User (kode) → + simpan/hapus racikan pribadi miliknya sendiri
 *   Owner       → kode akun OWNER_KODE ("JIA99") + Mode Owner aktif →
 *                 bisa simpan/hapus racikan OWNER_KODE
 */

const KODE_KEY      = 'parfumary-kode';
const OWNER_KODE    = 'JIA99';                 // kode akun yang datanya dilindungi
const OWNER_PW_KEY  = 'parfumary-owner-pw';    // cache password Owner (session, per tab)
const API_RIWAYAT   = '/api/riwayat';
const API_VERIFY_OWNER = '/api/verify-owner';

/* ── Kode Akun ───────────────────────────────── */
function getKode() {
  return localStorage.getItem(KODE_KEY) ?? null;
}
function setKode(k) {
  localStorage.setItem(KODE_KEY, k.trim());
  lockOwner(); // ganti kode akun → Mode Owner ikut terkunci lagi
}
function clearKode() {
  localStorage.removeItem(KODE_KEY);
  lockOwner();
}

/* ── Mode Owner (password terpisah dari kode akun) ───────── */
function isProtectedKode(kode = getKode()) {
  return kode === OWNER_KODE;
}
function isOwnerUnlocked() {
  return !!sessionStorage.getItem(OWNER_PW_KEY);
}
function getOwnerPassword() {
  return sessionStorage.getItem(OWNER_PW_KEY) ?? '';
}
function lockOwner() {
  sessionStorage.removeItem(OWNER_PW_KEY);
}
async function unlockOwner(password) {
  try {
    const res = await fetch(API_VERIFY_OWNER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerPassword: password }),
    });
    const data = await res.json();
    if (data.isOwner === true) {
      sessionStorage.setItem(OWNER_PW_KEY, password);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
/* true kalau kode akun aktif BUKAN kode yang dilindungi (bebas tulis), atau
   kode yang dilindungi TAPI Mode Owner sudah aktif */
function canWrite() {
  return !isProtectedKode() || isOwnerUnlocked();
}

/* ═══════════════════════════════════════════════
   RESEP PRIBADI (per kode akun) — wajib online
══════════════════════════════════════════════ */

async function rwLoad() {
  const kode = getKode();
  if (!kode) return [];
  try {
    const res = await fetch(`${API_RIWAYAT}?kode=${encodeURIComponent(kode)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch (e) {
    console.error('[Parfumary] rwLoad gagal:', e.message);
    return [];
  }
}

/* Hasil operasi tulis: { ok, status, reason } — status 0 berarti request
   tidak sampai ke server sama sekali (network/offline), bukan ditolak
   server. reason dipakai UI untuk pesan yang akurat, bukan generik. */
function writeResult(ok, status = 0) {
  let reason = 'ok';
  if (!ok) {
    if (status === 0) reason = 'network';
    else if (status === 401) reason = 'unauthorized';
    else reason = 'server';
  }
  return { ok, status, reason };
}

/* Pesan error yang akurat sesuai alasan gagal — dipakai UI, bukan pesan
   generik "cek koneksi" untuk semua kasus. */
function writeErrorMessage(result, actionWord = 'menyimpan') {
  if (result.reason === 'unauthorized') {
    return `Ditolak — aktifkan Mode Owner dulu untuk ${actionWord} racikan ini.`;
  }
  if (result.reason === 'server') {
    return `Gagal ${actionWord} — server error (HTTP ${result.status}). Coba lagi nanti.`;
  }
  return `Gagal ${actionWord} — cek koneksi internet, lalu coba lagi.`;
}

async function rwSave(entry) {
  const kode = getKode();
  if (!kode) return writeResult(false, 0);
  try {
    const res = await fetch(API_RIWAYAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Owner-Key': getOwnerPassword() },
      body: JSON.stringify({ ...entry, kode }),
    });
    if (!res.ok) { console.error('[Parfumary] rwSave gagal: HTTP', res.status); return writeResult(false, res.status); }
    return writeResult(true, res.status);
  } catch (e) {
    console.error('[Parfumary] rwSave gagal (network):', e.message);
    return writeResult(false, 0);
  }
}

async function rwDelete(id) {
  const kode = getKode();
  if (!kode) return writeResult(false, 0);
  try {
    const res = await fetch(`${API_RIWAYAT}?id=${id}&kode=${encodeURIComponent(kode)}`, {
      method: 'DELETE',
      headers: { 'X-Owner-Key': getOwnerPassword() },
    });
    if (!res.ok) { console.error('[Parfumary] rwDelete gagal: HTTP', res.status); return writeResult(false, res.status); }
    return writeResult(true, res.status);
  } catch (e) {
    console.error('[Parfumary] rwDelete gagal (network):', e.message);
    return writeResult(false, 0);
  }
}
