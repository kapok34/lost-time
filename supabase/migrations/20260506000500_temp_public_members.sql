-- Temporary: allow anyone to read approved member profiles (for preview)
CREATE POLICY IF NOT EXISTS "Anon reads approved profiles" ON public.profiles
  FOR SELECT TO anon
  USING (status = 'approved');

CREATE POLICY IF NOT EXISTS "Anon reads approved profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (status = 'approved');
