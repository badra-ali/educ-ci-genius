import { supabase } from "@/integrations/supabase/client";
import type { Cours } from "../types";

export const coursService = {
  /**
   * Récupérer un cours par son ID
   */
  async getCours(id: string) {
    const { data, error } = await supabase
      .from("cours")
      .select(`
        *,
        matieres (nom, code)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as unknown as Cours;
  },

  /**
   * Récupérer la liste des cours avec filtres optionnels
   */
  async getCoursList(filters?: {
    classeId?: string;
    matiereId?: string;
    search?: string;
    statut?: string;
  }) {
    let query = supabase
      .from("cours")
      .select(`
        *,
        matieres (nom, code)
      `)
      .order("created_at", { ascending: false });

    if (filters?.statut) {
      query = query.eq("statut", filters.statut);
    } else {
      query = query.eq("statut", "publie");
    }

    if (filters?.matiereId) {
      query = query.eq("matiere_id", filters.matiereId);
    }

    if (filters?.search) {
      query = query.ilike("titre", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Cours[];
  },

  /**
   * Créer un nouveau cours
   */
  async createCours(coursData: Partial<Cours>) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error("Non authentifié");

    const { data, error } = await supabase
      .from("cours")
      .insert([
        {
          ...coursData,
          enseignant_id: userData.user.id,
        } as any,
      ])
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Cours;
  },

  /**
   * Mettre à jour un cours
   */
  async updateCours(id: string, updates: Partial<Cours>) {
    const { data, error } = await supabase
      .from("cours")
      .update(updates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Cours;
  },

  /**
   * Supprimer un cours
   */
  async deleteCours(id: string) {
    const { error } = await supabase.from("cours").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
