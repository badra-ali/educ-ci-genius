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
  statut: "assigne" | "rendu" | "en_retard" | "note";
  created_at: string;
  updated_at: string;
  rendu_at: string | null;
  note_at: string | null;
  profiles?: { first_name: string; last_name: string };
}

export interface DevoirsFilters {
  coursId?: string;
  statut?: string;
}
