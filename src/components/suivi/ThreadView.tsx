import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useMessages, useSendMessage } from "@/hooks/useThreads";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface ThreadViewProps {
  threadId: string;
  onBack: () => void;
}

export const ThreadView = ({ threadId, onBack }: ThreadViewProps) => {
  const { messages, loading, fetchMessages, subscribeToMessages } = useMessages(threadId);
  const { sendMessage, sending } = useSendMessage();
  const [content, setContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  useEffect(() => {
    if (threadId) {
      fetchMessages(threadId);
      const unsubscribe = subscribeToMessages(threadId);
      return () => unsubscribe();
    }
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    try {
      await sendMessage(threadId, content.trim());
      setContent("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle>Conversation</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun message. Commencez la conversation !
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwnMessage = message.author_id === currentUserId;
              const author = message.author || { first_name: 'Utilisateur', last_name: '' };

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      {author.first_name?.[0]}{author.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-lg p-3 ${
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.contenu}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), "HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </CardContent>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Écrivez votre message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={2}
            maxLength={2000}
            className="resize-none"
          />
          <Button onClick={handleSend} disabled={!content.trim() || sending}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {content.length}/2000 caractères
        </p>
      </div>
    </Card>
  );
};