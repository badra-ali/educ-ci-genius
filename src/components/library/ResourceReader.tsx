import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Volume2, Download } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useResource, useUpdateReadingProgress } from "@/hooks/useResources";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const ResourceReader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: resource, isLoading } = useResource(id!);
  const updateProgress = useUpdateReadingProgress();

  useEffect(() => {
    if (resource) {
      // Track view/reading session
      updateProgress.mutate({
        resourceId: resource.id,
        locator: "start",
        progress: 0,
      });
    }
  }, [resource?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-12 w-48 mb-8" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ressource non trouvée</h1>
          <Button onClick={() => navigate("/bibliotheque")}>
            Retour à la bibliothèque
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/bibliotheque")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div className="flex gap-2">
              {resource.audio_available && (
                <Button variant="outline" size="sm">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Écouter
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Télécharger
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            <div className="w-32 h-48 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-16 h-16 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{resource.title}</h1>
              <p className="text-xl text-muted-foreground mb-4">{resource.author}</p>
              <div className="flex gap-2 flex-wrap mb-4">
                <Badge variant="secondary">{resource.level}</Badge>
                <Badge variant="outline">{resource.subject}</Badge>
                <Badge variant="outline">{resource.type}</Badge>
              </div>
              {resource.summary && (
                <p className="text-muted-foreground">{resource.summary}</p>
              )}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contenu de la ressource</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground">
                Le visualiseur de contenu sera intégré ici. Pour le moment, cliquez sur "Télécharger" 
                pour accéder au fichier complet.
              </p>
              {resource.file_url && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Fichier disponible:</p>
                  <p className="text-sm text-muted-foreground">
                    Type: {resource.file_type?.toUpperCase()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
