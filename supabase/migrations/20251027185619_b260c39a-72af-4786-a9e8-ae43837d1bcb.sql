-- Améliorer les RLS policies pour les parents

-- Policy pour parent_eleves : parents peuvent voir leurs liens
CREATE POLICY "Parents peuvent voir leurs liens avec élèves"
ON parent_eleves
FOR SELECT
TO authenticated
USING (auth.uid() = parent_id);

-- Fonction helper pour vérifier si un élève appartient à un parent
CREATE OR REPLACE FUNCTION is_parent_of_student(p_parent_id UUID, p_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM parent_eleves 
    WHERE parent_id = p_parent_id 
      AND eleve_id = p_student_id
  );
$$;

-- Policy pour schedule : parents peuvent voir l'emploi du temps de la classe de leur enfant
CREATE POLICY "Parents peuvent voir emploi du temps classe enfant"
ON schedule
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM parent_eleves pe
    INNER JOIN eleve_classes ec ON ec.user_id = pe.eleve_id
    WHERE pe.parent_id = auth.uid()
      AND ec.classe_id = schedule.classe_id
      AND ec.actif = true
  )
);

-- Policy pour grades : parents peuvent voir les notes de leurs enfants
CREATE POLICY "Parents peuvent voir notes de leurs enfants"
ON grades
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM parent_eleves pe
    WHERE pe.parent_id = auth.uid()
      AND pe.eleve_id = grades.student_id
  )
);

-- Policy pour report_cards : parents peuvent voir bulletins de leurs enfants
CREATE POLICY "Parents peuvent voir bulletins de leurs enfants"
ON report_cards
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM parent_eleves pe
    WHERE pe.parent_id = auth.uid()
      AND pe.eleve_id = report_cards.student_id
  )
);

-- Policy pour eleve_classes : parents peuvent voir les classes de leurs enfants
CREATE POLICY "Parents peuvent voir classes de leurs enfants"
ON eleve_classes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM parent_eleves pe
    WHERE pe.parent_id = auth.uid()
      AND pe.eleve_id = eleve_classes.user_id
  )
);

-- Index pour optimiser les requêtes parent
CREATE INDEX IF NOT EXISTS idx_parent_eleves_parent ON parent_eleves(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_eleves_eleve ON parent_eleves(eleve_id);

-- Fonction pour obtenir les enfants d'un parent avec infos classe
CREATE OR REPLACE FUNCTION get_parent_children(p_parent_id UUID)
RETURNS TABLE(
  eleve_id UUID,
  first_name TEXT,
  last_name TEXT,
  classe_id UUID,
  classe_nom TEXT,
  relation TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pe.eleve_id,
    p.first_name,
    p.last_name,
    c.id as classe_id,
    c.nom as classe_nom,
    pe.lien_parente as relation
  FROM parent_eleves pe
  INNER JOIN profiles p ON p.id = pe.eleve_id
  INNER JOIN eleve_classes ec ON ec.user_id = pe.eleve_id
  INNER JOIN classes c ON c.id = ec.classe_id
  WHERE pe.parent_id = p_parent_id
    AND ec.actif = true;
$$;

-- Fonction pour calculer le taux d'assiduité d'un élève
CREATE OR REPLACE FUNCTION calculate_attendance_rate(
  p_student_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 100.0
      ELSE ROUND(
        (COUNT(*) FILTER (WHERE status = 'PRESENT')::NUMERIC / COUNT(*)::NUMERIC) * 100,
        2
      )
    END
  FROM attendance
  WHERE student_id = p_student_id
    AND date BETWEEN p_start_date AND p_end_date;
$$;

-- Fonction pour obtenir la moyenne générale d'un élève
CREATE OR REPLACE FUNCTION get_student_average(
  p_student_id UUID,
  p_period TEXT
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN SUM(coefficient) = 0 THEN NULL
      ELSE ROUND(
        SUM(score * coefficient) / SUM(coefficient),
        2
      )
    END
  FROM grades
  WHERE student_id = p_student_id
    AND period = p_period
    AND validated = true;
$$;