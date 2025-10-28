-- Align tutor_sessions with edge function expectations
ALTER TABLE public.tutor_sessions
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'conversation',
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Align tutor_messages with edge function expectations
ALTER TABLE public.tutor_messages
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'fr';