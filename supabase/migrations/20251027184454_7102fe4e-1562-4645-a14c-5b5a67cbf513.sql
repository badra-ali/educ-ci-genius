-- Ajouter des colonnes manquantes et améliorer les tables existantes

-- Améliorer la table grades (déjà existe mais vérifier colonnes)
ALTER TABLE grades ADD COLUMN IF NOT EXISTS validated BOOLEAN DEFAULT false;
ALTER TABLE grades ADD COLUMN IF NOT EXISTS comment TEXT;

-- Améliorer la table attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS decision TEXT DEFAULT 'EN_ATTENTE' CHECK (decision IN ('EN_ATTENTE', 'VALIDE', 'REFUSE'));
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id);

-- Améliorer la table messages pour les read receipts
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';

-- Améliorer la table rendus_devoir pour le workflow de correction
ALTER TABLE rendus_devoir ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP WITH TIME ZONE;

-- Table pour les analytics enseignant
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  props JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_grades_teacher ON grades(teacher_id, matiere_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date, etablissement_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rendus_statut ON rendus_devoir(statut, devoir_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id, created_at DESC);

-- RLS pour analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own analytics events"
ON analytics_events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics"
ON analytics_events
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE') OR 
  has_role(auth.uid(), 'ADMIN_SYSTEME')
);

-- Améliorer les policies existantes pour les enseignants

-- Policy pour que les enseignants puissent valider les notes
CREATE POLICY "Teachers can validate their own grades"
ON grades
FOR UPDATE
TO authenticated
USING (auth.uid() = teacher_id)
WITH CHECK (auth.uid() = teacher_id);

-- Policy pour les read receipts des messages
CREATE POLICY "Participants can update read status"
ON messages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM threads
    WHERE threads.id = messages.thread_id
    AND auth.uid() = ANY(threads.participants)
  )
);

-- Fonction pour calculer la moyenne de classe
CREATE OR REPLACE FUNCTION calculate_class_average(
  p_classe_id UUID,
  p_matiere_id UUID,
  p_period TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  v_average NUMERIC;
BEGIN
  SELECT AVG(g.score)
  INTO v_average
  FROM grades g
  INNER JOIN eleve_classes ec ON ec.user_id = g.student_id
  WHERE ec.classe_id = p_classe_id
    AND g.matiere_id = p_matiere_id
    AND g.period = p_period
    AND g.validated = true;
  
  RETURN COALESCE(v_average, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les classes d'un enseignant
CREATE OR REPLACE FUNCTION get_teacher_classes(p_teacher_id UUID)
RETURNS TABLE(
  classe_id UUID,
  classe_nom TEXT,
  matiere_id UUID,
  matiere_nom TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as classe_id,
    c.nom as classe_nom,
    m.id as matiere_id,
    m.nom as matiere_nom
  FROM enseignant_matieres em
  INNER JOIN classes c ON c.id = em.classe_id
  INNER JOIN matieres m ON m.id = em.matiere_id
  WHERE em.user_id = p_teacher_id
    AND em.annee_scolaire = '2024-2025'
    AND c.actif = true
    AND m.actif = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;