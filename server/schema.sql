-- ============================================================
--  CARECAY ERP — MySQL Schema
--  Run from command line:
--     mysql -u root -p < server/schema.sql
--  Generic document store: every business record is stored as
--  JSON, so new fields never require a migration.
-- ============================================================

CREATE DATABASE IF NOT EXISTS carecay_crm
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE carecay_crm;

-- ----------------------------------------------------------------
-- 1. RECORDS — one row per business record across ALL modules.
--    `collection` = pur_inq | val | pfu | pcl | ob | sal_inq |
--                   sfu | scl | sob | stk | ws | pay | del |
--                   doc | cust | dn | gp | sp | td | fin |
--                   exp_rec | gst_inv | targets | tasks |
--                   feedback | users | settings | notifications
--    `rec_id`     = the human readable id (e.g. SOB-2026-0001)
--    `data`       = full JSON of the record (all fields preserved)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS records (
  pk          BIGINT AUTO_INCREMENT PRIMARY KEY,
  collection  VARCHAR(32)  NOT NULL,
  rec_id      VARCHAR(64)  NOT NULL,
  data        JSON         NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_coll_recid (collection, rec_id),
  KEY idx_collection (collection)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 2. COUNTERS — per-module running number for legacy ID generation.
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS counters (
  name   VARCHAR(32) PRIMARY KEY,
  value  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 3. NOTIFICATIONS — persisted notification feed (legacy table;
--    the live app stores notifications generically via `records`
--    with collection='notifications' instead, kept here for
--    compatibility with older tooling).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  payload     JSON      NOT NULL,
  is_read     TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 4. USERS — auth table. `uid` links to the profile document
--    stored in `records` (collection='users', rec_id=uid).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(64) UNIQUE NOT NULL,
  pw_hash    VARCHAR(255) NOT NULL,
  role       VARCHAR(32)  NOT NULL DEFAULT 'Admin',
  uid        VARCHAR(64)  UNIQUE,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 5. MEDIA — sub-collection documents (photos/files attached to a
--    parent record, e.g. valuation photos, stock images).
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id                VARCHAR(64) PRIMARY KEY,
  parent_collection VARCHAR(32) NOT NULL,
  parent_id         VARCHAR(64) NOT NULL,
  sub_collection    VARCHAR(32) NOT NULL DEFAULT 'media',
  data              JSON NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY idx_parent (parent_collection, parent_id, sub_collection)
) ENGINE=InnoDB;
