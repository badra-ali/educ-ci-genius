-- Create badges definition table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('academic', 'attendance', 'social', 'special')),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user XP table
CREATE TABLE public.user_xp (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user badges junction table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create XP history for tracking
CREATE TABLE public.xp_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Badges are viewable by all authenticated users
CREATE POLICY "Badges viewable by all" ON public.badges FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can view their own XP
CREATE POLICY "Users can view own XP" ON public.user_xp FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own XP" ON public.user_xp FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own XP" ON public.user_xp FOR UPDATE USING (auth.uid() = user_id);

-- Users can view all XP for leaderboard
CREATE POLICY "All users can view XP for leaderboard" ON public.user_xp FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can view their own badges
CREATE POLICY "Users can view own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- Users can view all badges for leaderboard
CREATE POLICY "All users can view badges" ON public.user_badges FOR SELECT USING (auth.uid() IS NOT NULL);

-- XP history policies
CREATE POLICY "Users can view own XP history" ON public.xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert XP history" ON public.xp_history FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_user_xp_total ON public.user_xp(total_xp DESC);
CREATE INDEX idx_user_xp_user ON public.user_xp(user_id);
CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);
CREATE INDEX idx_xp_history_user ON public.xp_history(user_id);

-- Insert default badges
INSERT INTO public.badges (code, name, description, icon, category, xp_reward, requirement_type, requirement_value) VALUES
  ('first_login', 'Premier Pas', 'Première connexion à la plateforme', '🎯', 'special', 50, 'login_count', 1),
  ('week_streak', 'Assidu', '7 jours de connexion consécutifs', '🔥', 'attendance', 100, 'streak_days', 7),
  ('month_streak', 'Déterminé', '30 jours de connexion consécutifs', '💪', 'attendance', 500, 'streak_days', 30),
  ('first_qcm', 'Testeur', 'Premier QCM complété', '📝', 'academic', 50, 'qcm_completed', 1),
  ('qcm_master', 'Maître QCM', '10 QCM complétés', '🏆', 'academic', 200, 'qcm_completed', 10),
  ('perfect_score', 'Perfection', 'Score parfait sur un QCM', '⭐', 'academic', 150, 'perfect_qcm', 1),
  ('bookworm', 'Lecteur', '5 ressources consultées', '📚', 'academic', 100, 'resources_read', 5),
  ('scholar', 'Érudit', '20 ressources consultées', '🎓', 'academic', 300, 'resources_read', 20),
  ('high_grade', 'Excellence', 'Moyenne supérieure à 16/20', '🌟', 'academic', 250, 'average_grade', 16),
  ('attendance_95', 'Exemplaire', 'Taux de présence supérieur à 95%', '✅', 'attendance', 200, 'attendance_rate', 95),
  ('first_message', 'Communicant', 'Premier message envoyé', '💬', 'social', 50, 'messages_sent', 1),
  ('helper', 'Entraide', '10 messages envoyés', '🤝', 'social', 150, 'messages_sent', 10),
  ('tutor_user', 'Curieux', 'Première utilisation du tuteur IA', '🤖', 'special', 75, 'tutor_sessions', 1),
  ('tutor_fan', 'Passionné IA', '10 sessions avec le tuteur IA', '🧠', 'special', 250, 'tutor_sessions', 10),
  ('level_5', 'Apprenti', 'Atteindre le niveau 5', '🥉', 'special', 100, 'level', 5),
  ('level_10', 'Confirmé', 'Atteindre le niveau 10', '🥈', 'special', 250, 'level', 10),
  ('level_20', 'Expert', 'Atteindre le niveau 20', '🥇', 'special', 500, 'level', 20);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  RETURN GREATEST(1, FLOOR(SQRT(xp::NUMERIC / 100)) + 1)::INTEGER;
END;
$$;

-- Function to get XP needed for next level
CREATE OR REPLACE FUNCTION public.xp_for_level(lvl INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Inverse of level formula
  RETURN ((lvl - 1) * (lvl - 1) * 100)::INTEGER;
END;
$$;