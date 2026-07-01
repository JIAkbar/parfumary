/**
 * Parfumary — Cloudflare Pages Function
 * Route: /api/katalog
 *
 * GET    /api/katalog          → ambil semua resep katalog (publik, tanpa auth)
 * POST   /api/katalog          → tambah resep (owner only)
 * DELETE /api/katalog?id=xxx   → hapus resep (owner only)
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Owner-Key',
  'Content-Type': 'application/json',
};

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
    catatan:  r.catatan ?? '',
    catatanMerk: r.catatan_merk ?? '',
  };
}

function isOwner(request, env) {
  const key = request.headers.get('X-Owner-Key') ?? '';
  return key === (env.OWNER_KEY ?? '');
}

export async function onRequest({ request, env }) {
  const method = request.method;

  if (method === 'OPTIONS') return new Response(null, { headers: CORS });

  // ── GET (publik) ──────────────────────────────────────
  if (method === 'GET') {
    const { results } = await env.DB
      .prepare('SELECT * FROM katalog ORDER BY created_at DESC')
      .all();
    return json(results.map(normalizeRow));
  }

  // ── POST (owner only) ─────────────────────────────────
  if (method === 'POST') {
    if (!isOwner(request, env)) return json({ error: 'Unauthorized' }, 401);

    let body;
    try { body = await request.json(); }
    catch { return json({ error: 'Body JSON tidak valid' }, 400); }

    const { id, nama, merk, vol, quality,
            bibitPct, boostPct, bibitMl, boostMl, pelMl, catatan, catatanMerk } = body;

    if (!id) return json({ error: 'id wajib' }, 400);

    await env.DB
      .prepare(`
        INSERT OR REPLACE INTO katalog
          (id, nama, merk, vol, quality, bibit_pct, boost_pct,
           bibit_ml, boost_ml, pel_ml, catatan, catatan_merk, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(id, nama ?? 'Tanpa nama', merk ?? '—',
            vol, quality, bibitPct, boostPct, bibitMl, boostMl, pelMl,
            catatan ?? '', catatanMerk ?? '', id)
      .run();

    return json({ ok: true, id });
  }

  // ── DELETE (owner only) ───────────────────────────────
  if (method === 'DELETE') {
    if (!isOwner(request, env)) return json({ error: 'Unauthorized' }, 401);

    const url = new URL(request.url);
    const id  = url.searchParams.get('id');
    if (!id) return json({ error: 'id wajib' }, 400);

    const result = await env.DB
      .prepare('DELETE FROM katalog WHERE id = ?')
      .bind(Number(id))
      .run();

    const deleted = result.meta?.changes ?? 0;
    if (deleted === 0) {
      return json({ ok: false, error: 'Entri tidak ditemukan' }, 404);
    }

    return json({ ok: true, deleted });
  }

  return json({ error: 'Method not allowed' }, 405);
}
