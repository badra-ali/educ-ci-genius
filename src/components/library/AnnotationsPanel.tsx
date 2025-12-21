import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Highlighter, 
  StickyNote, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Plus,
  MessageSquare
} from "lucide-react";
import { 
  useHighlights, 
  useCreateHighlight, 
  useUpdateHighlight, 
  useDeleteHighlight,
  HIGHLIGHT_COLORS,
  Highlight
} from "@/hooks/useAnnotations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AnnotationsPanelProps {
  resourceId: string;
  resourceTitle: string;
}

export const AnnotationsPanel = ({ resourceId, resourceTitle }: AnnotationsPanelProps) => {
  const { data: highlights, isLoading } = useHighlights(resourceId);
  const createHighlight = useCreateHighlight();
  const updateHighlight = useUpdateHighlight();
  const deleteHighlight = useDeleteHighlight();

  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");

  const handleAddNote = async () => {
    if (!newNote.trim() && !newNoteTitle.trim()) return;

    await createHighlight.mutateAsync({
      resourceId,
      locator: `note-${Date.now()}`,
      text: newNoteTitle || "Note",
      color: selectedColor,
      note: newNote,
    });

    setNewNote("");
    setNewNoteTitle("");
    setIsAddingNote(false);
  };

  const handleUpdateNote = async (highlight: Highlight) => {
    await updateHighlight.mutateAsync({
      id: highlight.id,
      resourceId,
      note: editingNote,
    });
    setEditingId(null);
    setEditingNote("");
  };

  const handleDelete = async (id: string) => {
    await deleteHighlight.mutateAsync({ id, resourceId });
  };

  const handleColorChange = async (highlight: Highlight, color: string) => {
    await updateHighlight.mutateAsync({
      id: highlight.id,
      resourceId,
      color,
    });
  };

  const notesCount = highlights?.filter(h => h.note).length || 0;
  const highlightsCount = highlights?.filter(h => !h.note && h.text).length || 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-500" />
            Mes annotations
          </CardTitle>
          <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Titre (optionnel)</label>
                  <Input
                    placeholder="Titre de la note..."
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Contenu</label>
                  <Textarea
                    placeholder="Écrivez votre note ici..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Couleur</label>
                  <div className="flex gap-2">
                    {HIGHLIGHT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedColor(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === color.value 
                            ? "border-foreground scale-110" 
                            : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleAddNote}
                    disabled={!newNote.trim() && !newNoteTitle.trim()}
                  >
                    Ajouter
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            <Highlighter className="w-3 h-3 mr-1" />
            {highlightsCount} surlignage{highlightsCount > 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            {notesCount} note{notesCount > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : highlights && highlights.length > 0 ? (
              highlights.map((highlight) => (
                <div
                  key={highlight.id}
                  className="p-3 rounded-lg border hover:shadow-sm transition-shadow"
                  style={{ 
                    borderLeftWidth: 4, 
                    borderLeftColor: highlight.color 
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      {highlight.text && (
                        <p className="font-medium text-sm line-clamp-2">
                          {highlight.text}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Color selector */}
                      <div className="flex gap-1">
                        {HIGHLIGHT_COLORS.slice(0, 3).map((color) => (
                          <button
                            key={color.value}
                            onClick={() => handleColorChange(highlight, color.value)}
                            className={`w-4 h-4 rounded-full transition-all ${
                              highlight.color === color.value 
                                ? "ring-2 ring-offset-1 ring-foreground/50" 
                                : "opacity-60 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                      
                      {/* Edit button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          setEditingId(highlight.id);
                          setEditingNote(highlight.note || "");
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>

                      {/* Delete button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette annotation ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(highlight.id)}>
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Note content */}
                  {editingId === highlight.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingNote}
                        onChange={(e) => setEditingNote(e.target.value)}
                        rows={3}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(highlight)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Sauver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditingNote("");
                          }}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : highlight.note ? (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {highlight.note}
                    </p>
                  ) : null}

                  <p className="text-xs text-muted-foreground mt-2">
                    {format(new Date(highlight.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <StickyNote className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Aucune annotation pour cette ressource
                </p>
                <p className="text-xs text-muted-foreground">
                  Ajoutez des notes pour mémoriser les points importants
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};