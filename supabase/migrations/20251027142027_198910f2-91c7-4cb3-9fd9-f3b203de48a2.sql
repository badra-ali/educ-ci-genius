-- Fonction pour mettre à jour l'établissement d'un utilisateur
CREATE OR REPLACE FUNCTION public.update_user_etablissement(
  _user_id uuid,
  _etablissement_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour l'établissement dans user_roles
  UPDATE public.user_roles
  SET etablissement_id = _etablissement_id
  WHERE user_id = _user_id;
  
  -- Si aucune ligne n'est affectée, lever une erreur
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Aucun rôle trouvé pour cet utilisateur';
  END IF;
END;
$$;