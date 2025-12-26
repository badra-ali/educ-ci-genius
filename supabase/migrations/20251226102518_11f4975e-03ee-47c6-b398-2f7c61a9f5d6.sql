-- Allow users to view profiles of teachers and other users in their establishment
CREATE POLICY "Users can view profiles in their establishment"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur1
    JOIN user_roles ur2 ON ur1.etablissement_id = ur2.etablissement_id
    WHERE ur1.user_id = auth.uid()
    AND ur2.user_id = profiles.id
  )
  OR id = auth.uid()
);