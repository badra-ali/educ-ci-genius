import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClasses, useMatieres, useUpsertClasse, useUpsertMatiere, useEtablissements } from "@/hooks/useAdmin";
import { useUserRole } from "@/hooks/useUserRole";
import { Plus, Edit, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminClasses() {
  const { primaryRole } = useUserRole();
  const isAdminSysteme = primaryRole === 'ADMIN_SYSTEME';

  const [selectedEtab, setSelectedEtab] = useState<string>('');
  const [openClassDialog, setOpenClassDialog] = useState(false);
  const [openMatiereDialog, setOpenMatiereDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editingMatiere, setEditingMatiere] = useState<any>(null);

  const { data: etablissements } = useEtablissements();
  const { data: classes } = useClasses(selectedEtab);
  const { data: matieres } = useMatieres(selectedEtab);
  const upsertClasse = useUpsertClasse();
  const upsertMatiere = useUpsertMatiere();

  const handleSaveClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingClass?.id,
      nom: formData.get('nom') as string,
      niveau: formData.get('niveau') as string,
      etablissement_id: formData.get('etablissement_id') as string,
      capacite_max: parseInt(formData.get('capacite_max') as string),
    };
    
    upsertClasse.mutate(data, {
      onSuccess: () => {
        setOpenClassDialog(false);
        setEditingClass(null);
      },
    });
  };

  const handleSaveMatiere = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingMatiere?.id,
      nom: formData.get('nom') as string,
      code: formData.get('code') as string,
      niveau: formData.get('niveau') as string,
      etablissement_id: formData.get('etablissement_id') as string,
      coefficient: parseFloat(formData.get('coefficient') as string),
      couleur: formData.get('couleur') as string,
    };
    
    upsertMatiere.mutate(data, {
      onSuccess: () => {
        setOpenMatiereDialog(false);
        setEditingMatiere(null);
      },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestion Classes & Matières</h1>
          <p className="text-muted-foreground">Organisez la structure pédagogique</p>
        </div>
      </div>

      {isAdminSysteme && (
        <Card>
          <CardHeader>
            <CardTitle>Filtre établissement</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEtab} onValueChange={setSelectedEtab}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Tous les établissements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous</SelectItem>
                {etablissements?.map(etab => (
                  <SelectItem key={etab.id} value={etab.id}>
                    {etab.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="classes">
        <TabsList>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="matieres">Matières</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Classes ({classes?.length || 0})</CardTitle>
                <CardDescription>Gérez les classes de l'établissement</CardDescription>
              </div>
              <Dialog open={openClassDialog} onOpenChange={setOpenClassDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingClass(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle classe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveClass}>
                    <DialogHeader>
                      <DialogTitle>{editingClass ? 'Modifier' : 'Créer'} une classe</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="nom">Nom</Label>
                        <Input id="nom" name="nom" defaultValue={editingClass?.nom} required />
                      </div>
                      <div>
                        <Label htmlFor="niveau">Niveau</Label>
                        <Input id="niveau" name="niveau" defaultValue={editingClass?.niveau} required />
                      </div>
                      {isAdminSysteme && (
                        <div>
                          <Label htmlFor="etablissement_id">Établissement</Label>
                          <Select name="etablissement_id" defaultValue={editingClass?.etablissement_id} required>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {etablissements?.map(etab => (
                                <SelectItem key={etab.id} value={etab.id}>
                                  {etab.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="capacite_max">Capacité max</Label>
                        <Input
                          id="capacite_max"
                          name="capacite_max"
                          type="number"
                          defaultValue={editingClass?.capacite_max || 40}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={upsertClasse.isPending}>
                        {upsertClasse.isPending ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {classes && classes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Établissement</TableHead>
                      <TableHead>Capacité</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((classe: any) => (
                      <TableRow key={classe.id}>
                        <TableCell className="font-medium">{classe.nom}</TableCell>
                        <TableCell><Badge variant="outline">{classe.niveau}</Badge></TableCell>
                        <TableCell>{classe.etablissements?.nom}</TableCell>
                        <TableCell>{classe.capacite_max}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingClass(classe);
                              setOpenClassDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune classe</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matieres">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Matières ({matieres?.length || 0})</CardTitle>
                <CardDescription>Gérez les matières enseignées</CardDescription>
              </div>
              <Dialog open={openMatiereDialog} onOpenChange={setOpenMatiereDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingMatiere(null)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle matière
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleSaveMatiere}>
                    <DialogHeader>
                      <DialogTitle>{editingMatiere ? 'Modifier' : 'Créer'} une matière</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="nom_mat">Nom</Label>
                        <Input id="nom_mat" name="nom" defaultValue={editingMatiere?.nom} required />
                      </div>
                      <div>
                        <Label htmlFor="code">Code</Label>
                        <Input id="code" name="code" defaultValue={editingMatiere?.code} />
                      </div>
                      <div>
                        <Label htmlFor="niveau_mat">Niveau</Label>
                        <Input id="niveau_mat" name="niveau" defaultValue={editingMatiere?.niveau} required />
                      </div>
                      <div>
                        <Label htmlFor="coefficient">Coefficient</Label>
                        <Input
                          id="coefficient"
                          name="coefficient"
                          type="number"
                          step="0.1"
                          defaultValue={editingMatiere?.coefficient || 1.0}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="couleur">Couleur</Label>
                        <Input
                          id="couleur"
                          name="couleur"
                          type="color"
                          defaultValue={editingMatiere?.couleur || '#3B82F6'}
                        />
                      </div>
                      {isAdminSysteme && (
                        <div>
                          <Label htmlFor="etablissement_id_mat">Établissement</Label>
                          <Select name="etablissement_id" defaultValue={editingMatiere?.etablissement_id} required>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {etablissements?.map(etab => (
                                <SelectItem key={etab.id} value={etab.id}>
                                  {etab.nom}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={upsertMatiere.isPending}>
                        {upsertMatiere.isPending ? 'Enregistrement...' : 'Enregistrer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {matieres && matieres.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Coefficient</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matieres.map((matiere: any) => (
                      <TableRow key={matiere.id}>
                        <TableCell className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: matiere.couleur }}
                          />
                          <span className="font-medium">{matiere.nom}</span>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{matiere.code}</Badge></TableCell>
                        <TableCell>{matiere.niveau}</TableCell>
                        <TableCell>{matiere.coefficient}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMatiere(matiere);
                              setOpenMatiereDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">Aucune matière</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
