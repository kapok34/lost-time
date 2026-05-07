-- Add admin DELETE policy for questionnaire_answers

CREATE POLICY "Admins delete any answers"
  ON public.questionnaire_answers FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
