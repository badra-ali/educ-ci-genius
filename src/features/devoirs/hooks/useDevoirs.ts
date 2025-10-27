import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { devoirsService } from "../services/devoirsService";
import type { Devoir, RenduDevoir, DevoirsFilters } from "../types";

// Query keys
export const devoirsKeys = {
  all: ["devoirs"] as const,
  lists: () => [...devoirsKeys.all, "list"] as const,
  list: (filters?: DevoirsFilters) => [...devoirsKeys.lists(), filters] as const,
  details: () => [...devoirsKeys.all, "detail"] as const,
  detail: (id: string) => [...devoirsKeys.details(), id] as const,
  rendus: (devoirId: string) => [...devoirsKeys.detail(devoirId), "rendus"] as const,
  monRendu: (devoirId: string, eleveId: string) =>
    [...devoirsKeys.detail(devoirId), "monRendu", eleveId] as const,
};

/**
 * Hook pour récupérer un devoir
 */
export function useDevoir(id?: string) {
  return useQuery({
    queryKey: devoirsKeys.detail(id!),
    queryFn: () => devoirsService.getDevoir(id!),
    enabled: !!id,
  });
}

/**
 * Hook pour récupérer la liste des devoirs
 */
export function useDevoirsList(filters?: DevoirsFilters) {
  return useQuery({
    queryKey: devoirsKeys.list(filters),
    queryFn: () => devoirsService.getDevoirsList(filters),
  });
}

/**
 * Hook pour créer un devoir
 */
export function useCreateDevoir() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Devoir>) => devoirsService.createDevoir(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: devoirsKeys.lists() });
      toast.success("Devoir créé avec succès");
    },
    onError: (error: Error) => {
      console.error("Erreur création devoir:", error);
      toast.error("Impossible de créer le devoir");
    },
  });
}

/**
 * Hook pour récupérer le rendu d'un élève
 */
export function useMonRendu(devoirId?: string) {
  return useQuery({
    queryKey: devoirsKeys.monRendu(devoirId!, "current"),
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");
      return devoirsService.getMonRendu(devoirId!, userData.user.id);
    },
    enabled: !!devoirId,
  });
}

/**
 * Hook pour soumettre un rendu
 */
export function useSubmitRendu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ devoirId, texte }: { devoirId: string; texte: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");
      return devoirsService.submitRendu(devoirId, userData.user.id, texte);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: devoirsKeys.monRendu(variables.devoirId, "current"),
      });
      toast.success("Rendu soumis avec succès");
    },
    onError: (error: Error) => {
      console.error("Erreur soumission rendu:", error);
      toast.error("Impossible de soumettre le rendu");
    },
  });
}

/**
 * Hook pour récupérer tous les rendus (enseignant)
 */
export function useRendus(devoirId?: string) {
  return useQuery({
    queryKey: devoirsKeys.rendus(devoirId!),
    queryFn: () => devoirsService.getRendus(devoirId!),
    enabled: !!devoirId,
  });
}

/**
 * Hook pour noter un rendu
 */
export function useNoterRendu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      renduId,
      note,
      commentaire,
      devoirId,
    }: {
      renduId: string;
      note: number;
      commentaire: string;
      devoirId: string;
    }) => devoirsService.noterRendu(renduId, note, commentaire),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: devoirsKeys.rendus(variables.devoirId) });
      toast.success("Rendu noté avec succès");
    },
    onError: (error: Error) => {
      console.error("Erreur notation rendu:", error);
      toast.error("Impossible de noter le rendu");
    },
  });
}
