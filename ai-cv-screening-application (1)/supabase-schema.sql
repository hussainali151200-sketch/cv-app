-- ============================================================
-- CV Screening Gateway - Supabase SQL Schema
-- Run this in your Supabase SQL Editor to set up the table
-- ============================================================

-- 1. Create the cv_evaluations table
CREATE TABLE IF NOT EXISTS cv_evaluations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name   TEXT,
  keyword_score INT,
  ai_score    INT,
  final_score FLOAT,
  decision    TEXT,
  ai_reason   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE cv_evaluations ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow inserts from the server only
--    (When using the anon key with RLS, you need a policy that allows inserts.
--     For a server-only flow, you can use a more restrictive policy or
--     use the service_role key on the server side instead.)
CREATE POLICY "Allow server inserts"
  ON cv_evaluations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- 4. (Optional) Only allow admins to SELECT from the table
CREATE POLICY "Allow public read access"
  ON cv_evaluations
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- If you prefer server-only access (recommended for production),
-- use the SUPABASE_SERVICE_ROLE_KEY on the server and remove
-- the anon policies above. Then only the server can read/write.
-- ============================================================

-- 5. (Optional) Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_cv_evaluations_created_at
  ON cv_evaluations (created_at DESC);
