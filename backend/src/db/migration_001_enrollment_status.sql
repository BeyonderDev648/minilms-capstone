-- Migration: enrollment approval workflow
-- Run this once against your EXISTING live database (Neon SQL Editor or psql).
-- Safe to run even if you have existing enrollment rows from earlier testing -
-- they'll be backfilled as 'approved' (since they were created back when
-- enrollment was instant), so nothing you already tested breaks.
--
-- New enrollment requests going forward will start as 'pending' instead -
-- that's enforced in the application code (src/routes/courses.js), not by
-- this column's default, so this single ALTER is all you need.

ALTER TABLE enrollments
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
  CHECK (status IN ('pending', 'approved', 'rejected'));
