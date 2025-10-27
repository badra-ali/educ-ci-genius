-- ============================================================================
-- MIGRATION: Module 1 - Classe Virtuelle (Phase 2A - Fondations) - CORRIGÉ
-- ============================================================================

-- ============================================================================
-- 1. TABLE COURS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.cours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  contenu_json jsonb DEFAULT '[]'::jsonb, -- Structure: [{type: 'chapitre', titre, contenu, ordre}, {type: 'video', url, titre, ordre}, ...]
  matiere_id uuid REFERENCES matieres(id) ON DELETE CASCADE NOT NULL,
  enseignant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE NOT NULL,
  visio_url text, -- URL externe pour visioconférence (Zoom, Meet, Jitsi)
  objectifs text[], -- Objectifs pédagogiques
  prerequis text[], -- Prérequis
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publie', 'archive')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table de liaison cours <-> classes (many-to-many)
CREATE TABLE IF NOT EXISTS public.cours_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cours_id uuid REFERENCES cours(id) ON DELETE CASCADE NOT NULL,
  classe_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(cours_id, classe_id)
);

-- ============================================================================
-- 2. TABLE QCM (Questionnaires à choix multiples)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.qcms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  description text,
  cours_id uuid REFERENCES cours(id) ON DELETE CASCADE,
  cree_par_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE NOT NULL,
  duree_minutes integer, -- Durée limite (null = pas de limite)
  tags text[], -- Tags pour catégorisation (difficulté, thème, etc.)
  affichage_feedback text DEFAULT 'fin' CHECK (affichage_feedback IN ('immediat', 'fin', 'jamais')),
  melanger_questions boolean DEFAULT false,
  melanger_options boolean DEFAULT false,
  tentatives_max integer, -- null = illimité
  note_minimale numeric(5,2), -- Note minimale pour réussir (sur 100)
  statut text DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'publie', 'archive')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 3. TABLE QUESTIONS (Questions de QCM)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qcm_id uuid REFERENCES qcms(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL, -- Array de strings: ["Option A", "Option B", "Option C", "Option D"]
  answer_index integer NOT NULL, -- Index de la bonne réponse (0-based)
  feedback text, -- Explication de la réponse
  points numeric(5,2) DEFAULT 1.0, -- Points attribués à cette question
  ordre integer NOT NULL, -- Ordre d'affichage
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT valid_answer_index CHECK (answer_index >= 0),
  CONSTRAINT valid_options CHECK (jsonb_array_length(options) >= 2 AND jsonb_array_length(options) <= 8)
);

-- ============================================================================
-- 4. TABLE TENTATIVES_QCM (Passages des QCM par les élèves)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tentatives_qcm (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qcm_id uuid REFERENCES qcms(id) ON DELETE CASCADE NOT NULL,
  eleve_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reponses jsonb NOT NULL, -- [{question_id, index_choisi, correct, points_obtenus}, ...]
  score numeric(5,2) NOT NULL, -- Score en pourcentage (0-100)
  duree_secondes integer, -- Temps pris en secondes
  started_at timestamp with time zone DEFAULT now(),
  submitted_at timestamp with time zone,
  CONSTRAINT valid_score CHECK (score >= 0 AND score <= 100)
);

-- ============================================================================
-- 5. TABLE DEVOIRS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.devoirs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titre text NOT NULL,
  consignes text NOT NULL,
  cours_id uuid REFERENCES cours(id) ON DELETE CASCADE NOT NULL,
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE NOT NULL,
  deadline timestamp with time zone NOT NULL,
  note_sur numeric(5,2) DEFAULT 20.0, -- Barème (ex: 20, 100)
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 6. TABLE RENDUS_DEVOIR (Rendus des élèves)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rendus_devoir (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  devoir_id uuid REFERENCES devoirs(id) ON DELETE CASCADE NOT NULL,
  eleve_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  texte text,
  note numeric(5,2),
  commentaire_prof text,
  statut text DEFAULT 'assigne' CHECK (statut IN ('assigne', 'rendu', 'en_retard', 'note')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  rendu_at timestamp with time zone,
  note_at timestamp with time zone,
  UNIQUE(devoir_id, eleve_id),
  CONSTRAINT valid_note CHECK (note IS NULL OR note >= 0)
);

-- ============================================================================
-- 7. TABLE THREADS (Forum / Collaboration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text DEFAULT 'cours' CHECK (type IN ('cours', 'direct')),
  cours_id uuid REFERENCES cours(id) ON DELETE CASCADE,
  titre text, -- Pour threads direct
  participants uuid[] DEFAULT ARRAY[]::uuid[], -- IDs des utilisateurs participants
  etablissement_id uuid REFERENCES etablissements(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 8. TABLE MESSAGES (Messages dans les threads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contenu text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- 9. TABLE ATTACHMENTS (Pièces jointes) - APRÈS toutes les autres tables
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL, -- URL dans Supabase Storage
  size bigint NOT NULL, -- Taille en bytes
  mime_type text NOT NULL,
  cours_id uuid REFERENCES cours(id) ON DELETE CASCADE,
  devoir_id uuid REFERENCES devoirs(id) ON DELETE CASCADE,
  rendu_id uuid REFERENCES rendus_devoir(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- INDEXES pour performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cours_etablissement ON cours(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_cours_matiere ON cours(matiere_id);
CREATE INDEX IF NOT EXISTS idx_cours_enseignant ON cours(enseignant_id);
CREATE INDEX IF NOT EXISTS idx_cours_statut ON cours(statut);

CREATE INDEX IF NOT EXISTS idx_cours_classes_cours ON cours_classes(cours_id);
CREATE INDEX IF NOT EXISTS idx_cours_classes_classe ON cours_classes(classe_id);

CREATE INDEX IF NOT EXISTS idx_qcms_etablissement ON qcms(etablissement_id);
CREATE INDEX IF NOT EXISTS idx_qcms_cours ON qcms(cours_id);
CREATE INDEX IF NOT EXISTS idx_qcms_cree_par ON qcms(cree_par_id);

CREATE INDEX IF NOT EXISTS idx_questions_qcm ON questions(qcm_id);

CREATE INDEX IF NOT EXISTS idx_tentatives_qcm ON tentatives_qcm(qcm_id);
CREATE INDEX IF NOT EXISTS idx_tentatives_eleve ON tentatives_qcm(eleve_id);

CREATE INDEX IF NOT EXISTS idx_devoirs_cours ON devoirs(cours_id);
CREATE INDEX IF NOT EXISTS idx_devoirs_etablissement ON devoirs(etablissement_id);

CREATE INDEX IF NOT EXISTS idx_rendus_devoir ON rendus_devoir(devoir_id);
CREATE INDEX IF NOT EXISTS idx_rendus_eleve ON rendus_devoir(eleve_id);
CREATE INDEX IF NOT EXISTS idx_rendus_statut ON rendus_devoir(statut);

CREATE INDEX IF NOT EXISTS idx_threads_cours ON threads(cours_id);
CREATE INDEX IF NOT EXISTS idx_threads_etablissement ON threads(etablissement_id);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_author ON messages(author_id);

CREATE INDEX IF NOT EXISTS idx_attachments_cours ON attachments(cours_id);
CREATE INDEX IF NOT EXISTS idx_attachments_devoir ON attachments(devoir_id);
CREATE INDEX IF NOT EXISTS idx_attachments_rendu ON attachments(rendu_id);

-- ============================================================================
-- TRIGGERS pour updated_at
-- ============================================================================
CREATE TRIGGER update_cours_updated_at BEFORE UPDATE ON cours
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qcms_updated_at BEFORE UPDATE ON qcms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devoirs_updated_at BEFORE UPDATE ON devoirs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rendus_updated_at BEFORE UPDATE ON rendus_devoir
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- COURS
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir les cours de leur établissement"
ON cours FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND etablissement_id = cours.etablissement_id
  )
);

CREATE POLICY "Enseignants peuvent créer des cours"
ON cours FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'ENSEIGNANT')
  AND auth.uid() = enseignant_id
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND etablissement_id = cours.etablissement_id
  )
);

CREATE POLICY "Enseignants peuvent modifier leurs cours"
ON cours FOR UPDATE
USING (
  auth.uid() = enseignant_id
  OR has_role(auth.uid(), 'ADMIN_ECOLE')
)
WITH CHECK (
  auth.uid() = enseignant_id
  OR has_role(auth.uid(), 'ADMIN_ECOLE')
);

CREATE POLICY "Admins école peuvent supprimer les cours"
ON cours FOR DELETE
USING (
  has_role(auth.uid(), 'ADMIN_ECOLE')
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND etablissement_id = cours.etablissement_id
  )
);

-- COURS_CLASSES
ALTER TABLE cours_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tous peuvent voir les liaisons cours-classes"
ON cours_classes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enseignants et admins peuvent gérer les liaisons"
ON cours_classes FOR ALL
USING (
  has_role(auth.uid(), 'ENSEIGNANT')
  OR has_role(auth.uid(), 'ADMIN_ECOLE')
  OR has_role(auth.uid(), 'ADMIN_SYSTEME')
);

-- ATTACHMENTS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir les pièces jointes accessibles"
ON attachments FOR SELECT
USING (
  -- Pièces d'un cours accessible
  (cours_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cours c
    JOIN user_roles ur ON ur.etablissement_id = c.etablissement_id
    WHERE c.id = attachments.cours_id AND ur.user_id = auth.uid()
  ))
  OR
  -- Pièces d'un devoir accessible
  (devoir_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM devoirs d
    JOIN user_roles ur ON ur.etablissement_id = d.etablissement_id
    WHERE d.id = attachments.devoir_id AND ur.user_id = auth.uid()
  ))
  OR
  -- Pièces d'un rendu (élève ou enseignant du cours)
  (rendu_id IS NOT NULL)
  OR
  -- Pièces de message (participant au thread)
  (message_id IS NOT NULL)
);

CREATE POLICY "Utilisateurs peuvent uploader des pièces jointes"
ON attachments FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- QCMs
ALTER TABLE qcms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir les QCM de leur établissement"
ON qcms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND etablissement_id = qcms.etablissement_id
  )
);

CREATE POLICY "Enseignants peuvent créer des QCM"
ON qcms FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'ENSEIGNANT')
  AND auth.uid() = cree_par_id
);

CREATE POLICY "Enseignants peuvent modifier leurs QCM"
ON qcms FOR UPDATE
USING (auth.uid() = cree_par_id OR has_role(auth.uid(), 'ADMIN_ECOLE'));

CREATE POLICY "Admins peuvent supprimer les QCM"
ON qcms FOR DELETE
USING (has_role(auth.uid(), 'ADMIN_ECOLE'));

-- QUESTIONS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir les questions"
ON questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM qcms q
    JOIN user_roles ur ON ur.etablissement_id = q.etablissement_id
    WHERE q.id = questions.qcm_id AND ur.user_id = auth.uid()
  )
);

CREATE POLICY "Enseignants peuvent gérer les questions de leurs QCM"
ON questions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM qcms
    WHERE id = questions.qcm_id
    AND (cree_par_id = auth.uid() OR has_role(auth.uid(), 'ADMIN_ECOLE'))
  )
);

-- TENTATIVES_QCM
ALTER TABLE tentatives_qcm ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Élèves peuvent voir leurs tentatives"
ON tentatives_qcm FOR SELECT
USING (auth.uid() = eleve_id);

CREATE POLICY "Enseignants peuvent voir les tentatives de leurs QCM"
ON tentatives_qcm FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM qcms
    WHERE id = tentatives_qcm.qcm_id
    AND cree_par_id = auth.uid()
  )
  OR has_role(auth.uid(), 'ADMIN_ECOLE')
);

CREATE POLICY "Élèves peuvent créer leurs tentatives"
ON tentatives_qcm FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'ELEVE')
  AND auth.uid() = eleve_id
);

-- DEVOIRS
ALTER TABLE devoirs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs peuvent voir les devoirs de leur établissement"
ON devoirs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND etablissement_id = devoirs.etablissement_id
  )
);

CREATE POLICY "Enseignants peuvent créer des devoirs pour leurs cours"
ON devoirs FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'ENSEIGNANT')
  AND EXISTS (
    SELECT 1 FROM cours
    WHERE id = devoirs.cours_id
    AND enseignant_id = auth.uid()
  )
);

CREATE POLICY "Enseignants peuvent modifier leurs devoirs"
ON devoirs FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cours
    WHERE id = devoirs.cours_id
    AND enseignant_id = auth.uid()
  )
  OR has_role(auth.uid(), 'ADMIN_ECOLE')
);

CREATE POLICY "Admins peuvent supprimer les devoirs"
ON devoirs FOR DELETE
USING (has_role(auth.uid(), 'ADMIN_ECOLE'));

-- RENDUS_DEVOIR
ALTER TABLE rendus_devoir ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Élèves peuvent voir leurs rendus"
ON rendus_devoir FOR SELECT
USING (auth.uid() = eleve_id);

CREATE POLICY "Enseignants peuvent voir les rendus de leurs devoirs"
ON rendus_devoir FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM devoirs d
    JOIN cours c ON c.id = d.cours_id
    WHERE d.id = rendus_devoir.devoir_id
    AND c.enseignant_id = auth.uid()
  )
  OR has_role(auth.uid(), 'ADMIN_ECOLE')
);

CREATE POLICY "Élèves peuvent créer et modifier leurs rendus"
ON rendus_devoir FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'ELEVE')
  AND auth.uid() = eleve_id
);

CREATE POLICY "Élèves peuvent mettre à jour leurs rendus avant deadline"
ON rendus_devoir FOR UPDATE
USING (
  auth.uid() = eleve_id
  AND statut IN ('assigne', 'rendu', 'en_retard')
);

CREATE POLICY "Enseignants peuvent noter les rendus"
ON rendus_devoir FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM devoirs d
    JOIN cours c ON c.id = d.cours_id
    WHERE d.id = rendus_devoir.devoir_id
    AND c.enseignant_id = auth.uid()
  )
);

-- THREADS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants peuvent voir leurs threads"
ON threads FOR SELECT
USING (
  auth.uid() = ANY(participants)
  OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND etablissement_id = threads.etablissement_id
    AND role IN ('ENSEIGNANT', 'ADMIN_ECOLE')
  )
);

CREATE POLICY "Utilisateurs peuvent créer des threads"
ON threads FOR INSERT
WITH CHECK (auth.uid() = ANY(participants));

-- MESSAGES
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants peuvent voir les messages de leurs threads"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM threads
    WHERE id = messages.thread_id
    AND auth.uid() = ANY(participants)
  )
);

CREATE POLICY "Participants peuvent envoyer des messages"
ON messages FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1 FROM threads
    WHERE id = messages.thread_id
    AND auth.uid() = ANY(participants)
  )
);

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Bucket pour les pièces jointes des cours
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cours-attachments',
  'cours-attachments',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les pièces jointes des devoirs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'devoir-attachments',
  'devoir-attachments',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les rendus des élèves
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'rendu-attachments',
  'rendu-attachments',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Cours attachments: enseignants peuvent upload, tous peuvent voir
CREATE POLICY "Enseignants peuvent uploader des pièces de cours"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cours-attachments'
  AND has_role(auth.uid(), 'ENSEIGNANT')
);

CREATE POLICY "Utilisateurs peuvent voir les pièces de cours"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'cours-attachments'
  AND auth.uid() IS NOT NULL
);

-- Devoir attachments: enseignants peuvent upload, élèves peuvent voir
CREATE POLICY "Enseignants peuvent uploader des pièces de devoir"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'devoir-attachments'
  AND has_role(auth.uid(), 'ENSEIGNANT')
);

CREATE POLICY "Utilisateurs peuvent voir les pièces de devoir"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'devoir-attachments'
  AND auth.uid() IS NOT NULL
);

-- Rendu attachments: élèves peuvent upload leurs rendus, enseignants peuvent voir
CREATE POLICY "Élèves peuvent uploader leurs rendus"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rendu-attachments'
  AND has_role(auth.uid(), 'ELEVE')
);

CREATE POLICY "Élèves peuvent voir leurs rendus"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rendu-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Enseignants peuvent voir tous les rendus"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rendu-attachments'
  AND (has_role(auth.uid(), 'ENSEIGNANT') OR has_role(auth.uid(), 'ADMIN_ECOLE'))
);