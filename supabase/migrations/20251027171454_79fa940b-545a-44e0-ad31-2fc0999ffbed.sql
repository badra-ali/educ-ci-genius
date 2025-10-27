-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create resources table (core library content)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Livre', 'Cours', 'Exercice', 'Article')),
  level TEXT NOT NULL CHECK (level IN ('Primaire', 'Collège', 'Lycée')),
  subject TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'FR' CHECK (language IN ('FR', 'EN')),
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  cover_url TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'epub', 'html')),
  file_url TEXT,
  audio_available BOOLEAN DEFAULT false,
  etablissement_id UUID REFERENCES public.etablissements(id),
  is_public BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resource_sections table (for EPUB/HTML chapters)
CREATE TABLE public.resource_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  title TEXT NOT NULL,
  start_locator TEXT,
  end_locator TEXT,
  text_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resource_assets table (multiple files per resource)
CREATE TABLE public.resource_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'epub', 'html', 'audio', 'cover')),
  url TEXT NOT NULL,
  bytes BIGINT,
  checksum TEXT,
  mime TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create resource_embeddings table (pgvector for semantic search)
CREATE TABLE public.resource_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.resource_sections(id) ON DELETE CASCADE,
  embedding vector(1536),
  text_excerpt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_reading table (reading progress)
CREATE TABLE public.user_reading (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  last_locator TEXT,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  seconds_read INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Create user_highlights table (notes and highlights)
CREATE TABLE public.user_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  locator TEXT NOT NULL,
  text TEXT,
  color TEXT DEFAULT '#FFEB3B',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_shelves table (Favoris, À lire, Hors-ligne)
CREATE TABLE public.user_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  shelf TEXT NOT NULL CHECK (shelf IN ('FAVORI', 'A_LIRE', 'HORS_LIGNE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, resource_id, shelf)
);

-- Create search_logs table (analytics)
CREATE TABLE public.search_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  clicked_resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audio_jobs table (TTS generation queue)
CREATE TABLE public.audio_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.resource_sections(id) ON DELETE CASCADE,
  voice TEXT DEFAULT 'alloy',
  rate NUMERIC(3,2) DEFAULT 1.0,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'READY', 'ERROR')),
  audio_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function for full-text search indexing
CREATE OR REPLACE FUNCTION public.resources_search_text(r public.resources)
RETURNS tsvector
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_tsvector('simple', 
    r.title || ' ' || 
    r.author || ' ' || 
    COALESCE(array_to_string(r.tags, ' '), '') || ' ' || 
    COALESCE(r.summary, '')
  )
$$;

-- Create indexes for performance
CREATE INDEX idx_resources_level_subject ON public.resources(level, subject);
CREATE INDEX idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX idx_resources_fts ON public.resources USING GIN(resources_search_text(resources.*));
CREATE INDEX idx_resource_sections_resource ON public.resource_sections(resource_id);
CREATE INDEX idx_resource_embeddings_resource ON public.resource_embeddings(resource_id);
CREATE INDEX idx_resource_embeddings_vector ON public.resource_embeddings USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_user_reading_user ON public.user_reading(user_id);
CREATE INDEX idx_user_reading_updated ON public.user_reading(updated_at DESC);
CREATE INDEX idx_user_shelves_user_shelf ON public.user_shelves(user_id, shelf);
CREATE INDEX idx_audio_jobs_status ON public.audio_jobs(status) WHERE status = 'PENDING';

-- Enable RLS on all tables
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reading ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
CREATE POLICY "Public resources are viewable by all authenticated users"
  ON public.resources FOR SELECT
  USING (is_public = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Private resources viewable by same establishment"
  ON public.resources FOR SELECT
  USING (
    is_public = false AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.etablissement_id = resources.etablissement_id
    )
  );

CREATE POLICY "Admins and teachers can insert resources"
  ON public.resources FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ENSEIGNANT'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

CREATE POLICY "Admins and teachers can update their resources"
  ON public.resources FOR UPDATE
  USING (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ENSEIGNANT'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

-- RLS Policies for resource_sections
CREATE POLICY "Sections viewable if resource viewable"
  ON public.resource_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_sections.resource_id
    )
  );

CREATE POLICY "Admins can manage sections"
  ON public.resource_sections FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ENSEIGNANT'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

-- RLS Policies for resource_assets
CREATE POLICY "Assets viewable if resource viewable"
  ON public.resource_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_assets.resource_id
    )
  );

CREATE POLICY "Admins can manage assets"
  ON public.resource_assets FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ENSEIGNANT'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

-- RLS Policies for resource_embeddings
CREATE POLICY "Embeddings viewable if resource viewable"
  ON public.resource_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = resource_embeddings.resource_id
    )
  );

CREATE POLICY "Admins can manage embeddings"
  ON public.resource_embeddings FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

-- RLS Policies for user_reading
CREATE POLICY "Users can view their own reading progress"
  ON public.user_reading FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reading progress"
  ON public.user_reading FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reading progress"
  ON public.user_reading FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_highlights
CREATE POLICY "Users can view their own highlights"
  ON public.user_highlights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights"
  ON public.user_highlights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights"
  ON public.user_highlights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights"
  ON public.user_highlights FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_shelves
CREATE POLICY "Users can view their own shelves"
  ON public.user_shelves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their shelves"
  ON public.user_shelves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their shelves"
  ON public.user_shelves FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for search_logs
CREATE POLICY "Users can create search logs"
  ON public.search_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all search logs"
  ON public.search_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

-- RLS Policies for audio_jobs
CREATE POLICY "Users can view audio jobs for accessible resources"
  ON public.audio_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources
      WHERE resources.id = audio_jobs.resource_id
    )
  );

CREATE POLICY "Admins can manage audio jobs"
  ON public.audio_jobs FOR ALL
  USING (
    has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
    has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role)
  );

-- Triggers
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audio_jobs_updated_at
  BEFORE UPDATE ON public.audio_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert demo data
INSERT INTO public.resources (title, author, type, level, subject, language, summary, tags, audio_available, is_public)
VALUES
  ('Les Misérables', 'Victor Hugo', 'Livre', 'Lycée', 'Français', 'FR', 'Un chef-d''œuvre de la littérature française qui explore les thèmes de la justice, de la rédemption et de l''amour.', ARRAY['littérature', 'classique', 'français'], true, true),
  ('Cours de Mathématiques', 'Dr. Kouassi', 'Cours', 'Lycée', 'Mathématiques', 'FR', 'Cours complet de mathématiques pour le niveau Terminale couvrant l''analyse, l''algèbre et la géométrie.', ARRAY['mathématiques', 'terminale', 'analyse'], false, true),
  ('Histoire de la Côte d''Ivoire', 'Prof. Yao', 'Livre', 'Collège', 'Histoire', 'FR', 'Une exploration complète de l''histoire ivoirienne, de la préhistoire à nos jours.', ARRAY['histoire', 'côte d''ivoire', 'afrique'], true, true),
  ('Sciences Physiques', 'Dr. Traoré', 'Cours', 'Lycée', 'Physique', 'FR', 'Introduction à la physique : mécanique, électricité, thermodynamique et optique.', ARRAY['physique', 'sciences', '2nde'], true, true),
  ('Introduction à la Biologie', 'Dr. Koné', 'Cours', 'Collège', 'Biologie', 'FR', 'Les bases de la biologie : cellule, génétique, évolution et écosystèmes.', ARRAY['biologie', 'sciences', 'collège'], false, true),
  ('Géométrie dans l''Espace', 'Prof. Diallo', 'Exercice', 'Lycée', 'Mathématiques', 'FR', 'Recueil d''exercices sur la géométrie dans l''espace avec solutions détaillées.', ARRAY['géométrie', 'exercices', 'mathématiques'], false, true),
  ('L''Aventure Ambiguë', 'Cheikh Hamidou Kane', 'Livre', 'Lycée', 'Français', 'FR', 'Roman africain majeur sur le conflit entre tradition et modernité.', ARRAY['littérature', 'afrique', 'philosophie'], true, true),
  ('Chimie Organique', 'Dr. Sangaré', 'Cours', 'Lycée', 'Chimie', 'FR', 'Les fondamentaux de la chimie organique : hydrocarbures, fonctions et réactions.', ARRAY['chimie', 'organique', 'terminale'], false, true);

-- Create storage bucket for library resources
INSERT INTO storage.buckets (id, name, public) 
VALUES ('library-resources', 'library-resources', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for library-resources bucket
CREATE POLICY "Authenticated users can view library resources"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'library-resources' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can upload library resources"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'library-resources' AND
    (has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
     has_role(auth.uid(), 'ENSEIGNANT'::app_role) OR
     has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role))
  );

CREATE POLICY "Admins can update library resources"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'library-resources' AND
    (has_role(auth.uid(), 'ADMIN_ECOLE'::app_role) OR
     has_role(auth.uid(), 'ADMIN_SYSTEME'::app_role))
  );