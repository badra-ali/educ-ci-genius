import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, MessageSquare, FileText, ClipboardList, ExternalLink } from "lucide-react";
import { useCours } from "@/hooks/useCours";
import { useQcm } from "@/hooks/useQcm";
import { useDevoirs } from "@/hooks/useDevoirs";
import Forum from "./Forum";

const CoursDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cours, loading: coursLoading, fetchCours } = useCours(id);
  const { qcmList, fetchQcmList } = useQcm();
  const { devoirsList, fetchDevoirsList } = useDevoirs();

  useEffect(() => {
    if (id) {
      fetchCours(id);
      fetchQcmList({ coursId: id });
      fetchDevoirsList({ coursId: id });
    }
  }, [id]);

  if (coursLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!cours) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
          <Button onClick={() => navigate("/classe")}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/classe")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{cours.titre}</h1>
                <p className="text-sm text-muted-foreground">
                  {cours.matieres?.nom} • {cours.profiles?.first_name} {cours.profiles?.last_name}
                </p>
              </div>
            </div>
            <Badge variant={cours.statut === 'publie' ? 'default' : 'secondary'}>
              {cours.statut}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {cours.description && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{cours.description}</p>
              
              {cours.objectifs && cours.objectifs.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Objectifs pédagogiques</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cours.objectifs.map((obj, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {cours.prerequis && cours.prerequis.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Prérequis</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {cours.prerequis.map((pre, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{pre}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="contenu" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contenu">
              <FileText className="w-4 h-4 mr-2" />
              Contenu
            </TabsTrigger>
            <TabsTrigger value="qcm">
              <ClipboardList className="w-4 h-4 mr-2" />
              QCM ({qcmList.length})
            </TabsTrigger>
            <TabsTrigger value="devoirs">
              <FileText className="w-4 h-4 mr-2" />
              Devoirs ({devoirsList.length})
            </TabsTrigger>
            <TabsTrigger value="visio">
              <Video className="w-4 h-4 mr-2" />
              Visio
            </TabsTrigger>
            <TabsTrigger value="forum">
              <MessageSquare className="w-4 h-4 mr-2" />
              Forum
            </TabsTrigger>
          </TabsList>

          {/* CONTENU */}
          <TabsContent value="contenu" className="space-y-4">
            {cours.contenu_json && Array.isArray(cours.contenu_json) && cours.contenu_json.length > 0 ? (
              cours.contenu_json
                .sort((a: any, b: any) => a.ordre - b.ordre)
                .map((bloc: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle>{bloc.titre || `Section ${index + 1}`}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {bloc.type === 'chapitre' && (
                        <div className="prose max-w-none">
                          <p>{bloc.contenu}</p>
                        </div>
                      )}
                      {bloc.type === 'video' && (
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <a href={bloc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary">
                            <Video className="w-6 h-6" />
                            <span>Voir la vidéo</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                      {bloc.type === 'pdf' && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          <a href={bloc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {bloc.titre || 'Document PDF'}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun contenu disponible pour le moment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* QCM */}
          <TabsContent value="qcm" className="space-y-4">
            {qcmList.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {qcmList.map((qcm) => (
                  <Card key={qcm.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{qcm.titre}</CardTitle>
                          {qcm.description && (
                            <CardDescription>{qcm.description}</CardDescription>
                          )}
                        </div>
                        <Badge variant="outline">
                          {qcm.duree_minutes ? `${qcm.duree_minutes} min` : 'Illimité'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {qcm.tags && qcm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {qcm.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button 
                        className="w-full" 
                        onClick={() => navigate(`/qcm/${qcm.id}/passer`)}
                      >
                        Passer le QCM
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun QCM disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DEVOIRS */}
          <TabsContent value="devoirs" className="space-y-4">
            {devoirsList.length > 0 ? (
              <div className="space-y-4">
                {devoirsList.map((devoir) => {
                  const deadline = new Date(devoir.deadline);
                  const isOverdue = deadline < new Date();
                  
                  return (
                    <Card key={devoir.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{devoir.titre}</CardTitle>
                            <CardDescription>
                              À rendre le {deadline.toLocaleDateString('fr-FR', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </CardDescription>
                          </div>
                          <Badge variant={isOverdue ? 'destructive' : 'default'}>
                            {isOverdue ? 'En retard' : 'À faire'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {devoir.consignes}
                        </p>
                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/devoir/${devoir.id}`)}
                        >
                          Voir le devoir
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Aucun devoir disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* VISIO */}
          <TabsContent value="visio">
            <Card>
              <CardHeader>
                <CardTitle>Visioconférence</CardTitle>
                <CardDescription>
                  Rejoignez la session en direct avec votre enseignant
                </CardDescription>
              </CardHeader>
              <CardContent>
                {cours.visio_url ? (
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <Video className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => window.open(cours.visio_url!, '_blank')}
                    >
                      <Video className="w-5 h-5 mr-2" />
                      Rejoindre la visioconférence
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Vous serez redirigé vers une plateforme externe
                    </p>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Video className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Aucune visioconférence programmée pour ce cours
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* FORUM */}
          <TabsContent value="forum">
            <Forum />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default CoursDetail;
