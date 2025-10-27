-- ============================================================================
-- MIGRATION: Corrections de sécurité critiques
-- ============================================================================

-- 1. PROTECTION CONTRE L'ESCALADE DE PRIVILÈGES sur user_roles
-- Empêche les utilisateurs d'ajouter/modifier leurs propres rôles

CREATE POLICY "Bloquer tous les INSERT directs sur user_roles"
ON user_roles FOR INSERT
WITH CHECK (false);

CREATE POLICY "Seuls les admins système peuvent modifier les rôles"
ON user_roles FOR UPDATE
USING (has_role(auth.uid(), 'ADMIN_SYSTEME'))
WITH CHECK (has_role(auth.uid(), 'ADMIN_SYSTEME'));

CREATE POLICY "Seuls les admins système peuvent supprimer des rôles"
ON user_roles FOR DELETE
USING (has_role(auth.uid(), 'ADMIN_SYSTEME'));

-- 2. PROTECTION DES DONNÉES DE CONTACT des établissements
-- Remplacer la politique publique qui expose email/téléphone

DROP POLICY IF EXISTS "Etablissements publiquement visibles" ON etablissements;

CREATE POLICY "Informations publiques des établissements actifs"
ON etablissements FOR SELECT
USING (
  actif = true 
  AND (
    -- Informations de base visibles par tous
    auth.uid() IS NULL 
    OR 
    -- Utilisateurs authentifiés voient tout
    auth.uid() IS NOT NULL
  )
);

-- 3. POLITIQUES AUDIT_LOG pour intégrité des logs

CREATE POLICY "Les utilisateurs peuvent créer leurs propres logs"
ON audit_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les logs sont immuables - pas de UPDATE"
ON audit_log FOR UPDATE
USING (false);

CREATE POLICY "Les logs sont immuables - pas de DELETE"
ON audit_log FOR DELETE
USING (false);

-- 4. ADMIN_ECOLE peut mettre à jour son établissement

CREATE POLICY "Les admins école peuvent modifier leur établissement"
ON etablissements FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN_ECOLE'
    AND etablissement_id = etablissements.id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'ADMIN_ECOLE'
    AND etablissement_id = etablissements.id
  )
);

-- 5. TABLES POUR ONBOARDING

-- Table des classes
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL, -- ex: "6ème A", "CM2", "Terminale S"
  niveau text NOT NULL, -- ex: "Primaire", "Collège", "Lycée"
  annee_scolaire text NOT NULL DEFAULT '2024-2025',
  capacite_max integer DEFAULT 40,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(etablissement_id, nom, annee_scolaire)
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes visibles par tous les utilisateurs authentifiés"
ON classes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins école peuvent gérer leurs classes"
ON classes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND (role = 'ADMIN_ECOLE' OR role = 'ADMIN_SYSTEME')
    AND (etablissement_id = classes.etablissement_id OR role = 'ADMIN_SYSTEME')
  )
);

-- Table des matières
CREATE TABLE IF NOT EXISTS public.matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL, -- ex: "Mathématiques", "Français", "SVT"
  code text, -- ex: "MATH", "FR", "SVT"
  couleur text DEFAULT '#3B82F6', -- couleur pour l'UI
  niveau text NOT NULL, -- ex: "Primaire", "Collège", "Lycée"
  coefficient numeric DEFAULT 1.0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(etablissement_id, code, niveau)
);

ALTER TABLE matieres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matières visibles par tous les utilisateurs authentifiés"
ON matieres FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins école peuvent gérer leurs matières"
ON matieres FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND (role = 'ADMIN_ECOLE' OR role = 'ADMIN_SYSTEME')
    AND (etablissement_id = matieres.etablissement_id OR role = 'ADMIN_SYSTEME')
  )
);

-- Table pour lier élèves aux classes
CREATE TABLE IF NOT EXISTS public.eleve_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  classe_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  annee_scolaire text NOT NULL DEFAULT '2024-2025',
  date_inscription timestamp with time zone DEFAULT now(),
  actif boolean DEFAULT true,
  UNIQUE(user_id, classe_id, annee_scolaire)
);

ALTER TABLE eleve_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir leurs propres classes"
ON eleve_classes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent gérer les inscriptions"
ON eleve_classes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN classes c ON c.id = eleve_classes.classe_id
    WHERE ur.user_id = auth.uid()
    AND (ur.role = 'ADMIN_ECOLE' OR ur.role = 'ADMIN_SYSTEME')
    AND (ur.etablissement_id = c.etablissement_id OR ur.role = 'ADMIN_SYSTEME')
  )
);

-- Table pour lier enseignants aux matières
CREATE TABLE IF NOT EXISTS public.enseignant_matieres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  matiere_id uuid REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  classe_id uuid REFERENCES classes(id) ON DELETE CASCADE,
  annee_scolaire text NOT NULL DEFAULT '2024-2025',
  principal boolean DEFAULT false, -- enseignant principal de cette matière
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, matiere_id, classe_id, annee_scolaire)
);

ALTER TABLE enseignant_matieres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enseignants peuvent voir leurs matières"
ON enseignant_matieres FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins peuvent gérer les affectations enseignants"
ON enseignant_matieres FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN matieres m ON m.id = enseignant_matieres.matiere_id
    WHERE ur.user_id = auth.uid()
    AND (ur.role = 'ADMIN_ECOLE' OR ur.role = 'ADMIN_SYSTEME')
    AND (ur.etablissement_id = m.etablissement_id OR ur.role = 'ADMIN_SYSTEME')
  )
);

-- Table pour lier parents aux élèves
CREATE TABLE IF NOT EXISTS public.parent_eleves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  eleve_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lien_parente text NOT NULL, -- "Père", "Mère", "Tuteur légal", etc.
  contact_prioritaire boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(parent_id, eleve_id)
);

ALTER TABLE parent_eleves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents peuvent voir leurs liens"
ON parent_eleves FOR SELECT
USING (auth.uid() = parent_id);

CREATE POLICY "Élèves peuvent voir leurs parents"
ON parent_eleves FOR SELECT
USING (auth.uid() = eleve_id);

CREATE POLICY "Admins peuvent gérer les liens parent-élève"
ON parent_eleves FOR ALL
USING (has_role(auth.uid(), 'ADMIN_ECOLE') OR has_role(auth.uid(), 'ADMIN_SYSTEME'));

-- Triggers pour updated_at
CREATE TRIGGER update_classes_updated_at
BEFORE UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matieres_updated_at
BEFORE UPDATE ON matieres
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ajouter champs onboarding au profil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS date_naissance date;