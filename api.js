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
 *   Tamu        → pakai kalkulator, lihat katalog & racikan siapapun yang
 *                 kodenya diketahui (baca saja)
 *   User (kode) → + simpan/hapus racikan pribadi miliknya sendiri
 *   Owner       → kode akun OWNER_KODE ("JIA99") + Mode Owner aktif →
 *                 bisa simpan/hapus racikan OWNER_KODE + kelola Katalog
 */

const KODE_KEY      = 'parfumary-kode';
const OWNER_KODE    = 'JIA99';                 // kode akun yang datanya dilindungi
const OWNER_PW_KEY  = 'parfumary-owner-pw';    // cache password Owner (session, per tab)
const API_RIWAYAT   = '/api/riwayat';
const API_KATALOG   = '/api/katalog';
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

async function rwSave(entry) {
  const kode = getKode();
  if (!kode) return false;
  try {
    const res = await fetch(API_RIWAYAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Owner-Key': getOwnerPassword() },
      body: JSON.stringify({ ...entry, kode }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return true;
  } catch (e) {
    console.error('[Parfumary] rwSave gagal:', e.message);
    return false;
  }
}

async function rwDelete(id) {
  const kode = getKode();
  if (!kode) return false;
  try {
    const res = await fetch(`${API_RIWAYAT}?id=${id}&kode=${encodeURIComponent(kode)}`, {
      method: 'DELETE',
      headers: { 'X-Owner-Key': getOwnerPassword() },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return true;
  } catch (e) {
    console.error('[Parfumary] rwDelete gagal:', e.message);
    return false;
  }
}

/* ═══════════════════════════════════════════════
   KATALOG PUBLIK (owner-managed)
══════════════════════════════════════════════ */

async function katalogLoad() {
  try {
    const res = await fetch(API_KATALOG);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch { return []; }
}

async function katalogSave(entry) {
  await fetch(API_KATALOG, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': getOwnerPassword() },
    body: JSON.stringify(entry),
  });
}

async function katalogDelete(id) {
  try {
    const res = await fetch(`${API_KATALOG}?id=${id}`, {
      method: 'DELETE',
      headers: { 'X-Owner-Key': getOwnerPassword() },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return true;
  } catch (e) {
    console.error('[Parfumary] katalogDelete gagal:', e.message);
    return false;
  }
}
