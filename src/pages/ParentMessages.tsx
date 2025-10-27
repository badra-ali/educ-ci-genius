import { useState } from "react";
import { useParentThreads } from "@/hooks/useParent";
import { useMessages, useSendMessage } from "@/hooks/useThreads";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export default function ParentMessages() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data: threads, isLoading: threadsLoading } = useParentThreads();
  const { messages, loading: messagesLoading, fetchMessages } = useMessages(selectedThreadId || "");
  const { sendMessage, sending } = useSendMessage();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      fetchMessages(selectedThreadId);
    }
  }, [selectedThreadId, fetchMessages]);

  const handleSend = async () => {
    if (!messageContent.trim() || !selectedThreadId) return;
    await sendMessage(selectedThreadId, messageContent);
    setMessageContent("");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  if (threadsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Thread view
  if (selectedThreadId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedThreadId(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">
            {threads?.find((t: any) => t.id === selectedThreadId)?.titre || "Conversation"}
          </h1>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: any) => {
                    const isOwn = message.author_id === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(
                              message.author?.first_name,
                              message.author?.last_name
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {message.author?.first_name} {message.author?.last_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), "PPp", { locale: fr })}
                            </span>
                          </div>
                          <div
                            className={`mt-1 p-3 rounded-lg max-w-md ${
                              isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            {message.contenu}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Écrivez votre message..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button onClick={handleSend} disabled={sending || !messageContent.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Threads list
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Messagerie</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversations
          </CardTitle>
          <CardDescription>Messages avec les enseignants et l'administration</CardDescription>
        </CardHeader>
        <CardContent>
          {threads && threads.length > 0 ? (
            <div className="space-y-3">
              {threads.map((thread: any) => (
                <div
                  key={thread.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedThreadId(thread.id)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{thread.titre || "Conversation"}</div>
                    <div className="text-sm text-muted-foreground">
                      {thread.type === "cours" ? "Fil de classe" : "Conversation privée"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Dernière activité:{" "}
                      {format(new Date(thread.updated_at), "PPp", { locale: fr })}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {thread.type === "cours" ? "Classe" : "Privé"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              Aucune conversation pour le moment
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
