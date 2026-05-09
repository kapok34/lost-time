-- Drop the broken trigger that tries to insert into non-existent public.members
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the broken function
DROP FUNCTION IF EXISTS public.handle_new_user();
