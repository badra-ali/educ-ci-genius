import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Thread {
  id: string;
  type: 'cours' | 'direct';
  titre: string | null;
  cours_id: string | null;
  participants: string[];
  etablissement_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  author_id: string;
  contenu: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

export const useThreads = (coursId?: string) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les threads
  const fetchThreads = async (filters?: { coursId?: string }) => {
    try {
      setLoading(true);
      let query = supabase
        .from("threads")
        .select("*")
        .order("updated_at", { ascending: false });

      if (filters?.coursId) {
        query = query.eq("cours_id", filters.coursId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setThreads(data as any);
    } catch (error: any) {
      console.error("Erreur chargement threads:", error);
      toast.error("Impossible de charger les discussions");
    } finally {
      setLoading(false);
    }
  };

  // Charger un thread spécifique
  const fetchThread = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .eq("id", threadId)
        .single();

      if (error) throw error;
      setCurrentThread(data as any);
    } catch (error: any) {
      console.error("Erreur chargement thread:", error);
      toast.error("Impossible de charger la discussion");
    }
  };

  // Charger les messages d'un thread
  const fetchMessages = async (threadId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles (first_name, last_name)
        `)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data as any);
    } catch (error: any) {
      console.error("Erreur chargement messages:", error);
      toast.error("Impossible de charger les messages");
    }
  };

  // Envoyer un message
  const sendMessage = async (threadId: string, contenu: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("messages")
        .insert({
          thread_id: threadId,
          author_id: userData.user.id,
          contenu,
        });

      if (error) throw error;
      
      // Recharger les messages
      await fetchMessages(threadId);
      toast.success("Message envoyé");
    } catch (error: any) {
      console.error("Erreur envoi message:", error);
      toast.error("Impossible d'envoyer le message");
    }
  };

  // Créer un thread
  const createThread = async (data: {
    type: 'cours' | 'direct';
    titre?: string;
    cours_id?: string;
    participants: string[];
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Non authentifié");

      const { data: userRole } = await supabase
        .from("user_roles")
        .select("etablissement_id")
        .eq("user_id", userData.user.id)
        .single();

      if (!userRole?.etablissement_id) throw new Error("Établissement non trouvé");

      const { data: thread, error } = await supabase
        .from("threads")
        .insert({
          type: data.type,
          titre: data.titre,
          cours_id: data.cours_id,
          participants: data.participants,
          etablissement_id: userRole.etablissement_id,
        })
        .select()
        .single();

      if (error) throw error;
      toast.success("Discussion créée");
      return thread as Thread;
    } catch (error: any) {
      console.error("Erreur création thread:", error);
      toast.error("Impossible de créer la discussion");
      return null;
    }
  };

  // S'abonner aux nouveaux messages en temps réel
  const subscribeToMessages = (threadId: string) => {
    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          console.log('Nouveau message:', payload);
          fetchMessages(threadId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    if (coursId) {
      fetchThreads({ coursId });
    }
  }, [coursId]);

  return {
    threads,
    currentThread,
    messages,
    loading,
    fetchThreads,
    fetchThread,
    fetchMessages,
    sendMessage,
    createThread,
    subscribeToMessages,
  };
};
