import { useState } from "react";
import { 
  useCoursWithRelations, 
  useCoursDetails,
  useClasseVirtuelleStats 
} from "@/hooks/useClasseVirtuelleRelations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function ClasseVirtuelleRelations() {
  const [search, setSearch] = useState("");
  const [selectedCours, setSelectedCours] = useState<string | null>(null);

  const { data: cours, isLoading } = useCoursWithRelations();
  const { data: coursDetails } = useCoursDetails(selectedCours || undefined);
  const { data: stats } = useClasseVirtuelleStats();

  const filteredCours = cours?.filter((c) =>
    c.titre?.toLowerCase().includes(search.toLowerCase()) ||
    c.matiere?.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (statut: string | null) => {
    switch (statut) {
      case "rendu": return "bg-green-500";
      case "en_retard": return "bg-red-500";
      case "assigne": return "bg-yellow-500";
      default: return "bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats.coursCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Cours publiés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-secondary" />
                <span className="text-2xl font-bold">{stats.devoirsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Devoirs actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-accent" />
                <span className="text-2xl font-bold">{stats.qcmsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">QCMs publiés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold">{stats.rendusCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rendus</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">{stats.tentativesCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tentatives QCM</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recherche */}
      <Input
        placeholder="Rechercher un cours..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      {/* Table des cours */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cours</TableHead>
            <TableHead>Matière</TableHead>
            <TableHead>Enseignant</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Devoirs</TableHead>
            <TableHead>QCMs</TableHead>
            <TableHead>Forum</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                Chargement...
              </TableCell>
            </TableRow>
          ) : filteredCours?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground">
                Aucun cours trouvé
              </TableCell>
            </TableRow>
          ) : (
            filteredCours?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {c.titre}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    style={{ 
                      borderColor: c.matiere?.couleur || undefined,
                      color: c.matiere?.couleur || undefined 
                    }}
                  >
                    {c.matiere?.nom || "-"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {c.enseignant ? 
                    `${c.enseignant.first_name} ${c.enseignant.last_name}` : 
                    "-"
                  }
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {c.classes.length} classe{c.classes.length > 1 ? "s" : ""}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    <span>{c.devoirs.length}</span>
                    {c.devoirs.reduce((acc, d) => acc + d.rendus_count, 0) > 0 && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {c.devoirs.reduce((acc, d) => acc + d.rendus_count, 0)} rendus
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    <span>{c.qcms.length}</span>
                    {c.qcms.reduce((acc, q) => acc + q.tentatives_count, 0) > 0 && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {c.qcms.reduce((acc, q) => acc + q.tentatives_count, 0)} tentatives
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{c.threads.length}</span>
                    {c.threads.reduce((acc, t) => acc + t.messages_count, 0) > 0 && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {c.threads.reduce((acc, t) => acc + t.messages_count, 0)} msg
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCours(c.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[85vh]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {c.titre}
                        </DialogTitle>
                        <DialogDescription>
                          {c.matiere?.nom} • {c.enseignant?.first_name} {c.enseignant?.last_name}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {coursDetails && (
                        <Tabs defaultValue="devoirs" className="mt-4">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="devoirs" className="gap-1">
                              <FileText className="h-4 w-4" />
                              Devoirs ({coursDetails.devoirs.length})
                            </TabsTrigger>
                            <TabsTrigger value="qcms" className="gap-1">
                              <HelpCircle className="h-4 w-4" />
                              QCMs ({coursDetails.qcms.length})
                            </TabsTrigger>
                            <TabsTrigger value="threads" className="gap-1">
                              <MessageSquare className="h-4 w-4" />
                              Forum ({coursDetails.threads.length})
                            </TabsTrigger>
                            <TabsTrigger value="classes" className="gap-1">
                              <Users className="h-4 w-4" />
                              Classes ({coursDetails.classes.length})
                            </TabsTrigger>
                          </TabsList>

                          {/* Devoirs */}
                          <TabsContent value="devoirs">
                            <ScrollArea className="h-[400px]">
                              <div className="space-y-4 p-1">
                                {coursDetails.devoirs.length === 0 ? (
                                  <p className="text-muted-foreground text-center py-8">
                                    Aucun devoir pour ce cours
                                  </p>
                                ) : (
                                  coursDetails.devoirs.map((d: any) => (
                                    <Card key={d.id}>
                                      <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-base">{d.titre}</CardTitle>
                                          <Badge variant="outline" className="gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(d.deadline), "dd MMM yyyy", { locale: fr })}
                                          </Badge>
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center gap-2 mb-3">
                                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">
                                            {d.rendus?.length || 0} rendu(s)
                                          </span>
                                          {d.note_sur && (
                                            <Badge variant="secondary">/{d.note_sur}</Badge>
                                          )}
                                        </div>
                                        {d.rendus && d.rendus.length > 0 && (
                                          <div className="grid gap-1">
                                            {d.rendus.slice(0, 5).map((r: any) => (
                                              <div 
                                                key={r.id} 
                                                className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                                              >
                                                <span>
                                                  {r.eleve?.first_name} {r.eleve?.last_name}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <div className={`h-2 w-2 rounded-full ${getStatusColor(r.statut)}`} />
                                                  {r.note !== null && (
                                                    <Badge>{r.note}/{d.note_sur || 20}</Badge>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                            {d.rendus.length > 5 && (
                                              <p className="text-xs text-muted-foreground text-center">
                                                +{d.rendus.length - 5} autres rendus
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>

                          {/* QCMs */}
                          <TabsContent value="qcms">
                            <ScrollArea className="h-[400px]">
                              <div className="space-y-4 p-1">
                                {coursDetails.qcms.length === 0 ? (
                                  <p className="text-muted-foreground text-center py-8">
                                    Aucun QCM pour ce cours
                                  </p>
                                ) : (
                                  coursDetails.qcms.map((q: any) => (
                                    <Card key={q.id}>
                                      <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-base">{q.titre}</CardTitle>
                                          <Badge variant="outline">
                                            {q.questions_count} questions
                                          </Badge>
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="flex items-center gap-2 mb-3">
                                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                          <span className="text-sm font-medium">
                                            {q.tentatives?.length || 0} tentative(s)
                                          </span>
                                          {q.duree_minutes && (
                                            <Badge variant="secondary">
                                              {q.duree_minutes} min
                                            </Badge>
                                          )}
                                        </div>
                                        {q.tentatives && q.tentatives.length > 0 && (
                                          <div className="grid gap-1">
                                            {q.tentatives.slice(0, 5).map((t: any) => (
                                              <div 
                                                key={t.id} 
                                                className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded"
                                              >
                                                <span>
                                                  {t.eleve?.first_name} {t.eleve?.last_name}
                                                </span>
                                                <Badge 
                                                  variant={t.score >= 50 ? "default" : "destructive"}
                                                >
                                                  {t.score}%
                                                </Badge>
                                              </div>
                                            ))}
                                            {q.tentatives.length > 5 && (
                                              <p className="text-xs text-muted-foreground text-center">
                                                +{q.tentatives.length - 5} autres tentatives
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>

                          {/* Threads */}
                          <TabsContent value="threads">
                            <ScrollArea className="h-[400px]">
                              <div className="space-y-4 p-1">
                                {coursDetails.threads.length === 0 ? (
                                  <p className="text-muted-foreground text-center py-8">
                                    Aucun thread de discussion
                                  </p>
                                ) : (
                                  coursDetails.threads.map((t: any) => (
                                    <Card key={t.id}>
                                      <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                          <CardTitle className="text-base">
                                            {t.titre || "Discussion"}
                                          </CardTitle>
                                          <Badge variant="outline">
                                            {t.messages?.length || 0} messages
                                          </Badge>
                                        </div>
                                      </CardHeader>
                                      <CardContent>
                                        {t.messages && t.messages.length > 0 && (
                                          <div className="grid gap-2">
                                            {t.messages.slice(0, 3).map((m: any) => (
                                              <div 
                                                key={m.id} 
                                                className="text-sm p-2 bg-muted/50 rounded"
                                              >
                                                <div className="flex items-center gap-2 mb-1">
                                                  <span className="font-medium">
                                                    {m.author?.first_name} {m.author?.last_name}
                                                  </span>
                                                  <span className="text-xs text-muted-foreground">
                                                    {format(new Date(m.created_at), "dd/MM HH:mm")}
                                                  </span>
                                                </div>
                                                <p className="text-muted-foreground line-clamp-2">
                                                  {m.contenu}
                                                </p>
                                              </div>
                                            ))}
                                            {t.messages.length > 3 && (
                                              <p className="text-xs text-muted-foreground text-center">
                                                +{t.messages.length - 3} autres messages
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>

                          {/* Classes */}
                          <TabsContent value="classes">
                            <ScrollArea className="h-[400px]">
                              <div className="space-y-2 p-1">
                                {coursDetails.classes.length === 0 ? (
                                  <p className="text-muted-foreground text-center py-8">
                                    Aucune classe assignée
                                  </p>
                                ) : (
                                  coursDetails.classes.map((cl: any) => (
                                    <div 
                                      key={cl.id}
                                      className="flex items-center justify-between p-3 border rounded"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{cl.nom}</span>
                                      </div>
                                      <Badge variant="outline">{cl.niveau}</Badge>
                                    </div>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
