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
  author?: {
    first_name: string;
    last_name: string;
  };
}

export const useThreads = () => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchThreads = async (filters?: { coursId?: string }) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("threads")
        .select("*")
        .contains("participants", [user.id])
        .order("updated_at", { ascending: false });

      if (filters?.coursId) {
        query = query.eq("cours_id", filters.coursId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setThreads((data as Thread[]) || []);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  return {
    threads,
    loading,
    fetchThreads,
  };
};

export const useMessages = (threadId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMessages = async (threadId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          profiles!messages_author_id_fkey(first_name, last_name)
        `)
        .eq("thread_id", threadId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const typedMessages = (data || []).map((msg: any) => ({
        ...msg,
        author: msg.profiles ? {
          first_name: msg.profiles.first_name,
          last_name: msg.profiles.last_name,
        } : undefined
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

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
        () => {
          fetchMessages(threadId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    messages,
    loading,
    fetchMessages,
    subscribeToMessages,
  };
};

export const useSendMessage = () => {
  const [sending, setSending] = useState(false);

  const sendMessage = async (threadId: string, content: string) => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from("messages")
        .insert({
          thread_id: threadId,
          author_id: user.id,
          contenu: content,
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  return {
    sendMessage,
    sending,
  };
};