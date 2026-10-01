-- Bảng bài viết tạo từ web (hybrid: bài static vẫn nằm trong manifest, bài này nằm ở D1).
-- Áp dụng: npm run db:migrate  (wrangler d1 execute ... --remote --file schema.sql)
CREATE TABLE IF NOT EXISTS articles (
  id         TEXT PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  title      TEXT NOT NULL,
  domain     TEXT NOT NULL,            -- id domain trong taxonomy (vd 'giai-phau')
  category   TEXT NOT NULL,            -- id category/bucket (vd 'suc-khoe')
  tags       TEXT NOT NULL DEFAULT '[]', -- JSON array
  level      TEXT NOT NULL DEFAULT 'beginner', -- beginner | intermediate | advanced
  content    TEXT NOT NULL DEFAULT '', -- Markdown thô
  status     TEXT NOT NULL DEFAULT 'draft', -- draft | published
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_domain ON articles(domain);

-- Rate limit cho endpoint tốn phí (classify): mỗi bucket (IP) 1 cửa sổ thời gian.
CREATE TABLE IF NOT EXISTS rate_limit (
  bucket  TEXT PRIMARY KEY,
  count   INTEGER NOT NULL,
  resetAt INTEGER NOT NULL
);
