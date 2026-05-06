-- Create this file and run its contents in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/ujwkmudumhlmgdyqcewj/sql

-- 1. Add member_number column (safe to re-run)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_number INTEGER UNIQUE;

-- 2. Create sequence for member numbers
CREATE SEQUENCE IF NOT EXISTS public.member_number_seq START 1;

-- 3. Temporarily disable RLS for seeding
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers DISABLE ROW LEVEL SECURITY;

-- 4. Seed 2 test members
DO $$
DECLARE
  uid1 UUID := '11111111-1111-1111-1111-111111111111';
  uid2 UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
  -- Create auth users (password: LostTime-2026-Paris! / LostTime-2026-Kyoto!)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, created_at, updated_at)
  VALUES
    (uid1, 'member1@losttime.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', now(), '{"provider":"email","providers":["email"]}', now(), now()),
    (uid2, 'member2@losttime.test', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', now(), '{"provider":"email","providers":["email"]}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Insert approved profiles with member numbers
  INSERT INTO public.profiles (id, display_name, language, location, status, member_number, questionnaire_language, created_at, updated_at)
  VALUES
    (uid1, 'Member One', 'en', 'Paris, France', 'approved', 1, 'en', now(), now()),
    (uid2, 'Member Two', 'fr', 'Kyoto, Japan', 'approved', 2, 'fr', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- English answers (member 1)
  INSERT INTO public.questionnaire_answers (user_id, question_id, answer)
  SELECT uid1, generate_series, 'Sample answer ' || generate_series
  FROM generate_series(1, 34)
  ON CONFLICT DO NOTHING;

  -- French answers (member 2)
  INSERT INTO public.questionnaire_answers (user_id, question_id, answer)
  SELECT uid2, generate_series, 'Réponse exemple ' || generate_series
  FROM generate_series(1, 34)
  ON CONFLICT DO NOTHING;
END $$;

-- 5. Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;

-- 6. Create approve_member RPC (for future use)
CREATE OR REPLACE FUNCTION public.approve_member(_member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_num INTEGER;
BEGIN
  SELECT nextval('public.member_number_seq') INTO _next_num;
  UPDATE public.profiles
  SET status = 'approved', member_number = _next_num
  WHERE id = _member_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found or not pending';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_member(UUID) TO anon;
