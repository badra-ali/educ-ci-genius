import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Volume2, Download, PanelRightOpen, PanelRightClose, Highlighter } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useResource, useUpdateReadingProgress } from "@/hooks/useResources";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AnnotationsPanel } from "./AnnotationsPanel";
import { useHighlights, useCreateHighlight, HIGHLIGHT_COLORS } from "@/hooks/useAnnotations";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const ResourceReader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: resource, isLoading } = useResource(id!);
  const updateProgress = useUpdateReadingProgress();
  const { data: highlights } = useHighlights(id!);
  const createHighlight = useCreateHighlight();
  
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showHighlightPopover, setShowHighlightPopover] = useState(false);
  const [highlightNote, setHighlightNote] = useState("");
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value);

  useEffect(() => {
    if (resource) {
      updateProgress.mutate({
        resourceId: resource.id,
        locator: "start",
        progress: 0,
      });
    }
  }, [resource?.id]);

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setShowHighlightPopover(true);
    } else {
      setShowHighlightPopover(false);
      setSelectedText("");
    }
  };

  const handleCreateHighlight = async () => {
    if (!selectedText || !id) return;

    await createHighlight.mutateAsync({
      resourceId: id,
      locator: `selection-${Date.now()}`,
      text: selectedText,
      color: highlightColor,
      note: highlightNote || undefined,
    });

    setSelectedText("");
    setHighlightNote("");
    setShowHighlightPopover(false);
    window.getSelection()?.removeAllRanges();
  };

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
              <Button 
                variant={showAnnotations ? "default" : "outline"} 
                size="sm"
                onClick={() => setShowAnnotations(!showAnnotations)}
              >
                {showAnnotations ? (
                  <PanelRightClose className="w-4 h-4 mr-2" />
                ) : (
                  <PanelRightOpen className="w-4 h-4 mr-2" />
                )}
                Notes ({highlights?.length || 0})
              </Button>
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

      <main className="container mx-auto px-4 py-8">
        <div className={`grid gap-6 ${showAnnotations ? "lg:grid-cols-3" : ""}`}>
          {/* Main content */}
          <div className={showAnnotations ? "lg:col-span-2" : ""}>
            <div className="mb-8">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-32 h-48 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {resource.cover_url ? (
                    <img 
                      src={resource.cover_url} 
                      alt={resource.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-primary" />
                  )}
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

            {/* Highlight instruction */}
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2 text-sm">
              <Highlighter className="w-4 h-4 text-amber-600" />
              <span className="text-amber-800 dark:text-amber-200">
                Astuce : Sélectionnez du texte pour le surligner et ajouter des notes
              </span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Contenu de la ressource</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert"
                  onMouseUp={handleTextSelection}
                >
                  {/* Sample content for demonstration */}
                  <p className="text-foreground leading-relaxed">
                    Bienvenue dans cette ressource éducative. Le contenu complet sera 
                    affiché ici une fois le fichier chargé. Vous pouvez sélectionner 
                    n&apos;importe quel texte pour le surligner et ajouter des notes personnelles.
                  </p>
                  
                  <h2 className="text-lg font-semibold mt-6 mb-3">Introduction</h2>
                  <p className="text-foreground leading-relaxed">
                    Cette section présente les concepts fondamentaux du sujet. 
                    Les étudiants peuvent annoter les passages importants pour 
                    faciliter leur révision ultérieure.
                  </p>

                  <h2 className="text-lg font-semibold mt-6 mb-3">Concepts clés</h2>
                  <p className="text-foreground leading-relaxed">
                    Les concepts clés à retenir sont présentés de manière structurée. 
                    Utilisez les surlignages de différentes couleurs pour catégoriser 
                    vos annotations : jaune pour les définitions, vert pour les exemples, 
                    bleu pour les formules importantes.
                  </p>

                  {resource.file_url && (
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <p className="font-medium mb-2">Fichier disponible :</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Type : {resource.file_type?.toUpperCase()}
                      </p>
                      <Button size="sm" asChild>
                        <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Ouvrir le fichier complet
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Annotations panel */}
          {showAnnotations && (
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <AnnotationsPanel 
                  resourceId={id!} 
                  resourceTitle={resource.title} 
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Highlight popover */}
      {showHighlightPopover && selectionPosition && (
        <Popover open={showHighlightPopover} onOpenChange={setShowHighlightPopover}>
          <PopoverTrigger asChild>
            <div 
              style={{
                position: "fixed",
                left: selectionPosition.x,
                top: selectionPosition.y,
                width: 1,
                height: 1,
              }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-80" align="center" side="top">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Texte sélectionné :</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded line-clamp-3">
                  &quot;{selectedText}&quot;
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Couleur :</p>
                <div className="flex gap-2">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setHighlightColor(color.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        highlightColor === color.value 
                          ? "border-foreground scale-110" 
                          : "border-transparent hover:scale-105"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Note (optionnel) :</p>
                <Textarea
                  placeholder="Ajouter une note..."
                  value={highlightNote}
                  onChange={(e) => setHighlightNote(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={handleCreateHighlight}
                >
                  <Highlighter className="w-4 h-4 mr-1" />
                  Surligner
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowHighlightPopover(false);
                    setSelectedText("");
                    window.getSelection()?.removeAllRanges();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
