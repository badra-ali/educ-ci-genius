import { useState } from "react";
import { useClasses, useClasse } from "@/hooks/useRelations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";

export function ClassRelations() {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  const { data: classes, isLoading } = useClasses();
  const { data: classDetails } = useClasse(selectedClass || undefined);

  const filteredClasses = classes?.filter((c: any) =>
    c.nom?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher une classe..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Niveau</TableHead>
            <TableHead>Établissement</TableHead>
            <TableHead>Élèves</TableHead>
            <TableHead>Enseignants</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">Chargement...</TableCell>
            </TableRow>
          ) : (
            filteredClasses?.map((classe: any) => (
              <TableRow key={classe.id}>
                <TableCell className="font-medium">{classe.nom}</TableCell>
                <TableCell>{classe.niveau}</TableCell>
                <TableCell>{classe.etablissement?.nom}</TableCell>
                <TableCell>
                  <Badge variant="outline">-</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">-</Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedClass(classe.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{classe.nom}</DialogTitle>
                        <DialogDescription>
                          {classe.etablissement?.nom} - {classe.niveau}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {classDetails && (
                        <div className="space-y-6">
                          {/* Élèves */}
                          <div>
                            <h3 className="font-semibold mb-3">
                              Élèves ({classDetails.eleves.length}/{classe.capacite_max || "∞"})
                            </h3>
                            <div className="grid gap-2">
                              {classDetails.eleves.map((e: any) => (
                                <div key={e.id} className="p-2 border rounded flex items-center justify-between">
                                  <span className="text-sm">
                                    {e.eleve?.first_name} {e.eleve?.last_name}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {e.annee_scolaire}
                                  </Badge>
                                </div>
                              ))}
                              {classDetails.eleves.length === 0 && (
                                <p className="text-sm text-muted-foreground">Aucun élève inscrit</p>
                              )}
                            </div>
                          </div>

                          {/* Enseignants */}
                          <div>
                            <h3 className="font-semibold mb-3">
                              Enseignants ({classDetails.enseignants.length})
                            </h3>
                            <div className="grid gap-2">
                              {classDetails.enseignants.map((e: any) => (
                                <div key={e.id} className="p-2 border rounded flex items-center justify-between">
                                  <div>
                                    <p className="text-sm font-medium">
                                      {e.enseignant?.first_name} {e.enseignant?.last_name}
                                    </p>
                                    <Badge variant="outline" className="text-xs">
                                      {e.matiere?.nom}
                                    </Badge>
                                  </div>
                                  {e.principal && (
                                    <Badge variant="secondary" className="text-xs">
                                      Principal
                                    </Badge>
                                  )}
                                </div>
                              ))}
                              {classDetails.enseignants.length === 0 && (
                                <p className="text-sm text-muted-foreground">Aucun enseignant affecté</p>
                              )}
                            </div>
                          </div>
                        </div>
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
