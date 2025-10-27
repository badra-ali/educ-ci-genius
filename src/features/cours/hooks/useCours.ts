import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { coursService } from "../services/coursService";
import type { Cours, CoursFilters } from "../types";

// Query keys
export const coursKeys = {
  all: ["cours"] as const,
  lists: () => [...coursKeys.all, "list"] as const,
  list: (filters?: CoursFilters) => [...coursKeys.lists(), filters] as const,
  details: () => [...coursKeys.all, "detail"] as const,
  detail: (id: string) => [...coursKeys.details(), id] as const,
};

/**
 * Hook pour récupérer un cours spécifique
 */
export function useCours(id?: string) {
  return useQuery({
    queryKey: coursKeys.detail(id!),
    queryFn: () => coursService.getCours(id!),
    enabled: !!id,
  });
}

/**
 * Hook pour récupérer la liste des cours
 */
export function useCoursList(filters?: CoursFilters) {
  return useQuery({
    queryKey: coursKeys.list(filters),
    queryFn: () => coursService.getCoursList(filters),
  });
}

/**
 * Hook pour créer un cours
 */
export function useCreateCours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Cours>) => coursService.createCours(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursKeys.lists() });
      toast.success("Cours créé avec succès");
    },
    onError: (error: Error) => {
      console.error("Erreur création cours:", error);
      toast.error("Impossible de créer le cours");
    },
  });
}

/**
 * Hook pour mettre à jour un cours
 */
export function useUpdateCours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Cours> }) =>
      coursService.updateCours(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: coursKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: coursKeys.lists() });
      toast.success("Cours mis à jour");
    },
    onError: (error: Error) => {
      console.error("Erreur mise à jour cours:", error);
      toast.error("Impossible de mettre à jour le cours");
    },
  });
}

/**
 * Hook pour supprimer un cours
 */
export function useDeleteCours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => coursService.deleteCours(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursKeys.lists() });
      toast.success("Cours supprimé");
    },
    onError: (error: Error) => {
      console.error("Erreur suppression cours:", error);
      toast.error("Impossible de supprimer le cours");
    },
  });
}
