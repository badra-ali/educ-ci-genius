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
  statut: "brouillon" | "publie" | "archive";
  created_at: string;
  updated_at: string;
  matieres?: { nom: string; code: string };
  profiles?: { first_name: string; last_name: string };
}

export interface CoursFilters {
  classeId?: string;
  matiereId?: string;
  search?: string;
  statut?: string;
}
