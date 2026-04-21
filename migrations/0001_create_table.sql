-- Migration number: 0001 	 2026-04-19T10:14:40.954Z
DROP TABLE IF EXISTS words;
CREATE TABLE words (
  word TEXT PRIMARY KEY,   -- original
  norm TEXT NOT NULL,      -- letters only
  len INTEGER NOT NULL,
  mask INTEGER NOT NULL,
  is_simple INTEGER NOT NULL
);

DROP INDEX IF EXISTS idx_len;
DROP INDEX IF EXISTS idx_norm;
CREATE INDEX idx_len ON words(len);
CREATE INDEX idx_norm ON words(norm);
CREATE INDEX idx_words_is_simple ON words(is_simple);