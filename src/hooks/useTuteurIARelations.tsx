import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SessionWithRelations {
  id: string;
  user_id: string;
  title: string | null;
  mode: string;
  subject: string | null;
  grade: string | null;
  language: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  messages_count: number;
  qcms_count: number;
}

export interface TutorMessage {
  id: string;
  role: string;
  content: string;
  mode: string | null;
  language: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GeneratedQCM {
  id: string;
  subject: string;
  theme: string;
  grade: string | null;
  items: unknown[];
  created_at: string;
}

export function useTuteurIARelations() {
  return useQuery({
    queryKey: ['tuteur-ia-relations'],
    queryFn: async () => {
      // Fetch sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('tutor_sessions')
        .select('*')
        .order('updated_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Fetch messages counts
      const { data: messages, error: messagesError } = await supabase
        .from('tutor_messages')
        .select('session_id');

      if (messagesError) throw messagesError;

      // Fetch QCMs counts
      const { data: qcms, error: qcmsError } = await supabase
        .from('generated_qcms')
        .select('session_id');

      if (qcmsError) throw qcmsError;

      // Count relations per session
      const messagesCounts = messages?.reduce((acc, m) => {
        acc[m.session_id] = (acc[m.session_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const qcmsCounts = qcms?.reduce((acc, q) => {
        if (q.session_id) {
          acc[q.session_id] = (acc[q.session_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data
      const sessionsWithRelations: SessionWithRelations[] = (sessions || []).map(session => ({
        id: session.id,
        user_id: session.user_id,
        title: session.title,
        mode: session.mode,
        subject: session.subject,
        grade: session.grade,
        language: session.language,
        metadata: session.metadata as Record<string, unknown>,
        created_at: session.created_at,
        updated_at: session.updated_at,
        messages_count: messagesCounts[session.id] || 0,
        qcms_count: qcmsCounts[session.id] || 0,
      }));

      // Get total stats
      const totalSessions = sessionsWithRelations.length;
      const totalMessages = messages?.length || 0;
      const totalQcms = qcms?.length || 0;

      return {
        sessions: sessionsWithRelations,
        stats: {
          totalSessions,
          totalMessages,
          totalQcms,
        }
      };
    },
  });
}

export function useSessionDetails(sessionId: string | null) {
  return useQuery({
    queryKey: ['session-details', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      // Fetch messages
      const { data: messages, error: messagesError } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Fetch generated QCMs
      const { data: qcms, error: qcmsError } = await supabase
        .from('generated_qcms')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (qcmsError) throw qcmsError;

      return {
        messages: messages as TutorMessage[],
        qcms: (qcms || []).map(qcm => ({
          ...qcm,
          items: Array.isArray(qcm.items) ? qcm.items : [],
        })) as GeneratedQCM[],
      };
    },
    enabled: !!sessionId,
  });
}

export function useRAGStats() {
  return useQuery({
    queryKey: ['rag-stats'],
    queryFn: async () => {
      // Get embeddings count for RAG
      const { data: embeddings, error: embeddingsError } = await supabase
        .from('resource_embeddings')
        .select('id, resource_id');

      if (embeddingsError) throw embeddingsError;

      // Get unique resources with embeddings
      const uniqueResources = new Set(embeddings?.map(e => e.resource_id) || []);

      return {
        totalEmbeddings: embeddings?.length || 0,
        indexedResources: uniqueResources.size,
      };
    },
  });
}
