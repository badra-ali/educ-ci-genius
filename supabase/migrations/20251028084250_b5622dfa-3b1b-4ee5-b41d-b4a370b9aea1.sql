-- Admin système: étendre les paramètres et tables de support

-- Table settings pour paramètres globaux (ADMIN_SYSTEME)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table etab_settings pour paramètres par établissement (ADMIN_ECOLE)
CREATE TABLE IF NOT EXISTS public.etab_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id UUID NOT NULL REFERENCES public.etablissements(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(etablissement_id, key)
);

-- Ajouter colonnes manquantes à etablissements si nécessaire
ALTER TABLE public.etablissements 
  ADD COLUMN IF NOT EXISTS ville TEXT,
  ADD COLUMN IF NOT EXISTS contact JSONB DEFAULT '{}';

-- Ajouter colonne matricule aux profils élèves (via relation eleve_classes)
-- On va créer une vue pour faciliter l'accès
CREATE OR REPLACE VIEW public.students_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.date_naissance,
  ec.classe_id,
  c.nom as classe_nom,
  c.niveau as classe_niveau,
  ec.annee_scolaire,
  c.etablissement_id,
  'STU-' || LPAD(EXTRACT(YEAR FROM ec.date_inscription)::TEXT, 4, '0') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY ec.date_inscription)::TEXT, 4, '0') as matricule
FROM public.profiles p
INNER JOIN public.eleve_classes ec ON ec.user_id = p.id
INNER JOIN public.classes c ON c.id = ec.classe_id
WHERE ec.actif = true;

-- Vue pour enseignants avec leurs affectations
CREATE OR REPLACE VIEW public.teachers_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.phone,
  ur.etablissement_id,
  e.nom as etablissement_nom,
  array_agg(DISTINCT c.nom) FILTER (WHERE c.nom IS NOT NULL) as classes,
  array_agg(DISTINCT m.nom) FILTER (WHERE m.nom IS NOT NULL) as matieres
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.etablissements e ON e.id = ur.etablissement_id
LEFT JOIN public.enseignant_matieres em ON em.user_id = p.id
LEFT JOIN public.classes c ON c.id = em.classe_id
LEFT JOIN public.matieres m ON m.id = em.matiere_id
WHERE ur.role = 'ENSEIGNANT'
GROUP BY p.id, p.first_name, p.last_name, p.avatar_url, p.phone, ur.etablissement_id, e.nom;

-- Vue pour parents avec leurs enfants
CREATE OR REPLACE VIEW public.parents_view AS
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.avatar_url,
  p.phone,
  ur.etablissement_id,
  e.nom as etablissement_nom,
  array_agg(DISTINCT pe.eleve_id) FILTER (WHERE pe.eleve_id IS NOT NULL) as children_ids,
  count(DISTINCT pe.eleve_id) as children_count
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.etablissements e ON e.id = ur.etablissement_id
LEFT JOIN public.parent_eleves pe ON pe.parent_id = p.id
WHERE ur.role = 'PARENT'
GROUP BY p.id, p.first_name, p.last_name, p.avatar_url, p.phone, ur.etablissement_id, e.nom;

-- Ajouter index pour performances admin
CREATE INDEX IF NOT EXISTS idx_user_roles_etablissement ON public.user_roles(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_grades_period_validated ON public.grades(period, validated);
CREATE INDEX IF NOT EXISTS idx_attendance_decision ON public.attendance(decision, validated);
CREATE INDEX IF NOT EXISTS idx_report_cards_period ON public.report_cards(period, student_id);

-- RLS pour settings (ADMIN_SYSTEME uniquement)
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin système peut gérer settings globaux"
ON public.settings
FOR ALL
USING (has_role(auth.uid(), 'ADMIN_SYSTEME'));

-- RLS pour etab_settings
ALTER TABLE public.etab_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin système peut gérer tous les etab_settings"
ON public.etab_settings
FOR ALL
USING (has_role(auth.uid(), 'ADMIN_SYSTEME'));

CREATE POLICY "Admin école peut gérer settings de son établissement"
ON public.etab_settings
FOR ALL
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE') 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND etablissement_id = etab_settings.etablissement_id
  )
);

-- Fonction pour verrouiller une période de notation
CREATE OR REPLACE FUNCTION public.lock_grading_period(
  _etablissement_id UUID,
  _period TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insérer ou mettre à jour le paramètre de verrouillage
  INSERT INTO public.etab_settings (etablissement_id, key, value)
  VALUES (
    _etablissement_id,
    'locked_periods',
    jsonb_build_object('periods', jsonb_build_array(_period))
  )
  ON CONFLICT (etablissement_id, key) 
  DO UPDATE SET 
    value = jsonb_set(
      etab_settings.value,
      '{periods}',
      COALESCE(etab_settings.value->'periods', '[]'::jsonb) || jsonb_build_array(_period)
    ),
    updated_at = now();
END;
$$;

-- Fonction pour obtenir l'établissement d'un admin école
CREATE OR REPLACE FUNCTION public.get_admin_etablissement(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT etablissement_id 
  FROM public.user_roles 
  WHERE user_id = _user_id 
    AND role IN ('ADMIN_ECOLE', 'ADMIN_SYSTEME')
  LIMIT 1;
$$;

-- Trigger pour updated_at sur settings
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_etab_settings_updated_at
BEFORE UPDATE ON public.etab_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();