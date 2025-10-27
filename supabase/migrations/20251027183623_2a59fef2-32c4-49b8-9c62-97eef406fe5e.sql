-- Créer le bucket pour les justifications d'absences
INSERT INTO storage.buckets (id, name, public)
VALUES ('justifications', 'justifications', false);

-- Politique : élèves peuvent uploader leurs justifications
CREATE POLICY "Élèves peuvent uploader leurs justifications"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'justifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique : élèves peuvent voir leurs justifications
CREATE POLICY "Élèves peuvent voir leurs justifications"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'justifications' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique : admins et enseignants peuvent voir toutes les justifications
CREATE POLICY "Admins et enseignants peuvent voir les justifications"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'justifications' AND
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role IN ('ADMIN_ECOLE', 'ADMIN_SYSTEME', 'ENSEIGNANT')
  )
);