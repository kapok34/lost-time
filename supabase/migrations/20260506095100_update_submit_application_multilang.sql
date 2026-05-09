-- Updated submit_application RPC to support multi-language answers.
-- _answers format: { "en": { "1": "...", "2": "..." }, "fr": { "1": "...", ... } }

CREATE OR REPLACE FUNCTION public.submit_application(
  _email TEXT,
  _password TEXT,
  _display_name TEXT,
  _language TEXT,
  _location TEXT,
  _questionnaire_languages TEXT[],
  _answers JSONB  -- keyed by language, then by question id
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
  _lang TEXT;
  _lang_count INTEGER;
BEGIN
  -- Apply defaults for optional fields
  IF _display_name IS NULL OR length(trim(_display_name)) < 1 THEN
    _display_name := split_part(_email, '@', 1);
  END IF;
  IF _language IS NULL OR length(trim(_language)) < 1 THEN
    _language := COALESCE(_questionnaire_languages[1], 'en');
  END IF;

  -- Validate inputs
  IF _location IS NULL OR length(trim(_location)) < 2 THEN
    RAISE EXCEPTION 'Location is required';
  END IF;
  IF _questionnaire_languages IS NULL OR array_length(_questionnaire_languages, 1) IS NULL THEN
    RAISE EXCEPTION 'At least one questionnaire language is required';
  END IF;
  -- Validate each language set has all answers
  FOREACH _lang IN ARRAY _questionnaire_languages
  LOOP
    IF _lang NOT IN ('en', 'fr', 'it') THEN
      RAISE EXCEPTION 'Invalid questionnaire language: %', _lang;
    END IF;

    _lang_count := (SELECT count(*) FROM jsonb_each_text(_answers -> _lang));
    IF _lang_count < _expected THEN
      RAISE EXCEPTION 'Language % is missing answers (% / %)', _lang, _lang_count, _expected;
    END IF;
  END LOOP;

  _uid := auth.uid();
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated. Please sign up first.';
  END IF;

  -- Check profile doesn't already exist
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = _uid) THEN
    RAISE EXCEPTION 'Profile already exists for this user';
  END IF;

  -- Insert profile with questionnaire_languages array
  INSERT INTO public.profiles (
    id, display_name, language, location, status,
    questionnaire_language, questionnaire_languages
  )
  VALUES (
    _uid, trim(_display_name), _language, trim(_location), 'pending',
    _questionnaire_languages[1], _questionnaire_languages
  );

  -- Insert answers for each language
  FOREACH _lang IN ARRAY _questionnaire_languages
  LOOP
    FOR _qid, _ans IN
      SELECT (key)::int, value FROM jsonb_each_text(_answers -> _lang)
    LOOP
      IF _ans IS NULL OR length(trim(_ans)) < 3 OR length(trim(_ans)) > 200 THEN
        RAISE EXCEPTION 'Answer % in language % must be between 3 and 200 characters', _qid, _lang;
      END IF;
      INSERT INTO public.questionnaire_answers (user_id, question_id, answer, lang)
      VALUES (_uid, _qid, trim(_ans), _lang);
    END LOOP;
  END LOOP;

  RETURN _uid;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.submit_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], JSONB) TO authenticated;
