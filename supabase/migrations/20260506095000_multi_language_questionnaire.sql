-- Add language column to questionnaire_answers and support multi-language questionnaires

-- 1. Add lang column to questionnaire_answers
ALTER TABLE public.questionnaire_answers ADD COLUMN lang TEXT NOT NULL DEFAULT 'en';

-- 2. Update existing rows to use the profile's questionnaire_language
UPDATE public.questionnaire_answers qa
SET lang = COALESCE(p.questionnaire_language, 'en')
FROM public.profiles p
WHERE qa.user_id = p.id;

-- 3. Drop old unique constraint and recreate with lang
ALTER TABLE public.questionnaire_answers DROP CONSTRAINT IF EXISTS questionnaire_answers_user_id_question_id_key;
ALTER TABLE public.questionnaire_answers ADD UNIQUE (user_id, question_id, lang);

-- 4. Add questionnaire_languages array to profiles
ALTER TABLE public.profiles ADD COLUMN questionnaire_languages TEXT[] DEFAULT NULL;

-- 5. Migrate existing profiles: populate from old questionnaire_language
UPDATE public.profiles
SET questionnaire_languages = ARRAY[questionnaire_language]
WHERE questionnaire_language IS NOT NULL AND questionnaire_languages IS NULL;

-- 6. Make questionnaire_language nullable (keep for backward compat, but new code uses array)
ALTER TABLE public.profiles ALTER COLUMN questionnaire_language DROP NOT NULL;

-- 7. Update RLS policies for questionnaire_answers to allow reading all languages
DROP POLICY IF EXISTS "Users can read own answers" ON public.questionnaire_answers;
CREATE POLICY "Users can read own answers"
  ON public.questionnaire_answers FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own answers" ON public.questionnaire_answers;
CREATE POLICY "Users can update own answers"
  ON public.questionnaire_answers FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can read all answers" ON public.questionnaire_answers;
CREATE POLICY "Admins can read all answers"
  ON public.questionnaire_answers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
