-- Add questionnaire_language column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS questionnaire_language TEXT;