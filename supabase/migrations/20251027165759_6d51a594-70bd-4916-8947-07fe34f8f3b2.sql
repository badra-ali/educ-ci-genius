-- Create tutor_sessions table for storing conversation sessions
CREATE TABLE IF NOT EXISTS public.tutor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  language TEXT NOT NULL DEFAULT 'fr',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tutor_messages table for storing individual messages
CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  mode TEXT CHECK (mode IN ('explanation', 'qcm', 'revision', 'summary')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tutor_sessions
CREATE POLICY "Users can view their own tutor sessions"
  ON public.tutor_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tutor sessions"
  ON public.tutor_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutor sessions"
  ON public.tutor_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutor sessions"
  ON public.tutor_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for tutor_messages
CREATE POLICY "Users can view messages from their sessions"
  ON public.tutor_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their sessions"
  ON public.tutor_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tutor_sessions
      WHERE tutor_sessions.id = tutor_messages.session_id
      AND tutor_sessions.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_tutor_sessions_user_id ON public.tutor_sessions(user_id);
CREATE INDEX idx_tutor_messages_session_id ON public.tutor_messages(session_id);
CREATE INDEX idx_tutor_messages_created_at ON public.tutor_messages(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_tutor_sessions_updated_at
  BEFORE UPDATE ON public.tutor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();