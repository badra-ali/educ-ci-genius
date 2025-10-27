import { supabase } from "@/integrations/supabase/client";
import type { Devoir, RenduDevoir } from "../types";

export const devoirsService = {
  /**
   * Récupérer un devoir par son ID
   */
  async getDevoir(id: string) {
    const { data, error } = await supabase
      .from("devoirs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Devoir;
  },

  /**
   * Récupérer la liste des devoirs
   */
  async getDevoirsList(filters?: { coursId?: string; statut?: string }) {
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
    return data as Devoir[];
  },

  /**
   * Créer un nouveau devoir
   */
  async createDevoir(devoirData: Partial<Devoir>) {
    const { data, error } = await supabase
      .from("devoirs")
      .insert([devoirData as any])
      .select()
      .single();

    if (error) throw error;
    return data as Devoir;
  },

  /**
   * Récupérer le rendu d'un élève pour un devoir
   */
  async getMonRendu(devoirId: string, eleveId: string) {
    const { data, error } = await supabase
      .from("rendus_devoir")
      .select("*")
      .eq("devoir_id", devoirId)
      .eq("eleve_id", eleveId)
      .maybeSingle();

    if (error) throw error;
    return data as RenduDevoir | null;
  },

  /**
   * Soumettre ou mettre à jour un rendu
   */
  async submitRendu(devoirId: string, eleveId: string, texte: string) {
    // Vérifier si le devoir a dépassé la deadline
    const { data: devoirData } = await supabase
      .from("devoirs")
      .select("deadline")
      .eq("id", devoirId)
      .single();

    const isLate = devoirData && new Date() > new Date(devoirData.deadline);
    const statut = isLate ? "en_retard" : "rendu";

    // Vérifier si un rendu existe déjà
    const { data: existingRendu } = await supabase
      .from("rendus_devoir")
      .select("id")
      .eq("devoir_id", devoirId)
      .eq("eleve_id", eleveId)
      .maybeSingle();

    if (existingRendu) {
      // Mettre à jour
      const { data, error } = await supabase
        .from("rendus_devoir")
        .update({
          texte,
          statut,
          rendu_at: new Date().toISOString(),
        })
        .eq("id", existingRendu.id)
        .select()
        .single();

      if (error) throw error;
      return data as RenduDevoir;
    } else {
      // Créer
      const { data, error } = await supabase
        .from("rendus_devoir")
        .insert({
          devoir_id: devoirId,
          eleve_id: eleveId,
          texte,
          statut,
          rendu_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as RenduDevoir;
    }
  },

  /**
   * Récupérer tous les rendus d'un devoir (pour enseignant)
   */
  async getRendus(devoirId: string) {
    const { data, error } = await supabase
      .from("rendus_devoir")
      .select("*")
      .eq("devoir_id", devoirId)
      .order("rendu_at", { ascending: false });

    if (error) throw error;
    return data as RenduDevoir[];
  },

  /**
   * Noter un rendu
   */
  async noterRendu(renduId: string, note: number, commentaire: string) {
    const { data, error } = await supabase
      .from("rendus_devoir")
      .update({
        note,
        commentaire_prof: commentaire,
        statut: "note",
        note_at: new Date().toISOString(),
      })
      .eq("id", renduId)
      .select()
      .single();

    if (error) throw error;
    return data as RenduDevoir;
  },
};
