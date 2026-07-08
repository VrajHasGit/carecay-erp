USE carecay_crm;

CREATE TABLE IF NOT EXISTS media (
  id                VARCHAR(64) PRIMARY KEY,
  parent_collection VARCHAR(32) NOT NULL,
  parent_id         VARCHAR(64) NOT NULL,
  sub_collection    VARCHAR(32) NOT NULL DEFAULT 'media',
  data              JSON NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_parent (parent_collection, parent_id, sub_collection)
) ENGINE=InnoDB;

ALTER TABLE users ADD COLUMN IF NOT EXISTS uid VARCHAR(64) UNIQUE;
