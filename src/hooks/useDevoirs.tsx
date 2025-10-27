import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Devoir {
  id: string;
  titre: string;
  consignes: string;
  cours_id: string;
  etablissement_id: string;
  deadline: string;
  note_sur: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface RenduDevoir {
  id: string;
  devoir_id: string;
  eleve_id: string;
  texte: string | null;
  note: number | null;
  commentaire_prof: string | null;
  statut: 'assigne' | 'rendu' | 'en_retard' | 'note';
  created_at: string;
  updated_at: string;
  rendu_at: string | null;
  note_at: string | null;
  profiles?: { first_name: string; last_name: string };
}

export const useDevoirs = (devoirId?: string) => {
  const [devoir, setDevoir] = useState<Devoir | null>(null);
  const [devoirsList, setDevoirsList] = useState<Devoir[]>([]);
  const [rendus, setRendus] = useState<RenduDevoir[]>([]);
  const [monRendu, setMonRendu] = useState<RenduDevoir | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger un devoir
  const fetchDevoir = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("devoirs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setDevoir(data);
    } catch (error: any) {
      console.error("Erreur chargement devoir:", error);
      toast.error("Impossible de charger le devoir");
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des devoirs
  const fetchDevoirsList = async (filters?: { coursId?: string; statut?: string }) => {
    try {
      setLoading(true);
      let query = supabase
        .from("devoirs")
        .select("*")
        .eq("actif", true)
        .order("deadline", { ascending: true });

      if (filters?.coursId) {
        query = query.eq("cours_id", filters.coursId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDevoirsList(data);
    } catch (error: any) {
      console.error("Erreur chargement devoirs:", error);
      toast.error("Impossible de charger les devoirs");
    } finally {
      setLoading(false);
    }
  };

  // Créer un devoir
  const createDevoir = async (devoirData: Partial<Devoir>) => {
    try {
      const { data, error } = await supabase
        .from("devoirs")
        .insert(devoirData as any)
        .select()
        .single();

      if (error) throw error;
      toast.success("Devoir créé avec succès");
      return data as Devoir;
    } catch (error: any) {
      console.error("Erreur création devoir:", error);
      toast.error("Impossible de créer le devoir");
      return null;
    }
  };

  // Récupérer mon rendu (pour un élève)
  const fetchMonRendu = async (devoirId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("rendus_devoir")
        .select("*")
        .eq("devoir_id", devoirId)
        .eq("eleve_id", userData.user.id)
        .maybeSingle();

      if (error) throw error;
      setMonRendu(data as RenduDevoir | null);
      return data;
    } catch (error: any) {
      console.error("Erreur chargement rendu:", error);
    }
  };

  // Soumettre/Mettre à jour un rendu
  const submitRendu = async (
    devoirId: string,
    texte: string,
    fichiers?: string[]
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { data: devoirData } = await supabase
        .from("devoirs")
        .select("deadline")
        .eq("id", devoirId)
        .single();

      const isLate = devoirData && new Date() > new Date(devoirData.deadline);
      const statut = isLate ? 'en_retard' : 'rendu';

      // Vérifier si un rendu existe déjà
      const { data: existingRendu } = await supabase
        .from("rendus_devoir")
        .select("id")
        .eq("devoir_id", devoirId)
        .eq("eleve_id", userData.user.id)
        .maybeSingle();

      if (existingRendu) {
        // Mettre à jour
        const { error } = await supabase
          .from("rendus_devoir")
          .update({
            texte,
            statut,
            rendu_at: new Date().toISOString(),
          })
          .eq("id", existingRendu.id);

        if (error) throw error;
      } else {
        // Créer
        const { error } = await supabase
          .from("rendus_devoir")
          .insert({
            devoir_id: devoirId,
            eleve_id: userData.user.id,
            texte,
            statut,
            rendu_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success("Rendu soumis avec succès");
      await fetchMonRendu(devoirId);
    } catch (error: any) {
      console.error("Erreur soumission rendu:", error);
      toast.error("Impossible de soumettre le rendu");
    }
  };

  // Récupérer tous les rendus (pour enseignant)
  const fetchRendus = async (devoirId: string) => {
    try {
      const { data, error } = await supabase
        .from("rendus_devoir")
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .eq("devoir_id", devoirId)
        .order("rendu_at", { ascending: false });

      if (error) throw error;
      setRendus(data as any);
    } catch (error: any) {
      console.error("Erreur chargement rendus:", error);
      toast.error("Impossible de charger les rendus");
    }
  };

  // Noter un rendu
  const noterRendu = async (
    renduId: string,
    note: number,
    commentaire: string
  ) => {
    try {
      const { error } = await supabase
        .from("rendus_devoir")
        .update({
          note,
          commentaire_prof: commentaire,
          statut: 'note',
          note_at: new Date().toISOString(),
        })
        .eq("id", renduId);

      if (error) throw error;
      toast.success("Rendu noté avec succès");
      if (devoir) {
        await fetchRendus(devoir.id);
      }
    } catch (error: any) {
      console.error("Erreur notation rendu:", error);
      toast.error("Impossible de noter le rendu");
    }
  };

  useEffect(() => {
    if (devoirId) {
      fetchDevoir(devoirId);
      fetchMonRendu(devoirId);
    }
  }, [devoirId]);

  return {
    devoir,
    devoirsList,
    rendus,
    monRendu,
    loading,
    fetchDevoir,
    fetchDevoirsList,
    createDevoir,
    fetchMonRendu,
    submitRendu,
    fetchRendus,
    noterRendu,
  };
};
