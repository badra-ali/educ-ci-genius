import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { History, MessageSquare, Clock, ChevronRight, Trash2, Search, Bot, BookOpen, Target, Brain, FileText, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTutorSessions, useTutorSession, TutorMode } from "@/hooks/useTutorIA";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TutorHistoryProps {
  onSelectSession: (sessionId: string, mode: TutorMode, messages: any[]) => void;
  onNewSession: () => void;
  currentSessionId: string | null;
}

const modeConfig: Record<TutorMode, { icon: React.ReactNode; label: string; color: string }> = {
  conversation: { icon: <Bot className="w-4 h-4" />, label: "Conversation", color: "text-blue-600 bg-blue-100 dark:bg-blue-900" },
  explain: { icon: <BookOpen className="w-4 h-4" />, label: "Explication", color: "text-green-600 bg-green-100 dark:bg-green-900" },
  qcm: { icon: <Target className="w-4 h-4" />, label: "QCM", color: "text-orange-600 bg-orange-100 dark:bg-orange-900" },
  revise: { icon: <Brain className="w-4 h-4" />, label: "Révision", color: "text-purple-600 bg-purple-100 dark:bg-purple-900" },
  summary: { icon: <FileText className="w-4 h-4" />, label: "Résumé", color: "text-pink-600 bg-pink-100 dark:bg-pink-900" },
  plan: { icon: <Calendar className="w-4 h-4" />, label: "Planification", color: "text-teal-600 bg-teal-100 dark:bg-teal-900" },
};

export function TutorHistory({ onSelectSession, onNewSession, currentSessionId }: TutorHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: sessionsLoading } = useTutorSessions();
  const { data: sessionDetail, isLoading: detailLoading } = useTutorSession(selectedSessionId);

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const title = session.title?.toLowerCase() || "";
    const subject = session.subject?.toLowerCase() || "";
    const mode = session.mode?.toLowerCase() || "";
    return title.includes(query) || subject.includes(query) || mode.includes(query);
  });

  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleLoadSession = () => {
    if (sessionDetail) {
      onSelectSession(
        sessionDetail.session.id,
        sessionDetail.session.mode as TutorMode,
        sessionDetail.messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
      setIsOpen(false);
      setSelectedSessionId(null);
      toast.success("Conversation restaurée");
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Delete messages first
      await supabase.from("tutor_messages").delete().eq("session_id", sessionId);
      // Then delete session
      await supabase.from("tutor_sessions").delete().eq("id", sessionId);
      queryClient.invalidateQueries({ queryKey: ["tutorSessions"] });
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
      }
      toast.success("Session supprimée");
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleNewSession = () => {
    onNewSession();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="w-4 h-4" />
          Historique
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Historique des conversations
          </DialogTitle>
          <DialogDescription>
            Reprenez une conversation précédente ou commencez-en une nouvelle
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 h-full min-h-0">
          {/* Sessions List */}
          <div className="w-1/2 flex flex-col min-h-0">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleNewSession} className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau
              </Button>
            </div>

            <ScrollArea className="flex-1">
              {sessionsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune conversation trouvée</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredSessions.map((session) => {
                    const config = modeConfig[session.mode as TutorMode] || modeConfig.conversation;
                    const isSelected = selectedSessionId === session.id;
                    const isCurrent = currentSessionId === session.id;

                    return (
                      <Card
                        key={session.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          isSelected && "ring-2 ring-primary",
                          isCurrent && "bg-primary/5"
                        )}
                        onClick={() => handleSelectSession(session.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={cn("p-2 rounded-lg flex-shrink-0", config.color)}>
                                {config.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium truncate">
                                  {session.title || `${config.label} - ${session.subject || "Général"}`}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    {formatDistanceToNow(new Date(session.created_at), {
                                      addSuffix: true,
                                      locale: fr,
                                    })}
                                  </span>
                                  {session.grade && (
                                    <Badge variant="secondary" className="text-xs">
                                      {session.grade}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {isCurrent && (
                                <Badge variant="default" className="text-xs">
                                  Actuelle
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={(e) => handleDeleteSession(session.id, e)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Session Preview */}
          <div className="w-1/2 flex flex-col min-h-0 border-l pl-4">
            {selectedSessionId ? (
              detailLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-[400px]" />
                </div>
              ) : sessionDetail ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">
                        {sessionDetail.session.title ||
                          `${modeConfig[sessionDetail.session.mode as TutorMode]?.label} - ${sessionDetail.session.subject || "Général"}`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sessionDetail.session.created_at), "PPP 'à' HH:mm", { locale: fr })}
                      </p>
                    </div>
                    <Button onClick={handleLoadSession}>
                      Reprendre
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1 bg-muted/30 rounded-lg p-4">
                    <div className="space-y-3">
                      {sessionDetail.messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Aucun message dans cette session
                        </p>
                      ) : (
                        sessionDetail.messages.map((message: any, index: number) => (
                          <div
                            key={index}
                            className={cn(
                              "max-w-[90%] rounded-lg p-3 text-sm",
                              message.role === "user"
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "bg-background border"
                            )}
                          >
                            <p className="line-clamp-3">{message.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    {sessionDetail.messages.length} message{sessionDetail.messages.length !== 1 ? "s" : ""}
                  </div>
                </>
              ) : null
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Sélectionnez une conversation</p>
                  <p className="text-sm">pour voir l'aperçu et la reprendre</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
