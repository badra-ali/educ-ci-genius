import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Cours {
  id: string;
  titre: string;
  description: string | null;
  contenu_json: any;
  matiere_id: string;
  enseignant_id: string;
  etablissement_id: string;
  visio_url: string | null;
  objectifs: string[] | null;
  prerequis: string[] | null;
  statut: 'brouillon' | 'publie' | 'archive';
  created_at: string;
  updated_at: string;
  matieres?: { nom: string; code: string };
  profiles?: { first_name: string; last_name: string };
}

export const useCours = (coursId?: string) => {
  const [cours, setCours] = useState<Cours | null>(null);
  const [coursList, setCoursList] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger un cours spécifique
  const fetchCours = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("cours")
        .select(`
          *,
          matieres (nom, code),
          profiles (first_name, last_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setCours(data as any);
    } catch (error: any) {
      console.error("Erreur chargement cours:", error);
      toast.error("Impossible de charger le cours");
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des cours (avec filtres optionnels)
  const fetchCoursList = async (filters?: {
    classeId?: string;
    matiereId?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      let query = supabase
        .from("cours")
        .select(`
          *,
          matieres (nom, code),
          profiles (first_name, last_name)
        `)
        .eq("statut", "publie")
        .order("created_at", { ascending: false });

      if (filters?.matiereId) {
        query = query.eq("matiere_id", filters.matiereId);
      }

      if (filters?.search) {
        query = query.ilike("titre", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCoursList(data as any);
    } catch (error: any) {
      console.error("Erreur chargement liste cours:", error);
      toast.error("Impossible de charger les cours");
    } finally {
      setLoading(false);
    }
  };

  // Créer un nouveau cours
  const createCours = async (coursData: Partial<Cours>) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("cours")
        .insert({
          ...coursData,
          enseignant_id: userData.user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      toast.success("Cours créé avec succès");
      return data as Cours;
    } catch (error: any) {
      console.error("Erreur création cours:", error);
      toast.error("Impossible de créer le cours");
      return null;
    }
  };

  // Mettre à jour un cours
  const updateCours = async (id: string, updates: Partial<Cours>) => {
    try {
      const { error } = await supabase
        .from("cours")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      toast.success("Cours mis à jour");
      if (coursId === id) {
        await fetchCours(id);
      }
    } catch (error: any) {
      console.error("Erreur mise à jour cours:", error);
      toast.error("Impossible de mettre à jour le cours");
    }
  };

  // Supprimer un cours
  const deleteCours = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cours")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Cours supprimé");
      return true;
    } catch (error: any) {
      console.error("Erreur suppression cours:", error);
      toast.error("Impossible de supprimer le cours");
      return false;
    }
  };

  // Charger automatiquement si coursId fourni
  useEffect(() => {
    if (coursId) {
      fetchCours(coursId);
    }
  }, [coursId]);

  return {
    cours,
    coursList,
    loading,
    fetchCours,
    fetchCoursList,
    createCours,
    updateCours,
    deleteCours,
  };
};
