-- =========================================
-- EXPLICIT TABLE GRANTS
-- =========================================
-- Supabase is changing default Data API access for public schema tables.
-- New projects after May 30, and all existing projects after Oct 30,
-- will require explicit GRANTs before PostgREST / supabase-js can access tables.
-- This migration makes all existing table grants explicit so the project
-- works on fresh Supabase instances and after the deadline.
-- RLS policies remain the actual security layer.

-- =========================================
-- PROFILES
-- =========================================
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.profiles to anon;

-- =========================================
-- USER ROLES
-- =========================================
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

-- =========================================
-- QUESTIONNAIRE ANSWERS
-- =========================================
grant select, insert, update, delete on public.questionnaire_answers to authenticated;
grant all on public.questionnaire_answers to service_role;

-- =========================================
-- CONVERSATIONS
-- =========================================
grant select on public.conversations to authenticated;
grant all on public.conversations to service_role;

-- =========================================
-- MESSAGES
-- =========================================
grant select, insert, update on public.messages to authenticated;
grant all on public.messages to service_role;

-- =========================================
-- REPORTS
-- =========================================
grant select, insert on public.reports to authenticated;
grant all on public.reports to service_role;

-- =========================================
-- INTERNAL CONFIG (service_role only)
-- =========================================
grant all on public._internal_config to service_role;

-- =========================================
-- SEQUENCES
-- =========================================
grant usage, select on sequence public.member_number_seq to service_role;
