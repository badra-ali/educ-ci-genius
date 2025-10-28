-- Extension pgvector pour embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Table pour les sessions de chat avec le tuteur IA
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode VARCHAR(20) NOT NULL CHECK (mode IN ('conversation', 'explain', 'qcm', 'revise', 'summary', 'plan')),
  subject VARCHAR(50),
  grade VARCHAR(10) CHECK (grade IN ('6e', '5e', '4e', '3e', '2nde', '1ère', 'Tle')),
  title TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les messages du chat
CREATE TABLE IF NOT EXISTS tutor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES tutor_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  language VARCHAR(5) DEFAULT 'fr',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour le tracking de progression des compétences
CREATE TABLE IF NOT EXISTS skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  skill_code VARCHAR(100) NOT NULL,
  mastery_level NUMERIC(3,2) DEFAULT 0.0 CHECK (mastery_level >= 0 AND mastery_level <= 1),
  attempts INT DEFAULT 0,
  last_practiced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject, skill_code)
);

-- Table pour les QCM générés
CREATE TABLE IF NOT EXISTS generated_qcms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES tutor_sessions(id) ON DELETE SET NULL,
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(10),
  theme TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table pour les plans de révision
CREATE TABLE IF NOT EXISTS revision_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(10) NOT NULL,
  target TEXT,
  plan JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed_days INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_session ON tutor_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_skill_progress_user ON skill_progress(user_id, subject);
CREATE INDEX IF NOT EXISTS idx_generated_qcms_user ON generated_qcms(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_revision_plans_user ON revision_plans(user_id, created_at DESC);

-- RLS policies
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_qcms ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_plans ENABLE ROW LEVEL SECURITY;

-- Tutor sessions policies
CREATE POLICY "Users can view own tutor sessions"
  ON tutor_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own tutor sessions"
  ON tutor_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutor sessions"
  ON tutor_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Tutor messages policies
CREATE POLICY "Users can view messages from own sessions"
  ON tutor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own sessions"
  ON tutor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

-- Skill progress policies
CREATE POLICY "Users can view own skill progress"
  ON skill_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skill progress"
  ON skill_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skill progress"
  ON skill_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Generated QCMs policies
CREATE POLICY "Users can view own generated QCMs"
  ON generated_qcms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own generated QCMs"
  ON generated_qcms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Revision plans policies
CREATE POLICY "Users can view own revision plans"
  ON revision_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own revision plans"
  ON revision_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own revision plans"
  ON revision_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at (en utilisant DROP IF EXISTS)
DROP TRIGGER IF EXISTS update_tutor_sessions_updated_at ON tutor_sessions;
CREATE TRIGGER update_tutor_sessions_updated_at
  BEFORE UPDATE ON tutor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_skill_progress_updated_at ON skill_progress;
CREATE TRIGGER update_skill_progress_updated_at
  BEFORE UPDATE ON skill_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_revision_plans_updated_at ON revision_plans;
CREATE TRIGGER update_revision_plans_updated_at
  BEFORE UPDATE ON revision_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();