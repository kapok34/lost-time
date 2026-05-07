-- Add admin INSERT and UPDATE policies for questionnaire_answers

CREATE POLICY "Admins insert any answers"
  ON public.questionnaire_answers FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update any answers"
  ON public.questionnaire_answers FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
