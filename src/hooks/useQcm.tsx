import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Question {
  id?: string;
  question: string;
  options: string[];
  answer_index: number;
  feedback?: string;
  points?: number;
  ordre: number;
}

export interface Qcm {
  id: string;
  titre: string;
  description: string | null;
  cours_id: string | null;
  cree_par_id: string;
  etablissement_id: string;
  duree_minutes: number | null;
  tags: string[] | null;
  affichage_feedback: 'immediat' | 'fin' | 'jamais';
  melanger_questions: boolean;
  melanger_options: boolean;
  tentatives_max: number | null;
  note_minimale: number | null;
  statut: 'brouillon' | 'publie' | 'archive';
  created_at: string;
  updated_at: string;
}

export interface TentativeQcm {
  id: string;
  qcm_id: string;
  eleve_id: string;
  reponses: any;
  score: number;
  duree_secondes: number | null;
  started_at: string;
  submitted_at: string | null;
}

export const useQcm = (qcmId?: string) => {
  const [qcm, setQcm] = useState<Qcm | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qcmList, setQcmList] = useState<Qcm[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger un QCM avec ses questions
  const fetchQcm = async (id: string) => {
    try {
      setLoading(true);
      const { data: qcmData, error: qcmError } = await supabase
        .from("qcms")
        .select("*")
        .eq("id", id)
        .single();

      if (qcmError) throw qcmError;

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*")
        .eq("qcm_id", id)
        .order("ordre");

      if (questionsError) throw questionsError;

      setQcm(qcmData as Qcm);
      setQuestions(questionsData.map(q => ({
        ...q,
        options: JSON.parse(JSON.stringify(q.options))
      })));
    } catch (error: any) {
      console.error("Erreur chargement QCM:", error);
      toast.error("Impossible de charger le QCM");
    } finally {
      setLoading(false);
    }
  };

  // Charger la liste des QCM
  const fetchQcmList = async (filters?: { coursId?: string }) => {
    try {
      setLoading(true);
      let query = supabase
        .from("qcms")
        .select("*")
        .eq("statut", "publie")
        .order("created_at", { ascending: false });

      if (filters?.coursId) {
        query = query.eq("cours_id", filters.coursId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setQcmList(data as Qcm[]);
    } catch (error: any) {
      console.error("Erreur chargement QCM:", error);
      toast.error("Impossible de charger les QCM");
    } finally {
      setLoading(false);
    }
  };

  // Créer un QCM avec ses questions
  const createQcm = async (
    qcmData: Partial<Qcm>,
    questionsData: Omit<Question, 'id'>[]
  ) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      // Créer le QCM
      const { data: newQcm, error: qcmError } = await supabase
        .from("qcms")
        .insert({
          ...qcmData,
          cree_par_id: userData.user.id,
        } as any)
        .select()
        .single();

      if (qcmError) throw qcmError;

      // Créer les questions
      const questionsToInsert = questionsData.map((q, index) => ({
        qcm_id: newQcm.id,
        question: q.question,
        options: q.options,
        answer_index: q.answer_index,
        feedback: q.feedback,
        points: q.points || 1.0,
        ordre: index + 1,
      }));

      const { error: questionsError } = await supabase
        .from("questions")
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast.success("QCM créé avec succès");
      return newQcm;
    } catch (error: any) {
      console.error("Erreur création QCM:", error);
      toast.error("Impossible de créer le QCM");
      return null;
    }
  };

  // Démarrer une tentative de QCM
  const startTentative = async (qcmId: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("tentatives_qcm")
        .insert({
          qcm_id: qcmId,
          eleve_id: userData.user.id,
          reponses: [],
          score: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Erreur démarrage tentative:", error);
      toast.error("Impossible de démarrer le QCM");
      return null;
    }
  };

  // Soumettre une tentative de QCM
  const submitTentative = async (
    tentativeId: string,
    reponses: Array<{ question_id: string; index_choisi: number }>
  ) => {
    try {
      // Récupérer les questions pour calculer le score
      const { data: questionsData } = await supabase
        .from("questions")
        .select("*")
        .in("id", reponses.map(r => r.question_id));

      if (!questionsData) throw new Error("Questions non trouvées");

      // Calculer le score
      const reponsesAvecCorrection = reponses.map(r => {
        const question = questionsData.find(q => q.id === r.question_id);
        const correct = question?.answer_index === r.index_choisi;
        return {
          question_id: r.question_id,
          index_choisi: r.index_choisi,
          correct,
          points_obtenus: correct ? (question?.points || 1) : 0,
        };
      });

      const totalPoints = questionsData.reduce((sum, q) => sum + (q.points || 1), 0);
      const pointsObtenus = reponsesAvecCorrection.reduce(
        (sum, r) => sum + r.points_obtenus,
        0
      );
      const score = (pointsObtenus / totalPoints) * 100;

      // Mettre à jour la tentative
      const { error } = await supabase
        .from("tentatives_qcm")
        .update({
          reponses: reponsesAvecCorrection,
          score,
          submitted_at: new Date().toISOString(),
        })
        .eq("id", tentativeId);

      if (error) throw error;

      toast.success(`QCM terminé ! Score : ${score.toFixed(1)}%`);
      return { score, reponses: reponsesAvecCorrection };
    } catch (error: any) {
      console.error("Erreur soumission tentative:", error);
      toast.error("Impossible de soumettre le QCM");
      return null;
    }
  };

  // Récupérer les résultats d'un QCM (pour enseignant)
  const fetchResultats = async (qcmId: string) => {
    try {
      const { data, error } = await supabase
        .from("tentatives_qcm")
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .eq("qcm_id", qcmId)
        .not("submitted_at", "is", null)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Erreur chargement résultats:", error);
      toast.error("Impossible de charger les résultats");
      return [];
    }
  };

  useEffect(() => {
    if (qcmId) {
      fetchQcm(qcmId);
    }
  }, [qcmId]);

  return {
    qcm,
    questions,
    qcmList,
    loading,
    fetchQcm,
    fetchQcmList,
    createQcm,
    startTentative,
    submitTentative,
    fetchResultats,
  };
};
