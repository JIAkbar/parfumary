/**
 * Parfumary — API Layer v3
 *
 * Auth: Kode Akun (teks bebas, disimpan di localStorage)
 *   - Kode = identitas user di D1, lintas device
 *   - Tanpa kode → data tersimpan lokal saja (localStorage)
 *   - Owner check → via /api/verify-owner (server-side)
 *
 * Tier akses:
 *   Tamu        → pakai kalkulator, lihat katalog (baca saja)
 *   User (kode) → + simpan resep pribadi ke D1, cross-device
 *   Owner       → + tambah/hapus katalog publik
 */

const KODE_KEY     = 'parfumary-kode';
const LOCAL_KEY    = 'parfumary-riwayat';
const MIGRATED_KEY = 'parfumary-migrated-d1';
const OWNER_KEY    = 'parfumary-is-owner';   // cache status owner (session)
const API_RIWAYAT  = '/api/riwayat';
const API_KATALOG  = '/api/katalog';

/* ── Kode Akun ───────────────────────────────── */
function getKode() {
  return localStorage.getItem(KODE_KEY) ?? null;
}
function setKode(k) {
  localStorage.setItem(KODE_KEY, k.trim());
  sessionStorage.removeItem(OWNER_KEY); // reset cache owner
}
function clearKode() {
  localStorage.removeItem(KODE_KEY);
  sessionStorage.removeItem(OWNER_KEY);
}

/* ── Owner check ─────────────────────────────── */
async function checkIsOwner() {
  // Cek cache sesi dulu (hindari request berulang)
  const cached = sessionStorage.getItem(OWNER_KEY);
  if (cached !== null) return cached === '1';

  const kode = getKode();
  if (!kode || !isOnline()) { sessionStorage.setItem(OWNER_KEY, '0'); return false; }

  try {
    const res = await fetch('/api/verify-owner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kode }),
    });
    const data = await res.json();
    const result = data.isOwner === true;
    sessionStorage.setItem(OWNER_KEY, result ? '1' : '0');
    return result;
  } catch {
    sessionStorage.setItem(OWNER_KEY, '0');
    return false;
  }
}

/* ── Cek apakah API tersedia ─────────────────── */
function isOnline() {
  return location.protocol !== 'file:' && navigator.onLine !== false;
}

/* ── Fallback localStorage ───────────────────── */
function localLoad() {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []; }
  catch { return []; }
}
function localSave(arr) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(arr));
}

/* ═══════════════════════════════════════════════
   RESEP PRIBADI (per kode akun)
══════════════════════════════════════════════ */

async function rwLoad() {
  const kode = getKode();
  if (!kode || !isOnline()) return localLoad();
  try {
    const res = await fetch(`${API_RIWAYAT}?kode=${encodeURIComponent(kode)}`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return localLoad();
  }
}

async function rwSave(entry) {
  const kode = getKode();
  if (!kode || !isOnline()) {
    const arr = localLoad(); arr.unshift(entry); localSave(arr); return;
  }
  try {
    const res = await fetch(API_RIWAYAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...entry, kode }),
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
  } catch (e) {
    console.error('[Parfumary] rwSave gagal, fallback ke localStorage:', e.message);
    const arr = localLoad(); arr.unshift(entry); localSave(arr);
  }
}

async function rwDelete(id) {
  const kode = getKode();
  if (!kode || !isOnline()) {
    localSave(localLoad().filter(x => x.id !== id)); return;
  }
  try {
    await fetch(`${API_RIWAYAT}?id=${id}&kode=${encodeURIComponent(kode)}`, { method: 'DELETE' });
  } catch {
    localSave(localLoad().filter(x => x.id !== id));
  }
}

/* ═══════════════════════════════════════════════
   KATALOG PUBLIK (owner-managed)
══════════════════════════════════════════════ */

async function katalogLoad() {
  if (!isOnline()) return [];
  try {
    const res = await fetch(API_KATALOG);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch { return []; }
}

async function katalogSave(entry) {
  const kode = getKode();
  await fetch(API_KATALOG, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Owner-Key': kode ?? '' },
    body: JSON.stringify(entry),
  });
}

async function katalogDelete(id) {
  const kode = getKode();
  await fetch(`${API_KATALOG}?id=${id}`, {
    method: 'DELETE',
    headers: { 'X-Owner-Key': kode ?? '' },
  });
}

/* ═══════════════════════════════════════════════
   MIGRASI localStorage → D1
══════════════════════════════════════════════ */
async function migrateToD1() {
  if (!isOnline() || !getKode()) return;
  if (localStorage.getItem(MIGRATED_KEY)) return;
  const local = localLoad();
  if (!local.length) { localStorage.setItem(MIGRATED_KEY, '1'); return; }

  console.log(`[Parfumary] Migrasi ${local.length} entri → D1…`);
  for (const entry of local) await rwSave(entry).catch(() => {});
  localStorage.removeItem(LOCAL_KEY);
  localStorage.setItem(MIGRATED_KEY, '1');
  console.log('[Parfumary] Migrasi selesai.');
}
