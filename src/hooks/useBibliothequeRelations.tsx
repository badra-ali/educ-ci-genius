import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ResourceWithRelations {
  id: string;
  title: string;
  author: string;
  type: string;
  level: string;
  subject: string;
  language: string;
  is_public: boolean;
  views_count: number;
  audio_available: boolean;
  created_at: string;
  sections_count: number;
  readers_count: number;
  highlights_count: number;
  embeddings_count: number;
}

export interface ResourceSection {
  id: string;
  title: string;
  index: number;
  text_content: string | null;
  start_locator: string | null;
  end_locator: string | null;
}

export interface UserReading {
  id: string;
  user_id: string;
  progress_percent: number;
  seconds_read: number;
  last_locator: string | null;
  updated_at: string;
}

export interface UserHighlight {
  id: string;
  user_id: string;
  text: string | null;
  color: string;
  note: string | null;
  locator: string;
  created_at: string;
}

export interface ResourceEmbedding {
  id: string;
  section_id: string | null;
  text_excerpt: string | null;
  created_at: string;
}

export function useBibliothequeRelations() {
  return useQuery({
    queryKey: ['bibliotheque-relations'],
    queryFn: async () => {
      // Fetch resources
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (resourcesError) throw resourcesError;

      // Fetch sections counts
      const { data: sections, error: sectionsError } = await supabase
        .from('resource_sections')
        .select('resource_id');

      if (sectionsError) throw sectionsError;

      // Fetch reading progress counts
      const { data: readings, error: readingsError } = await supabase
        .from('user_reading')
        .select('resource_id');

      if (readingsError) throw readingsError;

      // Fetch highlights counts
      const { data: highlights, error: highlightsError } = await supabase
        .from('user_highlights')
        .select('resource_id');

      if (highlightsError) throw highlightsError;

      // Fetch embeddings counts
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('resource_embeddings')
        .select('resource_id');

      if (embeddingsError) throw embeddingsError;

      // Count relations per resource
      const sectionsCounts = sections?.reduce((acc, s) => {
        acc[s.resource_id] = (acc[s.resource_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const readersCounts = readings?.reduce((acc, r) => {
        acc[r.resource_id] = (acc[r.resource_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const highlightsCounts = highlights?.reduce((acc, h) => {
        acc[h.resource_id] = (acc[h.resource_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const embeddingsCounts = embeddings?.reduce((acc, e) => {
        acc[e.resource_id] = (acc[e.resource_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data
      const resourcesWithRelations: ResourceWithRelations[] = (resources || []).map(resource => ({
        id: resource.id,
        title: resource.title,
        author: resource.author,
        type: resource.type,
        level: resource.level,
        subject: resource.subject,
        language: resource.language,
        is_public: resource.is_public || false,
        views_count: resource.views_count || 0,
        audio_available: resource.audio_available || false,
        created_at: resource.created_at || '',
        sections_count: sectionsCounts[resource.id] || 0,
        readers_count: readersCounts[resource.id] || 0,
        highlights_count: highlightsCounts[resource.id] || 0,
        embeddings_count: embeddingsCounts[resource.id] || 0,
      }));

      return resourcesWithRelations;
    },
  });
}

export function useResourceDetails(resourceId: string | null) {
  return useQuery({
    queryKey: ['resource-details', resourceId],
    queryFn: async () => {
      if (!resourceId) return null;

      // Fetch sections
      const { data: sections, error: sectionsError } = await supabase
        .from('resource_sections')
        .select('*')
        .eq('resource_id', resourceId)
        .order('index', { ascending: true });

      if (sectionsError) throw sectionsError;

      // Fetch reading progress
      const { data: readings, error: readingsError } = await supabase
        .from('user_reading')
        .select('*')
        .eq('resource_id', resourceId);

      if (readingsError) throw readingsError;

      // Fetch highlights
      const { data: highlights, error: highlightsError } = await supabase
        .from('user_highlights')
        .select('*')
        .eq('resource_id', resourceId);

      if (highlightsError) throw highlightsError;

      // Fetch embeddings
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('resource_embeddings')
        .select('*')
        .eq('resource_id', resourceId);

      if (embeddingsError) throw embeddingsError;

      return {
        sections: sections as ResourceSection[],
        readings: readings as UserReading[],
        highlights: highlights as UserHighlight[],
        embeddings: embeddings as ResourceEmbedding[],
      };
    },
    enabled: !!resourceId,
  });
}
