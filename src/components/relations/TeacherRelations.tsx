import { useState } from "react";
import { useProfilesByRole, useEnseignant, useAssignTeacher, useUnassignTeacher, useClasses, useMatieres } from "@/hooks/useRelations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, UserPlus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export function TeacherRelations() {
  const [search, setSearch] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [showAssign, setShowAssign] = useState(false);
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedMatiere, setSelectedMatiere] = useState("");

  const { data: teachers, isLoading } = useProfilesByRole("ENSEIGNANT");
  const { data: classes } = useClasses();
  const { data: matieres } = useMatieres();
  const { data: teacherDetails } = useEnseignant(selectedTeacher || undefined);
  
  const assignTeacher = useAssignTeacher();
  const unassignTeacher = useUnassignTeacher();

  const filteredTeachers = teachers?.filter((t: any) =>
    t.profile?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.profile?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (!selectedTeacher || !selectedClasse || !selectedMatiere) return;
    assignTeacher.mutate(
      {
        enseignantId: selectedTeacher,
        classeId: selectedClasse,
        matiereId: selectedMatiere,
      },
      {
        onSuccess: () => {
          setShowAssign(false);
          setSelectedClasse("");
          setSelectedMatiere("");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un enseignant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Classes</TableHead>
            <TableHead>Matières</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Chargement...</TableCell>
            </TableRow>
          ) : (
            filteredTeachers?.map((teacher: any) => (
              <TableRow key={teacher.user_id}>
                <TableCell className="font-medium">{teacher.profile?.last_name}</TableCell>
                <TableCell>{teacher.profile?.first_name}</TableCell>
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
                        onClick={() => setSelectedTeacher(teacher.user_id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {teacher.profile?.first_name} {teacher.profile?.last_name}
                        </DialogTitle>
                        <DialogDescription>Affectations et classes</DialogDescription>
                      </DialogHeader>
                      
                      {teacherDetails && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Affectations</h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAssign(true)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Nouvelle affectation
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {teacherDetails.affectations.map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <p className="font-medium">{a.classe?.nom}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {a.matiere?.nom}
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => unassignTeacher.mutate({ id: a.id })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {teacherDetails.affectations.length === 0 && (
                              <p className="text-sm text-muted-foreground">Aucune affectation</p>
                            )}
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

      {/* Dialog pour affecter */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle affectation</DialogTitle>
            <DialogDescription>Affecter l'enseignant à une classe et une matière</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Classe</Label>
              <Select value={selectedClasse} onValueChange={setSelectedClasse}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Matière</Label>
              <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {matieres?.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} className="w-full">
              Affecter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
