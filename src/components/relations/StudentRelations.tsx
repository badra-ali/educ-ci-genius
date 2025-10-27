import { useState } from "react";
import { useProfilesByRole, useEleve, useLinkParent, useUnlinkParent, useEnrollStudent } from "@/hooks/useRelations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Eye, UserPlus, Trash2, School } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useClasses } from "@/hooks/useRelations";

export function StudentRelations() {
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showLinkParent, setShowLinkParent] = useState(false);
  const [showEnrollClass, setShowEnrollClass] = useState(false);

  const { data: students, isLoading } = useProfilesByRole("ELEVE");
  const { data: parents } = useProfilesByRole("PARENT");
  const { data: classes } = useClasses();
  const { data: studentDetails } = useEleve(selectedStudent || undefined);
  
  const linkParent = useLinkParent();
  const unlinkParent = useUnlinkParent();
  const enrollStudent = useEnrollStudent();

  const filteredStudents = students?.filter((s: any) =>
    s.profile?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.profile?.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleLinkParent = (parentId: string, lienParente: string) => {
    if (!selectedStudent) return;
    linkParent.mutate(
      { eleveId: selectedStudent, parentId, lienParente },
      { onSuccess: () => setShowLinkParent(false) }
    );
  };

  const handleEnrollClass = (classeId: string) => {
    if (!selectedStudent) return;
    enrollStudent.mutate(
      { eleveId: selectedStudent, classeId },
      { onSuccess: () => setShowEnrollClass(false) }
    );
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Rechercher un élève..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Classe</TableHead>
            <TableHead>Parents</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">Chargement...</TableCell>
            </TableRow>
          ) : (
            filteredStudents?.map((student: any) => (
              <TableRow key={student.user_id}>
                <TableCell className="font-medium">{student.profile?.last_name}</TableCell>
                <TableCell>{student.profile?.first_name}</TableCell>
                <TableCell>
                  <Badge variant="outline">-</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">-</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedStudent(student.user_id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            {student.profile?.first_name} {student.profile?.last_name}
                          </DialogTitle>
                          <DialogDescription>Relations et informations</DialogDescription>
                        </DialogHeader>
                        
                        {studentDetails && (
                          <div className="space-y-6">
                            {/* Classe */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Classe actuelle</h3>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowEnrollClass(true)}
                                >
                                  <School className="h-4 w-4 mr-2" />
                                  Changer de classe
                                </Button>
                              </div>
                              {studentDetails.classe ? (
                                <Badge>{studentDetails.classe.nom}</Badge>
                              ) : (
                                <p className="text-sm text-muted-foreground">Aucune classe</p>
                              )}
                            </div>

                            {/* Parents */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">Parents</h3>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowLinkParent(true)}
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Lier un parent
                                </Button>
                              </div>
                              <div className="space-y-2">
                                {studentDetails.parents.map((p: any) => (
                                  <div key={p.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <p className="font-medium">
                                        {p.parent?.first_name} {p.parent?.last_name}
                                      </p>
                                      <Badge variant="secondary" className="text-xs">
                                        {p.lien_parente}
                                      </Badge>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => unlinkParent.mutate({ id: p.id })}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                {studentDetails.parents.length === 0 && (
                                  <p className="text-sm text-muted-foreground">Aucun parent lié</p>
                                )}
                              </div>
                            </div>

                            {/* Enseignants */}
                            <div>
                              <h3 className="font-semibold mb-2">Enseignants</h3>
                              <div className="space-y-2">
                                {studentDetails.enseignants.map((e: any) => (
                                  <div key={e.id} className="flex items-center justify-between p-2 border rounded">
                                    <div>
                                      <p className="font-medium">
                                        {e.enseignant?.first_name} {e.enseignant?.last_name}
                                      </p>
                                      <Badge variant="outline" className="text-xs">
                                        {e.matiere?.nom}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                                {studentDetails.enseignants.length === 0 && (
                                  <p className="text-sm text-muted-foreground">Aucun enseignant</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Dialog pour lier un parent */}
      <Dialog open={showLinkParent} onOpenChange={setShowLinkParent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier un parent</DialogTitle>
            <DialogDescription>Sélectionnez un parent et le type de lien</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Parent</Label>
              <Select onValueChange={(value) => {
                const [parentId, lienParente] = value.split(":");
                handleLinkParent(parentId, lienParente);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un parent" />
                </SelectTrigger>
                <SelectContent>
                  {parents?.map((p: any) => (
                    <>
                      <SelectItem key={`${p.user_id}-pere`} value={`${p.user_id}:PERE`}>
                        {p.profile?.first_name} {p.profile?.last_name} (Père)
                      </SelectItem>
                      <SelectItem key={`${p.user_id}-mere`} value={`${p.user_id}:MERE`}>
                        {p.profile?.first_name} {p.profile?.last_name} (Mère)
                      </SelectItem>
                      <SelectItem key={`${p.user_id}-tuteur`} value={`${p.user_id}:TUTEUR`}>
                        {p.profile?.first_name} {p.profile?.last_name} (Tuteur)
                      </SelectItem>
                    </>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog pour inscrire dans une classe */}
      <Dialog open={showEnrollClass} onOpenChange={setShowEnrollClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inscrire dans une classe</DialogTitle>
            <DialogDescription>Sélectionnez la nouvelle classe</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Classe</Label>
              <Select onValueChange={(value) => handleEnrollClass(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom} - {c.etablissement?.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
