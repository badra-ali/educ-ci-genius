-- Corriger les fonctions sans search_path défini

-- Recréer resources_search_text avec search_path
CREATE OR REPLACE FUNCTION public.resources_search_text(r resources)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE 
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_tsvector('simple', 
    r.title || ' ' || 
    r.author || ' ' || 
    COALESCE(array_to_string(r.tags, ' '), '') || ' ' || 
    COALESCE(r.summary, '')
  )
$$;

-- Recréer calculate_class_average avec search_path
CREATE OR REPLACE FUNCTION public.calculate_class_average(
  p_classe_id uuid, 
  p_matiere_id uuid, 
  p_period text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Recréer get_teacher_classes avec search_path
CREATE OR REPLACE FUNCTION public.get_teacher_classes(p_teacher_id uuid)
RETURNS TABLE(
  classe_id uuid, 
  classe_nom text, 
  matiere_id uuid, 
  matiere_nom text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;