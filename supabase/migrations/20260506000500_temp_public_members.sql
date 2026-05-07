-- Temporary: allow anyone to read approved member profiles (for preview)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Anon reads approved profiles'
  ) THEN
    CREATE POLICY "Anon reads approved profiles" ON public.profiles
      FOR SELECT TO anon
      USING (status = 'approved');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Authenticated reads approved profiles'
  ) THEN
    CREATE POLICY "Authenticated reads approved profiles" ON public.profiles
      FOR SELECT TO authenticated
      USING (status = 'approved');
  END IF;
END $$;
