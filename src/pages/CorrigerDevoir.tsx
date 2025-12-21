import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Sparkles, Loader2, ThumbsUp, AlertTriangle, Lightbulb, Copy } from "lucide-react";
import { useDevoirs } from "@/hooks/useDevoirs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

interface AIFeedback {
  suggested_score: number | null;
  strengths: string[];
  improvements: string[];
  student_feedback: string;
  teacher_notes?: string;
  confidence: 'high' | 'medium' | 'low';
}

const CorrigerDevoir = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devoir, rendus, loading, fetchDevoir, fetchRendus, noterRendu } = useDevoirs(id);
  
  const [selectedRendu, setSelectedRendu] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");
  const [commentaire, setCommentaire] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null);

  useEffect(() => {
    if (id) {
      fetchDevoir(id);
      fetchRendus(id);
    }
  }, [id]);

  const handleNoter = async () => {
    if (!selectedRendu || !note) {
      toast.error("Veuillez saisir une note");
      return;
    }

    const noteValue = parseFloat(note);
    if (isNaN(noteValue) || noteValue < 0 || (devoir && noteValue > devoir.note_sur)) {
      toast.error(`La note doit être entre 0 et ${devoir?.note_sur}`);
      return;
    }

    await noterRendu(selectedRendu, noteValue, commentaire);
    setSelectedRendu(null);
    setNote("");
    setCommentaire("");
    setAiFeedback(null);
  };

  const handleAIAssist = async (rendu: any) => {
    if (!rendu.texte) {
      toast.error("Aucun texte à analyser pour ce rendu");
      return;
    }

    setAiLoading(true);
    setAiFeedback(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-grading-assist', {
        body: {
          submission_id: rendu.id,
          student_text: rendu.texte,
          assignment_instructions: devoir?.consignes || devoir?.titre || "Devoir",
          max_score: devoir?.note_sur || 20
        }
      });

      if (error) throw error;

      if (data?.feedback) {
        setAiFeedback(data.feedback);
        toast.success("Analyse IA terminée !");
      } else {
        throw new Error("Réponse IA invalide");
      }
    } catch (error: any) {
      console.error("AI assist error:", error);
      if (error.message?.includes("429")) {
        toast.error("Limite de requêtes atteinte. Réessayez dans quelques instants.");
      } else if (error.message?.includes("402")) {
        toast.error("Crédits IA insuffisants.");
      } else {
        toast.error("Erreur lors de l'analyse IA");
      }
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestions = () => {
    if (!aiFeedback) return;
    
    if (aiFeedback.suggested_score !== null) {
      setNote(aiFeedback.suggested_score.toString());
    }
    if (aiFeedback.student_feedback) {
      setCommentaire(aiFeedback.student_feedback);
    }
    toast.success("Suggestions appliquées !");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!devoir) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Devoir introuvable</h2>
            <Button onClick={() => navigate(-1)}>Retour</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rendusACorreer = rendus.filter(r => r.statut === 'rendu' || r.statut === 'en_retard');
  const rendusNotes = rendus.filter(r => r.statut === 'note');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{devoir.titre}</h1>
                <p className="text-sm text-muted-foreground">
                  Correction des rendus • {rendus.length} rendu(s)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid gap-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{rendus.length}</div>
                <p className="text-xs text-muted-foreground">Total rendus</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{rendusACorreer.length}</div>
                <p className="text-xs text-muted-foreground">À corriger</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{rendusNotes.length}</div>
                <p className="text-xs text-muted-foreground">Notés</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {rendusNotes.length > 0 
                    ? (rendusNotes.reduce((acc, r) => acc + (r.note || 0), 0) / rendusNotes.length).toFixed(1)
                    : "-"}
                </div>
                <p className="text-xs text-muted-foreground">Moyenne</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des rendus */}
          <Card>
            <CardHeader>
              <CardTitle>Rendus des élèves</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de rendu</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rendus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun rendu pour le moment
                      </TableCell>
                    </TableRow>
                  ) : (
                    rendus.map((rendu) => (
                      <TableRow key={rendu.id}>
                        <TableCell className="font-medium">
                          {rendu.profiles?.first_name} {rendu.profiles?.last_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            rendu.statut === 'note' ? 'default' :
                            rendu.statut === 'en_retard' ? 'destructive' : 'secondary'
                          }>
                            {rendu.statut === 'note' ? 'Noté' :
                             rendu.statut === 'en_retard' ? 'En retard' : 'Rendu'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rendu.rendu_at ? new Date(rendu.rendu_at).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                        <TableCell>
                          {rendu.note !== null ? `${rendu.note}/${devoir.note_sur}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Dialog onOpenChange={(open) => {
                            if (!open) {
                              setAiFeedback(null);
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedRendu(rendu.id);
                                  setNote(rendu.note?.toString() || "");
                                  setCommentaire(rendu.commentaire_prof || "");
                                  setAiFeedback(null);
                                }}
                              >
                                {rendu.statut === 'note' ? 'Voir' : 'Corriger'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Rendu de {rendu.profiles?.first_name} {rendu.profiles?.last_name}
                                </DialogTitle>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                {/* Réponse de l'élève */}
                                <Card>
                                  <CardHeader className="py-3">
                                    <CardTitle className="text-base">Réponse de l'élève</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="whitespace-pre-wrap text-sm">
                                      {rendu.texte || "Aucune réponse textuelle"}
                                    </p>
                                  </CardContent>
                                </Card>

                                {/* Bouton Assistance IA */}
                                {rendu.statut !== 'note' && rendu.texte && (
                                  <Button
                                    variant="outline"
                                    className="w-full border-purple-500/50 text-purple-600 hover:bg-purple-500/10"
                                    onClick={() => handleAIAssist(rendu)}
                                    disabled={aiLoading}
                                  >
                                    {aiLoading ? (
                                      <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyse en cours...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Assistance IA pour la correction
                                      </>
                                    )}
                                  </Button>
                                )}

                                {/* Résultats IA */}
                                {aiFeedback && (
                                  <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
                                    <CardHeader className="py-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-4 h-4 text-purple-500" />
                                          <CardTitle className="text-base">Suggestions IA</CardTitle>
                                        </div>
                                        <Badge variant={
                                          aiFeedback.confidence === 'high' ? 'default' :
                                          aiFeedback.confidence === 'medium' ? 'secondary' : 'outline'
                                        }>
                                          Confiance: {aiFeedback.confidence === 'high' ? 'Élevée' :
                                                     aiFeedback.confidence === 'medium' ? 'Moyenne' : 'Faible'}
                                        </Badge>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                      {/* Note suggérée */}
                                      {aiFeedback.suggested_score !== null && (
                                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                                          <span className="font-medium">Note suggérée</span>
                                          <span className="text-2xl font-bold text-purple-600">
                                            {aiFeedback.suggested_score}/{devoir.note_sur}
                                          </span>
                                        </div>
                                      )}

                                      {/* Points forts */}
                                      {aiFeedback.strengths.length > 0 && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <ThumbsUp className="w-4 h-4 text-green-500" />
                                            <span className="font-medium text-sm">Points forts</span>
                                          </div>
                                          <ul className="space-y-1">
                                            {aiFeedback.strengths.map((s, i) => (
                                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-green-500">•</span>
                                                {s}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Axes d'amélioration */}
                                      {aiFeedback.improvements.length > 0 && (
                                        <div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <Lightbulb className="w-4 h-4 text-amber-500" />
                                            <span className="font-medium text-sm">Axes d'amélioration</span>
                                          </div>
                                          <ul className="space-y-1">
                                            {aiFeedback.improvements.map((s, i) => (
                                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                                <span className="text-amber-500">•</span>
                                                {s}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Feedback suggéré */}
                                      {aiFeedback.student_feedback && (
                                        <div>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">Feedback suggéré pour l'élève</span>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => copyToClipboard(aiFeedback.student_feedback)}
                                            >
                                              <Copy className="w-3 h-3" />
                                            </Button>
                                          </div>
                                          <p className="text-sm p-3 bg-muted/50 rounded-lg">
                                            {aiFeedback.student_feedback}
                                          </p>
                                        </div>
                                      )}

                                      {/* Notes pour l'enseignant */}
                                      {aiFeedback.teacher_notes && (
                                        <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                          <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                                            <span className="font-medium text-sm">Note pour vous</span>
                                          </div>
                                          <p className="text-sm text-muted-foreground">
                                            {aiFeedback.teacher_notes}
                                          </p>
                                        </div>
                                      )}

                                      <Separator />

                                      <Button 
                                        onClick={applyAISuggestions}
                                        className="w-full bg-purple-600 hover:bg-purple-700"
                                      >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Appliquer les suggestions
                                      </Button>
                                    </CardContent>
                                  </Card>
                                )}

                                <Separator />

                                {/* Formulaire de notation */}
                                <div className="space-y-2">
                                  <Label htmlFor="note">Note / {devoir.note_sur}</Label>
                                  <Input
                                    id="note"
                                    type="number"
                                    min="0"
                                    max={devoir.note_sur}
                                    step="0.5"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={rendu.statut === 'note'}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="commentaire">Commentaire pour l'élève</Label>
                                  <Textarea
                                    id="commentaire"
                                    value={commentaire}
                                    onChange={(e) => setCommentaire(e.target.value)}
                                    rows={4}
                                    placeholder="Votre retour à l'élève..."
                                    disabled={rendu.statut === 'note'}
                                  />
                                </div>

                                {rendu.statut !== 'note' && (
                                  <Button onClick={handleNoter} className="w-full">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Valider la note
                                  </Button>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CorrigerDevoir;
