/**
 * Parfumary — Cloudflare Pages Function
 * Route: /api/verify-owner
 *
 * POST /api/verify-owner   body: { kode: "xxx" }
 * → { isOwner: true/false }
 *
 * Digunakan frontend untuk cek apakah kode yang dimasukkan adalah kode owner.
 * OWNER_KEY diset sebagai secret di CF Pages dashboard (tidak di-expose ke client).
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

export async function onRequest({ request, env }) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Body tidak valid' }, 400); }

  const { kode } = body;
  const ownerKey = env.OWNER_KEY ?? '';

  // Tidak boleh jika owner key kosong atau kode kosong
  if (!kode || !ownerKey) return json({ isOwner: false });

  return json({ isOwner: kode === ownerKey });
}
