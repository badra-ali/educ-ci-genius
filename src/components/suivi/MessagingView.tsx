import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";
import { useThreads } from "@/hooks/useThreads";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const MessagingView = () => {
  const { threads, loading } = useThreads();

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-6 h-6 text-accent" />
        </div>
        <CardTitle>Messagerie</CardTitle>
        <CardDescription>
          Communiquez avec vos enseignants et parents
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!threads || threads.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Aucune conversation
            </p>
            <Button>
              Nouveau message
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {threads.map((thread: any) => (
                <div
                  key={thread.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{thread.titre || "Conversation"}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(thread.updated_at), "d MMM", { locale: fr })}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {thread.type === 'cours' ? "Discussion de cours" : "Message privé"}
                  </p>
                </div>
              ))}
            </div>
            <Button className="w-full">
              Nouveau message
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
