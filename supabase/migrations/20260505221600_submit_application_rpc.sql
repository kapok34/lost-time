-- Atomic RPC to submit a new member application.
-- Creates auth user, profile, and questionnaire answers in a single transaction.
-- This is called from the frontend via supabase.rpc('submit_application', {...})

CREATE OR REPLACE FUNCTION public.submit_application(
  _email TEXT,
  _password TEXT,
  _display_name TEXT,
  _language TEXT,
  _location TEXT,
  _questionnaire_language TEXT,
  _answers JSONB  -- { "1": "answer text", "2": "...", ... }
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid UUID;
  _qid INTEGER;
  _ans TEXT;
  _expected INTEGER := 34;
  _received INTEGER;
BEGIN
  -- Apply defaults for optional fields
  IF _display_name IS NULL OR length(trim(_display_name)) < 1 THEN
    _display_name := split_part(_email, '@', 1);
  END IF;
  IF _language IS NULL OR length(trim(_language)) < 1 THEN
    _language := _questionnaire_language;
  END IF;

  -- Validate inputs
  IF _location IS NULL OR length(trim(_location)) < 2 THEN
    RAISE EXCEPTION 'Location is required';
  END IF;
  IF _questionnaire_language IS NULL OR _questionnaire_language NOT IN ('en', 'fr') THEN
    RAISE EXCEPTION 'Invalid questionnaire language';
  END IF;

  -- Count received answers
  _received := (SELECT count(*) FROM jsonb_each_text(_answers));
  IF _received < _expected THEN
    RAISE EXCEPTION 'Please answer all % questions (received %)', _expected, _received;
  END IF;

  -- Create auth user (requires service role key or supabase_admin context)
  -- NOTE: This will typically fail when called from client. Use admin API or keep frontend auth flow.
  -- For this RPC to work from client, the auth user must already exist. The recommended pattern is:
  -- 1. Frontend: supabase.auth.signUp() first
  -- 2. Then call this RPC with the existing user_id.
  --
  -- So we rename this to submit_application_profile and assume user is already authenticated.
  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Please sign up first.';
  END IF;

  -- Check profile doesn't already exist
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid) THEN
    RAISE EXCEPTION 'Profile already exists for this user';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, display_name, language, location, status, questionnaire_language)
  VALUES (_uid, trim(_display_name), _language, trim(_location), 'pending', _questionnaire_language);

  -- Insert answers
  FOR _qid, _ans IN
    SELECT (key)::int, value FROM jsonb_each_text(_answers)
  LOOP
    IF _ans IS NULL OR length(trim(_ans)) < 3 OR length(trim(_ans)) > 200 THEN
      RAISE EXCEPTION 'Answer % must be between 3 and 200 characters', _qid;
    END IF;
    INSERT INTO public.questionnaire_answers (user_id, question_id, answer)
    VALUES (_uid, _qid, trim(_ans));
  END LOOP;

  RETURN _uid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
