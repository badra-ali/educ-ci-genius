import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, FileText, Send, CheckCircle2, Loader2 } from "lucide-react";
import { useDevoirs } from "@/hooks/useDevoirs";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

const DevoirDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { devoir, monRendu, loading, fetchDevoir, fetchMonRendu, submitRendu } = useDevoirs(id);
  const { primaryRole } = useUserRole();
  
  const [texteRendu, setTexteRendu] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDevoir(id);
      if (primaryRole === 'ELEVE') {
        fetchMonRendu(id);
      }
    }
  }, [id]);

  useEffect(() => {
    if (monRendu?.texte) {
      setTexteRendu(monRendu.texte);
    }
  }, [monRendu]);

  const handleSubmitRendu = async () => {
    if (!id || !texteRendu.trim()) {
      toast.error("Veuillez rédiger votre réponse");
      return;
    }

    setSubmitting(true);
    await submitRendu(id, texteRendu);
    setSubmitting(false);
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

  const deadline = new Date(devoir.deadline);
  const isOverdue = deadline < new Date();
  const canEdit = primaryRole === 'ELEVE' && !isOverdue && monRendu?.statut !== 'note';

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
                  <Clock className="w-3 h-3 inline mr-1" />
                  À rendre le {deadline.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <Badge variant={isOverdue ? 'destructive' : monRendu?.statut === 'note' ? 'default' : 'secondary'}>
              {monRendu?.statut === 'note' ? 'Noté' : isOverdue ? 'En retard' : 'En cours'}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Consignes */}
          <Card>
            <CardHeader>
              <CardTitle>Consignes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap">{devoir.consignes}</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>Barème : {devoir.note_sur} points</span>
              </div>
            </CardContent>
          </Card>

          {/* Rendu de l'élève */}
          {primaryRole === 'ELEVE' && (
            <Card>
              <CardHeader>
                <CardTitle>Votre rendu</CardTitle>
                {monRendu?.statut === 'note' && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="default">
                      Note : {monRendu.note}/{devoir.note_sur}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Rédigez votre réponse ici..."
                  value={texteRendu}
                  onChange={(e) => setTexteRendu(e.target.value)}
                  rows={10}
                  disabled={!canEdit}
                  className="min-h-[200px]"
                />

                {monRendu?.commentaire_prof && (
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <p className="text-sm font-semibold mb-1">Commentaire de l'enseignant</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {monRendu.commentaire_prof}
                    </p>
                  </div>
                )}

                {canEdit && (
                  <Button onClick={handleSubmitRendu} disabled={submitting} className="w-full">
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : monRendu ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mettre à jour le rendu
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Soumettre le rendu
                      </>
                    )}
                  </Button>
                )}

                {monRendu?.statut === 'note' && (
                  <div className="text-center py-2">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    <p className="text-sm font-medium">Devoir noté et rendu</p>
                  </div>
                )}

                {isOverdue && !monRendu && (
                  <div className="text-center py-2 text-destructive">
                    <p className="text-sm font-medium">⚠️ La date limite est dépassée</p>
                    <p className="text-xs">Vous pouvez encore soumettre mais ce sera marqué comme en retard</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DevoirDetail;
