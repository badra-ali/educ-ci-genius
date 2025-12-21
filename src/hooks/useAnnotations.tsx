import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Highlight {
  id: string;
  user_id: string;
  resource_id: string;
  locator: string;
  text: string | null;
  color: string;
  note: string | null;
  created_at: string;
}

export const HIGHLIGHT_COLORS = [
  { name: "Jaune", value: "#FFEB3B" },
  { name: "Vert", value: "#4CAF50" },
  { name: "Bleu", value: "#2196F3" },
  { name: "Rose", value: "#E91E63" },
  { name: "Orange", value: "#FF9800" },
  { name: "Violet", value: "#9C27B0" },
];

// Hook pour récupérer les annotations d'une ressource
export const useHighlights = (resourceId: string) => {
  return useQuery({
    queryKey: ["highlights", resourceId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_highlights")
        .select("*")
        .eq("user_id", user.id)
        .eq("resource_id", resourceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Highlight[];
    },
    enabled: !!resourceId,
  });
};

// Hook pour créer un surlignage
export const useCreateHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      resourceId,
      locator,
      text,
      color,
      note,
    }: {
      resourceId: string;
      locator: string;
      text?: string;
      color?: string;
      note?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("user_highlights")
        .insert({
          user_id: user.id,
          resource_id: resourceId,
          locator,
          text: text || null,
          color: color || "#FFEB3B",
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Highlight;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", data.resource_id] });
      toast.success("Annotation ajoutée");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout de l'annotation");
    },
  });
};

// Hook pour mettre à jour une annotation
export const useUpdateHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      resourceId,
      note,
      color,
    }: {
      id: string;
      resourceId: string;
      note?: string;
      color?: string;
    }) => {
      const updateData: { note?: string; color?: string } = {};
      if (note !== undefined) updateData.note = note;
      if (color !== undefined) updateData.color = color;

      const { data, error } = await supabase
        .from("user_highlights")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, resourceId } as Highlight & { resourceId: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", data.resourceId] });
      toast.success("Annotation mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });
};

// Hook pour supprimer une annotation
export const useDeleteHighlight = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resourceId }: { id: string; resourceId: string }) => {
      const { error } = await supabase
        .from("user_highlights")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { resourceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["highlights", data.resourceId] });
      toast.success("Annotation supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });
};