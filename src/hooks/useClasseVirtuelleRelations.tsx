import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Types pour les relations
export interface CoursWithRelations {
  id: string;
  titre: string;
  description: string | null;
  statut: string | null;
  created_at: string | null;
  matiere: {
    id: string;
    nom: string;
    couleur: string | null;
  } | null;
  enseignant: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  devoirs: {
    id: string;
    titre: string;
    deadline: string;
    rendus_count: number;
  }[];
  qcms: {
    id: string;
    titre: string;
    tentatives_count: number;
  }[];
  threads: {
    id: string;
    titre: string | null;
    messages_count: number;
  }[];
  classes: {
    id: string;
    nom: string;
    niveau: string;
  }[];
}

// Hook pour récupérer tous les cours avec leurs relations
export const useCoursWithRelations = () => {
  return useQuery({
    queryKey: ["cours-relations"],
    queryFn: async () => {
      // Récupérer les cours avec matière
      const { data: cours, error: coursError } = await supabase
        .from("cours")
        .select(`
          id,
          titre,
          description,
          statut,
          created_at,
          enseignant_id,
          matiere:matieres(id, nom, couleur)
        `)
        .eq("statut", "publie")
        .order("created_at", { ascending: false })
        .limit(50);

      if (coursError) throw coursError;
      if (!cours) return [];

      // Récupérer les enseignants
      const enseignantIds = [...new Set(cours.map(c => c.enseignant_id))];
      const { data: enseignants } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", enseignantIds);

      const enseignantsMap = new Map(
        (enseignants || []).map(e => [e.id, e])
      );

      // Pour chaque cours, récupérer les relations
      const coursWithRelations: CoursWithRelations[] = await Promise.all(
        cours.map(async (c) => {
          // Devoirs du cours
          const { data: devoirs } = await supabase
            .from("devoirs")
            .select(`
              id,
              titre,
              deadline
            `)
            .eq("cours_id", c.id)
            .eq("actif", true);

          // Comptage des rendus pour chaque devoir
          const devoirsWithCounts = await Promise.all(
            (devoirs || []).map(async (d) => {
              const { count } = await supabase
                .from("rendus_devoir")
                .select("id", { count: "exact", head: true })
                .eq("devoir_id", d.id);
              return { ...d, rendus_count: count || 0 };
            })
          );

          // QCMs du cours
          const { data: qcms } = await supabase
            .from("qcms")
            .select(`id, titre`)
            .eq("cours_id", c.id)
            .eq("statut", "publie");

          // Comptage des tentatives pour chaque QCM
          const qcmsWithCounts = await Promise.all(
            (qcms || []).map(async (q) => {
              const { count } = await supabase
                .from("tentatives_qcm")
                .select("id", { count: "exact", head: true })
                .eq("qcm_id", q.id);
              return { ...q, tentatives_count: count || 0 };
            })
          );

          // Threads du cours
          const { data: threads } = await supabase
            .from("threads")
            .select(`id, titre`)
            .eq("cours_id", c.id);

          // Comptage des messages pour chaque thread
          const threadsWithCounts = await Promise.all(
            (threads || []).map(async (t) => {
              const { count } = await supabase
                .from("messages")
                .select("id", { count: "exact", head: true })
                .eq("thread_id", t.id);
              return { ...t, messages_count: count || 0 };
            })
          );

          // Classes associées
          const { data: coursClasses } = await supabase
            .from("cours_classes")
            .select(`
              classe:classes(id, nom, niveau)
            `)
            .eq("cours_id", c.id);

          const enseignant = enseignantsMap.get(c.enseignant_id) || null;

          return {
            id: c.id,
            titre: c.titre,
            description: c.description,
            statut: c.statut,
            created_at: c.created_at,
            matiere: c.matiere as CoursWithRelations["matiere"],
            enseignant,
            devoirs: devoirsWithCounts,
            qcms: qcmsWithCounts,
            threads: threadsWithCounts,
            classes: (coursClasses || [])
              .map((cc: any) => cc.classe)
              .filter(Boolean),
          };
        })
      );

      return coursWithRelations;
    },
  });
};

// Hook pour récupérer un cours spécifique avec toutes ses relations
export const useCoursDetails = (coursId?: string) => {
  return useQuery({
    queryKey: ["cours-details", coursId],
    queryFn: async () => {
      if (!coursId) throw new Error("Cours ID requis");

      // Cours de base
      const { data: cours, error } = await supabase
        .from("cours")
        .select(`
          *,
          matiere:matieres(*)
        `)
        .eq("id", coursId)
        .single();

      if (error) throw error;

      // Récupérer l'enseignant
      const { data: enseignant } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", cours.enseignant_id)
        .single();

      // Devoirs
      const { data: devoirsData } = await supabase
        .from("devoirs")
        .select(`*`)
        .eq("cours_id", coursId);

      // Pour chaque devoir, récupérer les rendus avec les élèves
      const devoirs = await Promise.all(
        (devoirsData || []).map(async (d) => {
          const { data: rendus } = await supabase
            .from("rendus_devoir")
            .select("id, eleve_id, statut, note")
            .eq("devoir_id", d.id);

          // Récupérer les profils des élèves
          const eleveIds = (rendus || []).map(r => r.eleve_id);
          const { data: eleves } = eleveIds.length > 0 
            ? await supabase.from("profiles").select("id, first_name, last_name").in("id", eleveIds)
            : { data: [] };

          const elevesMap = new Map((eleves || []).map(e => [e.id, e]));

          return {
            ...d,
            rendus: (rendus || []).map(r => ({
              ...r,
              eleve: elevesMap.get(r.eleve_id) || null
            }))
          };
        })
      );

      // QCMs
      const { data: qcmsData } = await supabase
        .from("qcms")
        .select(`*`)
        .eq("cours_id", coursId);

      // Pour chaque QCM, récupérer les tentatives et questions
      const qcms = await Promise.all(
        (qcmsData || []).map(async (q) => {
          const [tentativesResult, questionsResult] = await Promise.all([
            supabase.from("tentatives_qcm").select("id, eleve_id, score, submitted_at").eq("qcm_id", q.id),
            supabase.from("questions").select("id", { count: "exact" }).eq("qcm_id", q.id)
          ]);

          const tentatives = tentativesResult.data || [];
          const eleveIds = tentatives.map(t => t.eleve_id);
          const { data: eleves } = eleveIds.length > 0 
            ? await supabase.from("profiles").select("id, first_name, last_name").in("id", eleveIds)
            : { data: [] };

          const elevesMap = new Map((eleves || []).map(e => [e.id, e]));

          return {
            ...q,
            tentatives: tentatives.map(t => ({
              ...t,
              eleve: elevesMap.get(t.eleve_id) || null
            })),
            questions_count: questionsResult.count || 0
          };
        })
      );

      // Threads avec messages
      const { data: threadsData } = await supabase
        .from("threads")
        .select(`*`)
        .eq("cours_id", coursId);

      const threads = await Promise.all(
        (threadsData || []).map(async (t) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("id, contenu, created_at, author_id")
            .eq("thread_id", t.id)
            .order("created_at", { ascending: false })
            .limit(10);

          const authorIds = [...new Set((messages || []).map(m => m.author_id).filter(Boolean))];
          const { data: authors } = authorIds.length > 0
            ? await supabase.from("profiles").select("id, first_name, last_name").in("id", authorIds as string[])
            : { data: [] };

          const authorsMap = new Map((authors || []).map(a => [a.id, a]));

          return {
            ...t,
            messages: (messages || []).map(m => ({
              ...m,
              author: m.author_id ? authorsMap.get(m.author_id) || null : null
            }))
          };
        })
      );

      // Classes
      const { data: classes } = await supabase
        .from("cours_classes")
        .select(`classe:classes(*)`)
        .eq("cours_id", coursId);

      return {
        cours: { ...cours, enseignant },
        devoirs,
        qcms,
        threads,
        classes: (classes || []).map((c: any) => c.classe).filter(Boolean),
      };
    },
    enabled: !!coursId,
  });
};

// Hook pour les statistiques de la classe virtuelle
export const useClasseVirtuelleStats = () => {
  return useQuery({
    queryKey: ["classe-virtuelle-stats"],
    queryFn: async () => {
      const [coursResult, devoirsResult, qcmsResult, rendusResult, tentativesResult] = await Promise.all([
        supabase.from("cours").select("id", { count: "exact" }).eq("statut", "publie"),
        supabase.from("devoirs").select("id", { count: "exact" }).eq("actif", true),
        supabase.from("qcms").select("id", { count: "exact" }).eq("statut", "publie"),
        supabase.from("rendus_devoir").select("id", { count: "exact" }),
        supabase.from("tentatives_qcm").select("id", { count: "exact" }),
      ]);

      return {
        coursCount: coursResult.count || 0,
        devoirsCount: devoirsResult.count || 0,
        qcmsCount: qcmsResult.count || 0,
        rendusCount: rendusResult.count || 0,
        tentativesCount: tentativesResult.count || 0,
      };
    },
  });
};
