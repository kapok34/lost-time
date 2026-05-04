
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.profile_status AS ENUM ('pending', 'approved', 'suspended', 'rejected');
CREATE TYPE public.conversation_status AS ENUM ('active', 'archived');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  language TEXT NOT NULL,
  location TEXT NOT NULL,
  status public.profile_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to check approved status without recursion
CREATE OR REPLACE FUNCTION public.is_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND status = 'approved'
  )
$$;

-- =========================================
-- QUESTIONNAIRE ANSWERS
-- =========================================
CREATE TABLE public.questionnaire_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);

ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;

-- =========================================
-- CONVERSATIONS
-- =========================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_a UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_b UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.conversation_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  CHECK (member_a <> member_b)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Enforce one active conversation per member
CREATE UNIQUE INDEX uniq_active_conv_member_a
  ON public.conversations (member_a)
  WHERE status = 'active';

CREATE UNIQUE INDEX uniq_active_conv_member_b
  ON public.conversations (member_b)
  WHERE status = 'active';

-- Helper: does user have an active conversation
CREATE OR REPLACE FUNCTION public.has_active_conversation(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE status = 'active' AND (member_a = _user_id OR member_b = _user_id)
  )
$$;

-- Helper: is user a participant of a conversation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conv_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conv_id AND (member_a = _user_id OR member_b = _user_id)
  )
$$;

-- RPC to start a conversation (enforces one-active rule)
CREATE OR REPLACE FUNCTION public.start_conversation(_other_user UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _me UUID := auth.uid();
  _conv_id UUID;
  _a UUID;
  _b UUID;
BEGIN
  IF _me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _me = _other_user THEN
    RAISE EXCEPTION 'Cannot message yourself';
  END IF;
  IF NOT public.is_approved(_me) THEN
    RAISE EXCEPTION 'You must be an approved member';
  END IF;
  IF NOT public.is_approved(_other_user) THEN
    RAISE EXCEPTION 'The other member is not available';
  END IF;
  IF public.has_active_conversation(_me) THEN
    RAISE EXCEPTION 'You already have an active conversation. End it first.';
  END IF;
  IF public.has_active_conversation(_other_user) THEN
    RAISE EXCEPTION 'That member already has an active conversation';
  END IF;

  -- Order so pair is canonical
  IF _me < _other_user THEN
    _a := _me; _b := _other_user;
  ELSE
    _a := _other_user; _b := _me;
  END IF;

  INSERT INTO public.conversations (member_a, member_b, status)
  VALUES (_a, _b, 'active')
  RETURNING id INTO _conv_id;

  RETURN _conv_id;
END;
$$;

-- RPC to archive (end) a conversation
CREATE OR REPLACE FUNCTION public.archive_conversation(_conv_id UUID)
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

  UPDATE public.conversations
  SET status = 'archived', archived_at = now()
  WHERE id = _conv_id AND status = 'active';
END;
$$;

-- =========================================
-- MESSAGES
-- =========================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(body) > 0 AND length(body) <= 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

-- =========================================
-- REPORTS
-- =========================================
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- =========================================
-- RLS POLICIES
-- =========================================

-- profiles
CREATE POLICY "Users see own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Approved see other approved profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (status = 'approved' AND public.is_approved(auth.uid()));

CREATE POLICY "Admins see all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND status = 'pending');

CREATE POLICY "Users update own profile (no status)" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles (admin-only)
CREATE POLICY "Admins read roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- questionnaire_answers
CREATE POLICY "Users read own answers" ON public.questionnaire_answers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Approved read approved answers" ON public.questionnaire_answers
  FOR SELECT TO authenticated
  USING (public.is_approved(auth.uid()) AND public.is_approved(user_id));

CREATE POLICY "Admins read all answers" ON public.questionnaire_answers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert own answers" ON public.questionnaire_answers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own answers" ON public.questionnaire_answers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own answers" ON public.questionnaire_answers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- conversations
CREATE POLICY "Participants read conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (member_a = auth.uid() OR member_b = auth.uid());

CREATE POLICY "Admins read conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No direct INSERT/UPDATE on conversations: use RPCs (start_conversation/archive_conversation)

-- messages
CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Admins read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Participants send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.status = 'active'
    )
  );

CREATE POLICY "Participants mark read" ON public.messages
  FOR UPDATE TO authenticated
  USING (public.is_conversation_participant(conversation_id, auth.uid()))
  WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()));

-- reports
CREATE POLICY "Members create reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins read reports" ON public.reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- TRIGGERS
-- =========================================

-- updated_at on profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_answers_updated_at
  BEFORE UPDATE ON public.questionnaire_answers
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================
-- REALTIME
-- =========================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
