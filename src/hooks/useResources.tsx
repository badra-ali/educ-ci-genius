import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Resource {
  id: string;
  title: string;
  author: string;
  type: 'Livre' | 'Cours' | 'Exercice' | 'Article';
  level: 'Primaire' | 'Collège' | 'Lycée';
  subject: string;
  language: 'FR' | 'EN';
  summary?: string;
  tags: string[];
  cover_url?: string;
  file_type?: 'pdf' | 'epub' | 'html';
  file_url?: string;
  audio_available: boolean;
  is_public: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  query?: string;
  level?: string;
  subject?: string;
  type?: string;
  audioOnly?: boolean;
}

export const useResources = (filters?: SearchFilters) => {
  return useQuery({
    queryKey: ["resources", filters],
    queryFn: async () => {
      let query = supabase
        .from("resources")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (filters?.level && filters.level !== 'Tous') {
        query = query.eq("level", filters.level);
      }

      if (filters?.subject) {
        query = query.eq("subject", filters.subject);
      }

      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      if (filters?.audioOnly) {
        query = query.eq("audio_available", true);
      }

      if (filters?.query) {
        query = query.or(`title.ilike.%${filters.query}%,author.ilike.%${filters.query}%,summary.ilike.%${filters.query}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Resource[];
    },
  });
};

export const useResource = (id: string) => {
  return useQuery({
    queryKey: ["resource", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Resource;
    },
    enabled: !!id,
  });
};

export const useUserShelves = () => {
  return useQuery({
    queryKey: ["user-shelves"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_shelves")
        .select(`
          *,
          resources:resource_id (*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data;
    },
  });
};

export const useAddToShelf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, shelf }: { resourceId: string; shelf: 'FAVORI' | 'A_LIRE' | 'HORS_LIGNE' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_shelves")
        .insert({
          user_id: user.id,
          resource_id: resourceId,
          shelf,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Déjà dans cette liste");
        }
        throw error;
      }
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-shelves"] });
      const shelfNames = {
        'FAVORI': 'favoris',
        'A_LIRE': '"à lire"',
        'HORS_LIGNE': '"hors-ligne"'
      };
      toast.success(`Ajouté à ${shelfNames[variables.shelf]}`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erreur lors de l'ajout");
    },
  });
};

export const useRemoveFromShelf = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resourceId, shelf }: { resourceId: string; shelf: 'FAVORI' | 'A_LIRE' | 'HORS_LIGNE' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_shelves")
        .delete()
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .eq("shelf", shelf);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-shelves"] });
      toast.success("Retiré de la liste");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};

export const useReadingProgress = (resourceId: string) => {
  return useQuery({
    queryKey: ["reading-progress", resourceId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_reading")
        .select("*")
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!resourceId,
  });
};

export const useUpdateReadingProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      resourceId, 
      locator, 
      progress 
    }: { 
      resourceId: string; 
      locator: string; 
      progress: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_reading")
        .upsert({
          user_id: user.id,
          resource_id: resourceId,
          last_locator: locator,
          progress_percent: progress,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reading-progress", variables.resourceId] });
    },
  });
};
