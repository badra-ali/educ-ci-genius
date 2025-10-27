-- 1. Créer l'enum pour les rôles
CREATE TYPE public.app_role AS ENUM ('ELEVE', 'ENSEIGNANT', 'PARENT', 'ADMIN_ECOLE', 'ADMIN_SYSTEME');

-- 2. Créer la table etablissements (multi-tenant)
CREATE TABLE public.etablissements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  code TEXT UNIQUE,
  logo_url TEXT,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  niveaux TEXT[] DEFAULT ARRAY['Primaire', 'Collège', 'Lycée'],
  params JSONB DEFAULT '{}',
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Créer la table user_roles (architecture sécurisée)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  etablissement_id UUID REFERENCES public.etablissements(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, etablissement_id)
);

-- 4. Migrer les données existantes de profiles vers user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT id, role::app_role
FROM public.profiles
WHERE role IS NOT NULL;

-- 5. Supprimer la colonne role de profiles (maintenant dans user_roles)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 6. Enable RLS sur les nouvelles tables
ALTER TABLE public.etablissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 7. Créer fonction security definer pour vérifier les rôles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 8. Créer fonction pour obtenir les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS TABLE (role app_role, etablissement_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role, etablissement_id
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- 9. RLS policies pour user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins système peuvent tout voir"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'ADMIN_SYSTEME'));

-- 10. RLS policies pour etablissements
CREATE POLICY "Etablissements publiquement visibles"
ON public.etablissements
FOR SELECT
USING (actif = true);

CREATE POLICY "Admins système peuvent gérer établissements"
ON public.etablissements
FOR ALL
USING (public.has_role(auth.uid(), 'ADMIN_SYSTEME'));

-- 11. Créer table audit_log pour traçabilité
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins peuvent voir audit logs"
ON public.audit_log
FOR SELECT
USING (
  public.has_role(auth.uid(), 'ADMIN_SYSTEME') OR 
  public.has_role(auth.uid(), 'ADMIN_ECOLE')
);

-- 12. Trigger pour updated_at sur etablissements
CREATE TRIGGER update_etablissements_updated_at
BEFORE UPDATE ON public.etablissements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 13. Mettre à jour la fonction handle_new_user pour utiliser user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Insérer le profil
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  
  -- Déterminer le rôle (par défaut ELEVE)
  user_role := COALESCE(
    (new.raw_user_meta_data->>'role')::app_role,
    'ELEVE'::app_role
  );
  
  -- Insérer le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, user_role);
  
  RETURN new;
END;
$function$;