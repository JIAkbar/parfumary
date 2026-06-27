-- Parfumary — D1 Schema
-- Jalankan: wrangler d1 execute parfumary-db --file=schema.sql

-- Katalog resep publik (dikelola owner)
CREATE TABLE IF NOT EXISTS katalog (
  id          INTEGER PRIMARY KEY,
  nama        TEXT    NOT NULL DEFAULT 'Tanpa nama',
  merk        TEXT    NOT NULL DEFAULT '—',
  vol         REAL    NOT NULL,
  quality     TEXT    NOT NULL,
  bibit_pct   REAL    NOT NULL,
  boost_pct   REAL    NOT NULL,
  bibit_ml    REAL    NOT NULL,
  boost_ml    REAL    NOT NULL,
  pel_ml      REAL    NOT NULL,
  catatan     TEXT    DEFAULT '',
  created_at  INTEGER NOT NULL
);

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
  created_at  INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_racikan_kode ON racikan(kode, created_at DESC);
