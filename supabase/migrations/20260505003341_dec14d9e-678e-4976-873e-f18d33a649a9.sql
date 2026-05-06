CREATE OR REPLACE FUNCTION public.get_member_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total', (SELECT count(*) FROM public.profiles WHERE status = 'approved'),
    'by_language', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('language', language, 'count', c) ORDER BY c DESC, language ASC)
      FROM (
        SELECT language, count(*)::int AS c
        FROM public.profiles
        WHERE status = 'approved'
        GROUP BY language
      ) t
    ), '[]'::jsonb),
    'by_location', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('location', location, 'count', c) ORDER BY c DESC, location ASC)
      FROM (
        SELECT location, count(*)::int AS c
        FROM public.profiles
        WHERE status = 'approved'
        GROUP BY location
      ) t
    ), '[]'::jsonb)
  )
$$;

GRANT EXECUTE ON FUNCTION public.get_member_stats() TO anon, authenticated;