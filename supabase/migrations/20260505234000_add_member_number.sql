-- Add member_number to profiles
ALTER TABLE public.profiles ADD COLUMN member_number INTEGER UNIQUE;

-- Create sequence for member numbers starting at 1
CREATE SEQUENCE public.member_number_seq START 1;

-- Function to approve a member and assign next member_number atomically
CREATE OR REPLACE FUNCTION public.approve_member(_member_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _next_num INTEGER;
BEGIN
  SELECT nextval('public.member_number_seq') INTO _next_num;

  UPDATE public.profiles
  SET status = 'approved', member_number = _next_num
  WHERE id = _member_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Member not found or not pending';
  END IF;
END;
$$;

-- Grant execute to authenticated users (admin check is done in RLS or frontend)
GRANT EXECUTE ON FUNCTION public.approve_member(UUID) TO authenticated;

-- TEMPORARY: allow anon to call approve_member for local seeding
GRANT EXECUTE ON FUNCTION public.approve_member(UUID) TO anon;
