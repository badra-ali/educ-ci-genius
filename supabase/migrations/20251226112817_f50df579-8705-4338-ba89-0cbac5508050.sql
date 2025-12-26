-- Supprimer l'ancienne politique de suppression
DROP POLICY IF EXISTS "Admins école peuvent supprimer les cours" ON public.cours;

-- Créer une nouvelle politique permettant aux enseignants de supprimer leurs propres cours
CREATE POLICY "Enseignants et admins peuvent supprimer les cours"
ON public.cours
FOR DELETE
USING (
  -- L'enseignant peut supprimer ses propres cours
  (auth.uid() = enseignant_id)
  OR
  -- Les admins peuvent supprimer les cours de leur établissement
  (has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.etablissement_id = cours.etablissement_id
  ))
);