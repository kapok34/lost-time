-- Create table for pending questionnaire edits awaiting admin approval
CREATE TABLE IF NOT EXISTS pending_questionnaire_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lang text NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  original_answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

-- Add index for efficient lookups
CREATE INDEX idx_pending_edits_user_id ON pending_questionnaire_edits(user_id);
CREATE INDEX idx_pending_edits_status ON pending_questionnaire_edits(status);

-- Row Level Security
ALTER TABLE pending_questionnaire_edits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pending edits
CREATE POLICY "Users can view own edits" ON pending_questionnaire_edits
  FOR SELECT USING (auth.uid() = user_id);

-- Only the user can insert their own edits
CREATE POLICY "Users can insert own edits" ON pending_questionnaire_edits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update (approve/reject) edits
CREATE POLICY "Admins can update edits" ON pending_questionnaire_edits
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admins can view all pending edits
CREATE POLICY "Admins can view all edits" ON pending_questionnaire_edits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR auth.uid() = user_id
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON pending_questionnaire_edits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON pending_questionnaire_edits TO authenticated;
