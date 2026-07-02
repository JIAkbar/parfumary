/**
 * Parfumary — Cloudflare Pages Function
 * Route: /api/verify-owner
 *
 * POST /api/verify-owner   body: { ownerPassword: "xxx" }
 * → { isOwner: true/false }
 *
 * Password Owner TERPISAH dari kode akun — supaya kode akun ("JIA99") bisa
 * dibagikan bebas untuk lihat racikan (read-only), tanpa membuka akses
 * tulis/hapus. OWNER_KEY diset sebagai secret di CF Pages dashboard (tidak
 * di-expose ke client), nilainya harus BEDA dari kode akun manapun.
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

  const { ownerPassword } = body;
  const ownerKey = env.OWNER_KEY ?? '';

  // Tidak boleh jika owner key kosong atau password kosong
  if (!ownerPassword || !ownerKey) return json({ isOwner: false });

  return json({ isOwner: ownerPassword === ownerKey });
}
