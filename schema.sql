-- Parfumary — D1 Schema
-- Jalankan: wrangler d1 execute parfumary-db --file=schema.sql

-- Resep personal per kode akun (lintas device)
CREATE TABLE IF NOT EXISTS racikan (
  id          INTEGER PRIMARY KEY,          -- timestamp ms
  kode        TEXT    NOT NULL,             -- kode akun user (bebas)
  nama        TEXT    NOT NULL DEFAULT 'Tanpa nama',
  merk        TEXT    NOT NULL DEFAULT '—',
  vol         REAL    NOT NULL,
  quality     TEXT    NOT NULL,
  bibit_pct   REAL    NOT NULL,
  boost_pct   REAL    NOT NULL,
  bibit_ml    REAL    NOT NULL,
  boost_ml    REAL    NOT NULL,
  pel_ml      REAL    NOT NULL,
  tanggal     TEXT    NOT NULL,
  catatan     TEXT    DEFAULT '',
  catatan_merk TEXT   DEFAULT '',
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_racikan_kode ON racikan(kode, created_at DESC);

-- Migrasi: fitur Katalog dihapus (redundan dengan akses viewer via kode akun).
-- Jalankan manual sekali ke D1 remote untuk buang tabel lama:
-- wrangler d1 execute parfumary-db --remote --command="DROP TABLE IF EXISTS katalog"
