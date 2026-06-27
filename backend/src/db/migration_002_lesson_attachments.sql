-- Migration: lesson attachments (link-based - YouTube/image/file URLs)
-- Run this once against your EXISTING live database (Neon SQL Editor or psql).
-- Safe to run any time - existing lessons simply get a NULL attachment_url,
-- which the frontend already treats as "no attachment" and renders nothing extra.

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS attachment_url TEXT;
