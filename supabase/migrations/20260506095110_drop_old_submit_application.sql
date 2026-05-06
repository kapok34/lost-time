-- Drop the old single-language submit_application function (6th param was TEXT, not TEXT[])
DROP FUNCTION IF EXISTS public.submit_application(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB);