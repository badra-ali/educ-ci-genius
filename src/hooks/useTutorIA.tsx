import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TutorMode = 'conversation' | 'explain' | 'qcm' | 'revise' | 'summary' | 'plan';

export interface TutorSession {
  id: string;
  user_id: string;
  mode: TutorMode;
  subject?: string;
  grade?: string;
  title?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface TutorMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  metadata: any;
  created_at: string;
}

export interface QCMItem {
  q: string;
  choices: string[];
  answer: string;
  why: string;
  level: 'easy' | 'medium' | 'hard';
  skill: string;
}

export interface RevisionPlan {
  day: number;
  blocks: {
    type: 'learn' | 'practice' | 'review';
    topic: string;
    duration: number;
    resources?: string[];
    exercises?: string[];
    method?: string;
  }[];
  focus: string;
}

// Hook pour récupérer les sessions d'un utilisateur
export const useTutorSessions = () => {
  return useQuery({
    queryKey: ['tutorSessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });
};

// Hook pour récupérer une session spécifique avec ses messages
export const useTutorSession = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['tutorSession', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const [sessionRes, messagesRes] = await Promise.all([
        supabase.from('tutor_sessions').select('*').eq('id', sessionId).single(),
        supabase.from('tutor_messages').select('*').eq('session_id', sessionId).order('created_at')
      ]);

      if (sessionRes.error) throw sessionRes.error;
      if (messagesRes.error) throw messagesRes.error;

      return {
        session: sessionRes.data as any,
        messages: messagesRes.data as any[]
      };
    },
    enabled: !!sessionId,
  });
};

// Hook pour générer un QCM
export const useGenerateQCM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subject, grade, theme, count = 10, mix }: {
      subject: string;
      grade: string;
      theme: string;
      count?: number;
      mix?: { easy: number; medium: number; hard: number };
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-qcm-generate', {
        body: { subject, grade, theme, count, mix }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generatedQCMs'] });
      toast.success('QCM généré avec succès');
    },
    onError: (error: any) => {
      console.error('Error generating QCM:', error);
      toast.error('Erreur lors de la génération du QCM');
    },
  });
};

// Hook pour créer un plan de révision
export const useCreateRevisionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subject, grade, target, diagnostic, days = 7 }: {
      subject: string;
      grade: string;
      target: string;
      diagnostic?: any;
      days?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-revise-plan', {
        body: { subject, grade, target, diagnostic, days }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisionPlans'] });
      toast.success('Plan de révision créé avec succès');
    },
    onError: (error: any) => {
      console.error('Error creating revision plan:', error);
      toast.error('Erreur lors de la création du plan');
    },
  });
};

// Hook pour la requête RAG
export const useRAGQuery = () => {
  return useMutation({
    mutationFn: async ({ question, resourceId, topK = 5 }: {
      question: string;
      resourceId?: string;
      topK?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke('ai-rag-query', {
        body: { question, resourceId, topK }
      });

      if (error) throw error;
      return data;
    },
    onError: (error: any) => {
      console.error('Error in RAG query:', error);
      toast.error('Erreur lors de la recherche dans les documents');
    },
  });
};

// Hook pour récupérer les plans de révision
export const useRevisionPlans = () => {
  return useQuery({
    queryKey: ['revisionPlans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revision_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Hook pour récupérer les QCMs générés
export const useGeneratedQCMs = () => {
  return useQuery({
    queryKey: ['generatedQCMs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('generated_qcms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Hook pour mettre à jour la progression d'une compétence
export const useUpdateSkillProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subject, skillCode, masteryLevel }: {
      subject: string;
      skillCode: string;
      masteryLevel: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('skill_progress')
        .upsert({
          user_id: user.id,
          subject,
          skill_code: skillCode,
          mastery_level: masteryLevel,
          attempts: 1,
          last_practiced_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subject,skill_code'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skillProgress'] });
    },
  });
};

// Hook pour récupérer la progression des compétences
export const useSkillProgress = (subject?: string) => {
  return useQuery({
    queryKey: ['skillProgress', subject],
    queryFn: async () => {
      let query = supabase
        .from('skill_progress')
        .select('*')
        .order('mastery_level', { ascending: true });

      if (subject) {
        query = query.eq('subject', subject);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};