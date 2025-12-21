import { useState } from "react";
import { 
  useElevesWithRelations, 
  useEnseignantsWithNotes,
  useClassesWithSchedule,
  useNotesWithBulletins,
  useEleveDetails,
  useSuiviScolaireStats 
} from "@/hooks/useSuiviScolaireRelations";
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
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Eye, 
  GraduationCap, 
  Users,
  Calendar,
  FileText,
  ClipboardCheck,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function SuiviScolaireRelations() {
  const [search, setSearch] = useState("");
  const [selectedEleve, setSelectedEleve] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("eleves");

  const { data: stats } = useSuiviScolaireStats();
  const { data: eleves, isLoading: loadingEleves } = useElevesWithRelations();
  const { data: enseignants, isLoading: loadingEnseignants } = useEnseignantsWithNotes();
  const { data: classes, isLoading: loadingClasses } = useClassesWithSchedule();
  const { data: bulletins, isLoading: loadingBulletins } = useNotesWithBulletins();
  const { data: eleveDetails } = useEleveDetails(selectedEleve || undefined);

  const filteredEleves = eleves?.filter((e) =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    e.classe?.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEnseignants = enseignants?.filter((e) =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredClasses = classes?.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const getPresenceColor = (taux: number) => {
    if (taux >= 90) return "text-green-500";
    if (taux >= 75) return "text-yellow-500";
    return "text-red-500";
  };

  const getMoyenneColor = (moyenne: number | null) => {
    if (moyenne === null) return "default";
    if (moyenne >= 14) return "default";
    if (moyenne >= 10) return "secondary";
    return "destructive";
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold">{stats.elevesCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Élèves inscrits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary" />
                <span className="text-2xl font-bold">{stats.notesCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Notes saisies</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-accent" />
                <span className="text-2xl font-bold">{stats.presencesCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Présences</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-2xl font-bold">{stats.schedulesCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Créneaux EDT</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-orange-500" />
                <span className="text-2xl font-bold">{stats.bulletinsCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Bulletins</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs pour les différentes vues */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="eleves" className="gap-1">
            <GraduationCap className="h-4 w-4" />
            Élèves
          </TabsTrigger>
          <TabsTrigger value="enseignants" className="gap-1">
            <Users className="h-4 w-4" />
            Enseignants
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1">
            <Calendar className="h-4 w-4" />
            Classes & EDT
          </TabsTrigger>
          <TabsTrigger value="bulletins" className="gap-1">
            <FileText className="h-4 w-4" />
            Bulletins
          </TabsTrigger>
        </TabsList>

        {/* Recherche */}
        <div className="mt-4">
          <Input
            placeholder={`Rechercher...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Élèves avec notes et présences */}
        <TabsContent value="eleves">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Moyenne</TableHead>
                <TableHead>Présences</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEleves ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Chargement...</TableCell>
                </TableRow>
              ) : filteredEleves?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aucun élève trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredEleves?.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={e.avatar_url || undefined} />
                          <AvatarFallback>
                            {e.first_name?.[0]}{e.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {e.first_name} {e.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.classe?.nom || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{e.notes_count} notes</Badge>
                    </TableCell>
                    <TableCell>
                      {e.moyenne !== null ? (
                        <Badge variant={getMoyenneColor(e.moyenne)}>
                          {e.moyenne}/20
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        {e.presences_count}
                        <XCircle className="h-3 w-3 text-red-500 ml-2" />
                        {e.absences_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getPresenceColor(e.taux_presence)}`}>
                        {e.taux_presence}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEleve(e.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <GraduationCap className="h-5 w-5" />
                              {e.first_name} {e.last_name}
                            </DialogTitle>
                            <DialogDescription>
                              {e.classe?.nom} • {e.classe?.niveau}
                            </DialogDescription>
                          </DialogHeader>
                          
                          {eleveDetails && (
                            <Tabs defaultValue="notes" className="mt-4">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="notes">
                                  Notes ({eleveDetails.notes.length})
                                </TabsTrigger>
                                <TabsTrigger value="presences">
                                  Présences ({eleveDetails.presences.length})
                                </TabsTrigger>
                                <TabsTrigger value="bulletins">
                                  Bulletins ({eleveDetails.bulletins.length})
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="notes">
                                <ScrollArea className="h-[350px]">
                                  <div className="space-y-2 p-1">
                                    {eleveDetails.notes.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-8">
                                        Aucune note
                                      </p>
                                    ) : (
                                      eleveDetails.notes.map((n: any) => (
                                        <div key={n.id} className="flex items-center justify-between p-3 border rounded">
                                          <div>
                                            <Badge 
                                              variant="outline" 
                                              style={{ borderColor: n.matiere?.couleur }}
                                            >
                                              {n.matiere?.nom || "Matière"}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground ml-2">
                                              {n.period}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant={n.score >= 10 ? "default" : "destructive"}>
                                              {n.score}/20
                                            </Badge>
                                            {n.coefficient > 1 && (
                                              <span className="text-xs text-muted-foreground">
                                                (×{n.coefficient})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </ScrollArea>
                              </TabsContent>

                              <TabsContent value="presences">
                                <ScrollArea className="h-[350px]">
                                  <div className="space-y-2 p-1">
                                    {eleveDetails.presences.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-8">
                                        Aucune donnée de présence
                                      </p>
                                    ) : (
                                      eleveDetails.presences.map((p: any) => (
                                        <div key={p.id} className="flex items-center justify-between p-3 border rounded">
                                          <div className="flex items-center gap-2">
                                            {p.status === "PRESENT" ? (
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : p.status === "ABSENT" ? (
                                              <XCircle className="h-4 w-4 text-red-500" />
                                            ) : (
                                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                                            )}
                                            <span>
                                              {format(new Date(p.date), "EEEE dd MMMM", { locale: fr })}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant={p.status === "PRESENT" ? "default" : "destructive"}>
                                              {p.status}
                                            </Badge>
                                            {p.reason && (
                                              <span className="text-xs text-muted-foreground">
                                                {p.reason}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </ScrollArea>
                              </TabsContent>

                              <TabsContent value="bulletins">
                                <ScrollArea className="h-[350px]">
                                  <div className="space-y-2 p-1">
                                    {eleveDetails.bulletins.length === 0 ? (
                                      <p className="text-center text-muted-foreground py-8">
                                        Aucun bulletin généré
                                      </p>
                                    ) : (
                                      eleveDetails.bulletins.map((b: any) => (
                                        <Card key={b.id}>
                                          <CardContent className="pt-4">
                                            <div className="flex items-center justify-between">
                                              <div>
                                                <p className="font-medium">{b.period}</p>
                                                {b.remarks && (
                                                  <p className="text-sm text-muted-foreground">
                                                    {b.remarks}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="text-right">
                                                <Badge variant="outline" className="text-lg">
                                                  {b.average?.toFixed(2)}/20
                                                </Badge>
                                                {b.rank && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    Rang: {b.rank}/{b.total_students}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
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
        </TabsContent>

        {/* Enseignants avec notes saisies */}
        <TabsContent value="enseignants">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enseignant</TableHead>
                <TableHead>Matières</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>Notes saisies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEnseignants ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Chargement...</TableCell>
                </TableRow>
              ) : filteredEnseignants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun enseignant trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnseignants?.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={e.avatar_url || undefined} />
                          <AvatarFallback>
                            {e.first_name?.[0]}{e.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {e.first_name} {e.last_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {e.matieres.length > 0 ? (
                          e.matieres.map((m, i) => (
                            <Badge key={i} variant="outline">{m}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {e.classes.length > 0 ? (
                          e.classes.map((c, i) => (
                            <Badge key={i} variant="secondary">{c}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.notes_count > 0 ? "default" : "outline"}>
                        {e.notes_count} notes
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Classes avec emploi du temps */}
        <TabsContent value="classes">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classe</TableHead>
                <TableHead>Niveau</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Élèves</TableHead>
                <TableHead>Créneaux EDT</TableHead>
                <TableHead>Matières</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingClasses ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Chargement...</TableCell>
                </TableRow>
              ) : filteredClasses?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Aucune classe trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredClasses?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.niveau}</Badge>
                    </TableCell>
                    <TableCell>{c.etablissement?.nom || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {c.eleves_count} élèves
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{c.schedule_count} créneaux</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.matieres.slice(0, 3).map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                        {c.matieres.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{c.matieres.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Bulletins */}
        <TabsContent value="bulletins">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Nb Notes</TableHead>
                <TableHead>Moyenne</TableHead>
                <TableHead>Bulletin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingBulletins ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Chargement...</TableCell>
                </TableRow>
              ) : bulletins?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucune donnée de bulletin
                  </TableCell>
                </TableRow>
              ) : (
                bulletins?.map((b, i) => (
                  <TableRow key={`${b.student_id}-${b.periode}-${i}`}>
                    <TableCell className="font-medium">{b.student_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{b.periode}</Badge>
                    </TableCell>
                    <TableCell>{b.notes_count} notes</TableCell>
                    <TableCell>
                      {b.moyenne !== null ? (
                        <Badge variant={getMoyenneColor(b.moyenne)}>
                          {b.moyenne}/20
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {b.has_bulletin ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Généré
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Non généré
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
