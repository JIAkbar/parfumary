/**
 * Parfumary — Cloudflare Pages Function
 * Route: /api/riwayat
 *
 * GET    /api/riwayat?kode=xxx          → ambil semua racikan dengan kode ini
 * POST   /api/riwayat                   → simpan 1 entry baru
 * DELETE /api/riwayat?id=xxx&kode=xxx  → hapus 1 entry
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Key',
  'Content-Type': 'application/json',
};

// Kode akun yang datanya dilindungi Owner Password — GET tetap terbuka untuk
// siapapun (dibagikan bebas), tapi POST/DELETE butuh header X-Owner-Key yang
// cocok dengan env.OWNER_KEY (password Owner, TERPISAH dari kode akun ini).
const OWNER_KODE = 'JIA99';

function isOwner(request, env) {
  const key = request.headers.get('X-Owner-Key') ?? '';
  return key === (env.OWNER_KEY ?? '');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

function normalizeRow(r) {
  return {
    id:       r.id,
    nama:     r.nama,
    merk:     r.merk,
    vol:      r.vol,
    quality:  r.quality,
    bibitPct: r.bibit_pct,
    boostPct: r.boost_pct,
    bibitMl:  r.bibit_ml,
    boostMl:  r.boost_ml,
    pelMl:    r.pel_ml,
    tanggal:  r.tanggal,
    catatan:  r.catatan ?? '',
    catatanMerk: r.catatan_merk ?? '',
  };
}

export async function onRequest({ request, env }) {
  const url    = new URL(request.url);
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { headers: CORS });

  // ── GET ───────────────────────────────────────────────
  if (method === 'GET') {
    const kode = url.searchParams.get('kode');
    if (!kode) return json({ error: 'kode wajib' }, 400);

    const { results } = await env.DB
      .prepare('SELECT * FROM racikan WHERE kode = ? ORDER BY created_at DESC')
      .bind(kode)
      .all();

    return json(results.map(normalizeRow));
  }

  // ── POST ──────────────────────────────────────────────
  if (method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Body JSON tidak valid' }, 400); }

    const { kode, id, nama, merk, vol, quality,
            bibitPct, boostPct, bibitMl, boostMl, pelMl, tanggal, catatan, catatanMerk } = body;

    if (!kode || !id) return json({ error: 'kode & id wajib' }, 400);
    if (kode === OWNER_KODE && !isOwner(request, env)) {
      return json({ error: 'Unauthorized — perlu Mode Owner' }, 401);
    }

    await env.DB
      .prepare(`
        INSERT OR REPLACE INTO racikan
          (id, kode, nama, merk, vol, quality, bibit_pct, boost_pct,
           bibit_ml, boost_ml, pel_ml, tanggal, catatan, catatan_merk, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, kode, nama ?? 'Tanpa nama', merk ?? '—',
            vol, quality, bibitPct, boostPct, bibitMl, boostMl, pelMl,
            tanggal, catatan ?? '', catatanMerk ?? '', id)
      .run();

    return json({ ok: true, id });
  }

  // ── DELETE ────────────────────────────────────────────
  if (method === 'DELETE') {
    const kode = url.searchParams.get('kode');
    const id   = url.searchParams.get('id');
    if (!kode || !id) return json({ error: 'kode & id wajib' }, 400);
    if (kode === OWNER_KODE && !isOwner(request, env)) {
      return json({ error: 'Unauthorized — perlu Mode Owner' }, 401);
    }

    const result = await env.DB
      .prepare('DELETE FROM racikan WHERE id = ? AND kode = ?')
      .bind(Number(id), kode)
      .run();

    const deleted = result.meta?.changes ?? 0;
    if (deleted === 0) {
      return json({ ok: false, error: 'Entri tidak ditemukan (id/kode tidak cocok)' }, 404);
    }

    return json({ ok: true, deleted });
  }

  return json({ error: 'Method not allowed' }, 405);
}
