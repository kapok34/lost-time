-- =========================================
-- NEW TABLE BOILERPLATE
-- Copy this when creating a new table.
-- REQUIRED: explicit GRANTs for Data API access
-- (Supabase no longer auto-exposes public schema tables)
-- =========================================

-- CREATE TABLE public.my_new_table (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
-- );

-- -- 1. Enable RLS
-- ALTER TABLE public.my_new_table ENABLE ROW LEVEL SECURITY;

-- -- 2. Explicit grants (required as of Oct 30, 2026)
-- grant select, insert, update, delete on public.my_new_table to authenticated;
-- grant all on public.my_new_table to service_role;
-- grant select on public.my_new_table to anon;   -- only if needed

-- -- 3. Create policies
-- CREATE POLICY "Users manage own rows" ON public.my_new_table
--   FOR ALL TO authenticated
--   USING (user_id = auth.uid())
--   WITH CHECK (user_id = auth.uid());

-- -- 4. If the table has a sequence
-- grant usage, select on sequence public.my_new_table_id_seq to service_role;
