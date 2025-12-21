import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types pour les relations
export interface EleveWithRelations {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  classe: {
    id: string;
    nom: string;
    niveau: string;
  } | null;
  notes_count: number;
  moyenne: number | null;
  presences_count: number;
  absences_count: number;
  taux_presence: number;
}

export interface EnseignantWithNotes {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  matieres: string[];
  classes: string[];
  notes_count: number;
}

export interface ClasseWithSchedule {
  id: string;
  nom: string;
  niveau: string;
  etablissement: {
    id: string;
    nom: string;
  } | null;
  eleves_count: number;
  schedule_count: number;
  matieres: string[];
}

export interface NoteWithBulletin {
  student_id: string;
  student_name: string;
  periode: string;
  moyenne: number | null;
  notes_count: number;
  has_bulletin: boolean;
  bulletin_id: string | null;
}

// Hook pour les statistiques du suivi scolaire
export const useSuiviScolaireStats = () => {
  return useQuery({
    queryKey: ["suivi-scolaire-stats"],
    queryFn: async () => {
      const [elevesResult, notesResult, presencesResult, schedulesResult, bulletinsResult] = await Promise.all([
        supabase.from("eleve_classes").select("id", { count: "exact" }).eq("actif", true),
        supabase.from("grades").select("id", { count: "exact" }),
        supabase.from("attendance").select("id", { count: "exact" }),
        supabase.from("schedule").select("id", { count: "exact" }),
        supabase.from("report_cards").select("id", { count: "exact" }),
      ]);

      return {
        elevesCount: elevesResult.count || 0,
        notesCount: notesResult.count || 0,
        presencesCount: presencesResult.count || 0,
        schedulesCount: schedulesResult.count || 0,
        bulletinsCount: bulletinsResult.count || 0,
      };
    },
  });
};

// Hook pour récupérer les élèves avec leurs inscriptions, notes et présences
export const useElevesWithRelations = () => {
  return useQuery({
    queryKey: ["eleves-suivi-relations"],
    queryFn: async () => {
      // Récupérer les inscriptions actives
      const { data: inscriptions, error } = await supabase
        .from("eleve_classes")
        .select(`
          user_id,
          classe:classes(id, nom, niveau)
        `)
        .eq("actif", true);

      if (error) throw error;
      if (!inscriptions || inscriptions.length === 0) return [];

      const eleveIds = inscriptions.map(i => i.user_id);

      // Récupérer les profils
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", eleveIds);

      // Récupérer les notes par élève
      const { data: notes } = await supabase
        .from("grades")
        .select("student_id, score, coefficient")
        .in("student_id", eleveIds);

      // Récupérer les présences par élève
      const { data: presences } = await supabase
        .from("attendance")
        .select("student_id, status")
        .in("student_id", eleveIds);

      // Construire les données par élève
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
      const inscriptionsMap = new Map(inscriptions.map(i => [i.user_id, i.classe]));

      // Grouper les notes par élève
      const notesMap = new Map<string, { count: number; scores: number[]; moyenne: number | null }>();
      (notes || []).forEach(n => {
        const current = notesMap.get(n.student_id) || { count: 0, scores: [], moyenne: null };
        current.count++;
        current.scores.push(n.score);
        notesMap.set(n.student_id, current);
      });

      // Calculer les moyennes
      notesMap.forEach((value) => {
        value.moyenne = value.scores.length > 0 
          ? Math.round((value.scores.reduce((a, b) => a + b, 0) / value.scores.length) * 100) / 100
          : null;
      });

      // Grouper les présences par élève
      const presencesMap = new Map<string, { presences: number; absences: number }>();
      (presences || []).forEach(p => {
        const current = presencesMap.get(p.student_id) || { presences: 0, absences: 0 };
        if (p.status === "PRESENT") current.presences++;
        else current.absences++;
        presencesMap.set(p.student_id, current);
      });

      const eleves: EleveWithRelations[] = eleveIds.map(id => {
        const profile = profilesMap.get(id);
        const classe = inscriptionsMap.get(id);
        const noteData = notesMap.get(id) || { count: 0, moyenne: null };
        const presenceData = presencesMap.get(id) || { presences: 0, absences: 0 };
        const total = presenceData.presences + presenceData.absences;

        return {
          id,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          avatar_url: profile?.avatar_url || null,
          classe: classe as EleveWithRelations["classe"],
          notes_count: noteData.count,
          moyenne: noteData.moyenne,
          presences_count: presenceData.presences,
          absences_count: presenceData.absences,
          taux_presence: total > 0 ? Math.round((presenceData.presences / total) * 100) : 100,
        };
      });

      return eleves;
    },
  });
};

// Hook pour récupérer les enseignants avec leurs notes saisies
export const useEnseignantsWithNotes = () => {
  return useQuery({
    queryKey: ["enseignants-notes-relations"],
    queryFn: async () => {
      // Récupérer les enseignants depuis user_roles
      const { data: enseignantRoles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "ENSEIGNANT");

      if (error) throw error;
      if (!enseignantRoles || enseignantRoles.length === 0) return [];

      const enseignantIds = enseignantRoles.map(e => e.user_id);

      // Récupérer les profils
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, avatar_url")
        .in("id", enseignantIds);

      // Récupérer les affectations (matières et classes)
      const { data: affectations } = await supabase
        .from("enseignant_matieres")
        .select(`
          user_id,
          matiere:matieres(nom),
          classe:classes(nom)
        `)
        .in("user_id", enseignantIds)
        .eq("annee_scolaire", "2024-2025");

      // Récupérer les notes saisies par enseignant
      const { data: notes } = await supabase
        .from("grades")
        .select("teacher_id")
        .in("teacher_id", enseignantIds);

      // Grouper les données
      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));
      
      const affectationsMap = new Map<string, { matieres: Set<string>; classes: Set<string> }>();
      (affectations || []).forEach(a => {
        const current = affectationsMap.get(a.user_id) || { matieres: new Set(), classes: new Set() };
        if (a.matiere) current.matieres.add((a.matiere as any).nom);
        if (a.classe) current.classes.add((a.classe as any).nom);
        affectationsMap.set(a.user_id, current);
      });

      const notesCountMap = new Map<string, number>();
      (notes || []).forEach(n => {
        notesCountMap.set(n.teacher_id, (notesCountMap.get(n.teacher_id) || 0) + 1);
      });

      const enseignants: EnseignantWithNotes[] = enseignantIds.map(id => {
        const profile = profilesMap.get(id);
        const aff = affectationsMap.get(id);
        return {
          id,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          avatar_url: profile?.avatar_url || null,
          matieres: aff ? Array.from(aff.matieres) : [],
          classes: aff ? Array.from(aff.classes) : [],
          notes_count: notesCountMap.get(id) || 0,
        };
      });

      return enseignants;
    },
  });
};

// Hook pour récupérer les classes avec leur emploi du temps
export const useClassesWithSchedule = () => {
  return useQuery({
    queryKey: ["classes-schedule-relations"],
    queryFn: async () => {
      // Récupérer les classes actives
      const { data: classes, error } = await supabase
        .from("classes")
        .select(`
          id,
          nom,
          niveau,
          etablissement:etablissements(id, nom)
        `)
        .eq("actif", true)
        .order("niveau");

      if (error) throw error;
      if (!classes) return [];

      const classeIds = classes.map(c => c.id);

      // Compter les élèves par classe
      const { data: elevesData } = await supabase
        .from("eleve_classes")
        .select("classe_id")
        .in("classe_id", classeIds)
        .eq("actif", true);

      const elevesCountMap = new Map<string, number>();
      (elevesData || []).forEach(e => {
        elevesCountMap.set(e.classe_id, (elevesCountMap.get(e.classe_id) || 0) + 1);
      });

      // Récupérer les emplois du temps
      const { data: schedules } = await supabase
        .from("schedule")
        .select(`
          classe_id,
          matiere:matieres(nom)
        `)
        .in("classe_id", classeIds);

      const scheduleMap = new Map<string, { count: number; matieres: Set<string> }>();
      (schedules || []).forEach(s => {
        const current = scheduleMap.get(s.classe_id) || { count: 0, matieres: new Set() };
        current.count++;
        if (s.matiere) current.matieres.add((s.matiere as any).nom);
        scheduleMap.set(s.classe_id, current);
      });

      const result: ClasseWithSchedule[] = classes.map(c => {
        const scheduleData = scheduleMap.get(c.id);
        return {
          id: c.id,
          nom: c.nom,
          niveau: c.niveau,
          etablissement: c.etablissement as ClasseWithSchedule["etablissement"],
          eleves_count: elevesCountMap.get(c.id) || 0,
          schedule_count: scheduleData?.count || 0,
          matieres: scheduleData ? Array.from(scheduleData.matieres) : [],
        };
      });

      return result;
    },
  });
};

// Hook pour récupérer les bulletins avec les notes
export const useNotesWithBulletins = (periode?: string) => {
  return useQuery({
    queryKey: ["notes-bulletins-relations", periode],
    queryFn: async () => {
      // Récupérer les notes groupées par élève et période
      const { data: notes, error } = await supabase
        .from("grades")
        .select("student_id, score, period")
        .eq("validated", true);

      if (error) throw error;
      if (!notes || notes.length === 0) return [];

      // Grouper par élève et période
      const groupedNotes = new Map<string, { student_id: string; periode: string; scores: number[] }>();
      (notes || []).forEach(n => {
        const key = `${n.student_id}-${n.period}`;
        const current = groupedNotes.get(key) || { student_id: n.student_id, periode: n.period, scores: [] };
        current.scores.push(n.score);
        groupedNotes.set(key, current);
      });

      const studentIds = [...new Set(notes.map(n => n.student_id))];

      // Récupérer les profils
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studentIds);

      const profilesMap = new Map((profiles || []).map(p => [p.id, p]));

      // Récupérer les bulletins
      const { data: bulletins } = await supabase
        .from("report_cards")
        .select("id, student_id, period")
        .in("student_id", studentIds);

      const bulletinsMap = new Map<string, string>();
      (bulletins || []).forEach(b => {
        bulletinsMap.set(`${b.student_id}-${b.period}`, b.id);
      });

      const result: NoteWithBulletin[] = Array.from(groupedNotes.values()).map(g => {
        const profile = profilesMap.get(g.student_id);
        const bulletinId = bulletinsMap.get(`${g.student_id}-${g.periode}`);
        const moyenne = g.scores.length > 0 
          ? Math.round((g.scores.reduce((a, b) => a + b, 0) / g.scores.length) * 100) / 100
          : null;

        return {
          student_id: g.student_id,
          student_name: profile ? `${profile.first_name} ${profile.last_name}` : "Inconnu",
          periode: g.periode,
          moyenne,
          notes_count: g.scores.length,
          has_bulletin: !!bulletinId,
          bulletin_id: bulletinId || null,
        };
      });

      // Filtrer par période si spécifiée
      if (periode) {
        return result.filter(r => r.periode === periode);
      }

      return result;
    },
  });
};

// Hook pour récupérer le détail d'un élève
export const useEleveDetails = (eleveId?: string) => {
  return useQuery({
    queryKey: ["eleve-suivi-details", eleveId],
    queryFn: async () => {
      if (!eleveId) throw new Error("Élève ID requis");

      // Profil
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", eleveId)
        .single();

      if (error) throw error;

      // Classe
      const { data: inscription } = await supabase
        .from("eleve_classes")
        .select(`classe:classes(*)`)
        .eq("user_id", eleveId)
        .eq("actif", true)
        .single();

      // Notes avec matières
      const { data: notesData } = await supabase
        .from("grades")
        .select(`
          id,
          score,
          coefficient,
          period,
          comment,
          created_at,
          matiere_id
        `)
        .eq("student_id", eleveId)
        .order("created_at", { ascending: false });

      // Récupérer les matières
      const matiereIds = [...new Set((notesData || []).map(n => n.matiere_id))];
      const { data: matieres } = matiereIds.length > 0
        ? await supabase.from("matieres").select("id, nom, couleur").in("id", matiereIds)
        : { data: [] };

      const matieresMap = new Map((matieres || []).map(m => [m.id, m]));

      const notes = (notesData || []).map(n => ({
        ...n,
        matiere: matieresMap.get(n.matiere_id) || null,
      }));

      // Présences
      const { data: presences } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", eleveId)
        .order("date", { ascending: false })
        .limit(30);

      // Bulletins
      const { data: bulletins } = await supabase
        .from("report_cards")
        .select("*")
        .eq("student_id", eleveId)
        .order("period");

      return {
        profile,
        classe: inscription?.classe || null,
        notes,
        presences: presences || [],
        bulletins: bulletins || [],
      };
    },
    enabled: !!eleveId,
  });
};
