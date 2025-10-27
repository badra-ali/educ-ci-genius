
-- Permettre aux élèves de s'inscrire dans des classes pendant l'onboarding
CREATE POLICY "Élèves peuvent s'inscrire dans des classes"
ON public.eleve_classes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'ELEVE'::app_role)
);

-- Permettre aux enseignants de s'affecter à des matières pendant l'onboarding
CREATE POLICY "Enseignants peuvent s'affecter à des matières"
ON public.enseignant_matieres
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'ENSEIGNANT'::app_role)
);

-- Permettre aux parents de se lier à un élève pendant l'onboarding
CREATE POLICY "Parents peuvent se lier à un élève"
ON public.parent_eleves
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = parent_id 
  AND has_role(auth.uid(), 'PARENT'::app_role)
);
