import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Hook pour récupérer un élève avec toutes ses relations
export const useEleve = (eleveId?: string) => {
  return useQuery({
    queryKey: ["eleve", eleveId],
    queryFn: async () => {
      if (!eleveId) throw new Error("Élève ID requis");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", eleveId)
        .single();

      if (profileError) throw profileError;

      // Classe actuelle
      const { data: eleveClasse } = await supabase
        .from("eleve_classes")
        .select(`
          *,
          classe:classes(
            *,
            etablissement:etablissements(*)
          )
        `)
        .eq("user_id", eleveId)
        .eq("actif", true)
        .single();

      // Parents
      const { data: parents } = await supabase
        .from("parent_eleves")
        .select(`
          *,
          parent:profiles!parent_eleves_parent_id_fkey(*)
        `)
        .eq("eleve_id", eleveId);

      // Enseignants (via la classe)
      let enseignants: any[] = [];
      if (eleveClasse?.classe_id) {
        const { data } = await supabase
          .from("enseignant_matieres")
          .select(`
            *,
            enseignant:profiles!enseignant_matieres_user_id_fkey(*),
            matiere:matieres(*)
          `)
          .eq("classe_id", eleveClasse.classe_id)
          .eq("annee_scolaire", eleveClasse.annee_scolaire);
        
        enseignants = data || [];
      }

      return {
        profile,
        classe: eleveClasse?.classe || null,
        parents: parents || [],
        enseignants,
      };
    },
    enabled: !!eleveId,
  });
};

// Hook pour récupérer un parent avec ses enfants
export const useParent = (parentId?: string) => {
  return useQuery({
    queryKey: ["parent", parentId],
    queryFn: async () => {
      if (!parentId) throw new Error("Parent ID requis");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", parentId)
        .single();

      if (profileError) throw profileError;

      const { data: enfants } = await supabase
        .from("parent_eleves")
        .select(`
          *,
          eleve:profiles!parent_eleves_eleve_id_fkey(*),
          classe:eleve_classes!parent_eleves_eleve_id_fkey(
            classe:classes(
              *,
              etablissement:etablissements(*)
            )
          )
        `)
        .eq("parent_id", parentId);

      return {
        profile,
        enfants: enfants || [],
      };
    },
    enabled: !!parentId,
  });
};

// Hook pour récupérer un enseignant avec ses classes
export const useEnseignant = (enseignantId?: string) => {
  return useQuery({
    queryKey: ["enseignant", enseignantId],
    queryFn: async () => {
      if (!enseignantId) throw new Error("Enseignant ID requis");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", enseignantId)
        .single();

      if (profileError) throw profileError;

      const { data: affectations } = await supabase
        .from("enseignant_matieres")
        .select(`
          *,
          matiere:matieres(*),
          classe:classes(*)
        `)
        .eq("user_id", enseignantId)
        .eq("annee_scolaire", "2024-2025");

      return {
        profile,
        affectations: affectations || [],
      };
    },
    enabled: !!enseignantId,
  });
};

// Hook pour récupérer une classe avec élèves et enseignants
export const useClasse = (classeId?: string) => {
  return useQuery({
    queryKey: ["classe", classeId],
    queryFn: async () => {
      if (!classeId) throw new Error("Classe ID requis");

      const { data: classe, error: classeError } = await supabase
        .from("classes")
        .select(`
          *,
          etablissement:etablissements(*)
        `)
        .eq("id", classeId)
        .single();

      if (classeError) throw classeError;

      // Élèves
      const { data: eleves } = await supabase
        .from("eleve_classes")
        .select(`
          *,
          eleve:profiles!eleve_classes_user_id_fkey(*)
        `)
        .eq("classe_id", classeId)
        .eq("actif", true);

      // Enseignants par matière
      const { data: enseignants } = await supabase
        .from("enseignant_matieres")
        .select(`
          *,
          enseignant:profiles!enseignant_matieres_user_id_fkey(*),
          matiere:matieres(*)
        `)
        .eq("classe_id", classeId)
        .eq("annee_scolaire", "2024-2025");

      return {
        classe,
        eleves: eleves || [],
        enseignants: enseignants || [],
      };
    },
    enabled: !!classeId,
  });
};

// Hook pour lier un parent à un élève
export const useLinkParent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eleveId,
      parentId,
      lienParente,
    }: {
      eleveId: string;
      parentId: string;
      lienParente: string;
    }) => {
      const { data, error } = await supabase
        .from("parent_eleves")
        .insert({
          eleve_id: eleveId,
          parent_id: parentId,
          lien_parente: lienParente,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleve"] });
      queryClient.invalidateQueries({ queryKey: ["parent"] });
      toast.success("Parent lié avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la liaison");
    },
  });
};

// Hook pour délier un parent d'un élève
export const useUnlinkParent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("parent_eleves")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleve"] });
      queryClient.invalidateQueries({ queryKey: ["parent"] });
      toast.success("Lien supprimé");
    },
  });
};

// Hook pour affecter un enseignant à une classe/matière
export const useAssignTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enseignantId,
      classeId,
      matiereId,
      principal = false,
    }: {
      enseignantId: string;
      classeId: string;
      matiereId: string;
      principal?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("enseignant_matieres")
        .insert({
          user_id: enseignantId,
          classe_id: classeId,
          matiere_id: matiereId,
          principal,
          annee_scolaire: "2024-2025",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enseignant"] });
      queryClient.invalidateQueries({ queryKey: ["classe"] });
      toast.success("Enseignant affecté avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'affectation");
    },
  });
};

// Hook pour retirer un enseignant d'une classe/matière
export const useUnassignTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("enseignant_matieres")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enseignant"] });
      queryClient.invalidateQueries({ queryKey: ["classe"] });
      toast.success("Affectation supprimée");
    },
  });
};

// Hook pour inscrire un élève dans une classe
export const useEnrollStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eleveId,
      classeId,
    }: {
      eleveId: string;
      classeId: string;
    }) => {
      // Désactiver les anciennes inscriptions
      await supabase
        .from("eleve_classes")
        .update({ actif: false })
        .eq("user_id", eleveId);

      // Créer la nouvelle inscription
      const { data, error } = await supabase
        .from("eleve_classes")
        .insert({
          user_id: eleveId,
          classe_id: classeId,
          actif: true,
          annee_scolaire: "2024-2025",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eleve"] });
      queryClient.invalidateQueries({ queryKey: ["classe"] });
      toast.success("Élève inscrit avec succès");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'inscription");
    },
  });
};

// Hook pour lister tous les profils par rôle
export const useProfilesByRole = (role: "ADMIN_ECOLE" | "ADMIN_SYSTEME" | "ELEVE" | "ENSEIGNANT" | "PARENT") => {
  return useQuery({
    queryKey: ["profiles", role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          user_id,
          role,
          profile:profiles(*)
        `)
        .eq("role", role);

      if (error) throw error;
      return data;
    },
  });
};

// Hook pour lister toutes les classes
export const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          etablissement:etablissements(*)
        `)
        .eq("actif", true)
        .order("niveau");

      if (error) throw error;
      return data;
    },
  });
};

// Hook pour lister toutes les matières
export const useMatieres = () => {
  return useQuery({
    queryKey: ["matieres"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matieres")
        .select("*")
        .eq("actif", true)
        .order("nom");

      if (error) throw error;
      return data;
    },
  });
};
