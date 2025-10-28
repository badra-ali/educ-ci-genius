-- Add grade column to tutor_sessions
ALTER TABLE public.tutor_sessions
ADD COLUMN grade TEXT;