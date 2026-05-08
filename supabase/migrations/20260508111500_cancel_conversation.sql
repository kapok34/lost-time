-- Add RPC to cancel (delete) a conversation before any messages have been sent
CREATE OR REPLACE FUNCTION public.cancel_conversation(_conv_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_conversation_participant(_conv_id, _me) THEN
    RAISE EXCEPTION 'Not a participant';
  END IF;

  -- Ensure no messages exist
  IF EXISTS (
    SELECT 1 FROM public.messages WHERE conversation_id = _conv_id
  ) THEN
    RAISE EXCEPTION 'This correspondence has already begun';
  END IF;

  DELETE FROM public.conversations
  WHERE id = _conv_id AND status = 'active';
END;
$$;
