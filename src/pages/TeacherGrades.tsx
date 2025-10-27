import { useState } from "react";
import { useTeacherClasses, useClassGrades, useBulkUpsertGrades } from "@/hooks/useTeacher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function TeacherGrades() {
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedMatiere, setSelectedMatiere] = useState("");
  const [period, setPeriod] = useState("T1");
  const [editedGrades, setEditedGrades] = useState<Record<string, number | null>>({});

  const { data: classes, isLoading: classesLoading } = useTeacherClasses();
  const { data: grades, isLoading: gradesLoading } = useClassGrades(
    selectedClasse,
    selectedMatiere,
    period
  );
  const bulkUpsert = useBulkUpsertGrades();

  const uniqueClasses = classes
    ? Array.from(new Set(classes.map((c: any) => c.classe_id))).map((id) => {
        const cls = classes.find((c: any) => c.classe_id === id);
        return { id: cls.classe_id, nom: cls.classe_nom };
      })
    : [];

  const matieres = classes
    ? classes
        .filter((c: any) => c.classe_id === selectedClasse)
        .map((c: any) => ({ id: c.matiere_id, nom: c.matiere_nom }))
    : [];

  const handleScoreChange = (studentId: string, value: string) => {
    const score = value === "" ? null : parseFloat(value);
    setEditedGrades((prev) => ({ ...prev, [studentId]: score }));
  };

  const handleSave = async () => {
    if (!selectedClasse || !selectedMatiere) {
      toast.error("Veuillez sélectionner une classe et une matière");
      return;
    }

    const rows = grades
      ?.filter((g: any) => editedGrades[g.student_id] !== undefined)
      .map((g: any) => ({
        student_id: g.student_id,
        score: editedGrades[g.student_id] || 0,
        coefficient: g.coefficient,
      }));

    if (!rows || rows.length === 0) {
      toast.error("Aucune note modifiée");
      return;
    }

    await bulkUpsert.mutateAsync({
      matiere_id: selectedMatiere,
      classe_id: selectedClasse,
      period,
      rows,
    });

    setEditedGrades({});
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestion des notes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner la classe et la matière</CardTitle>
          <CardDescription>Choisissez la classe, la matière et la période</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Classe</label>
              <Select value={selectedClasse} onValueChange={setSelectedClasse}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueClasses.map((cls: any) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Matière</label>
              <Select
                value={selectedMatiere}
                onValueChange={setSelectedMatiere}
                disabled={!selectedClasse}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {matieres.map((mat: any) => (
                    <SelectItem key={mat.id} value={mat.id}>
                      {mat.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="T1">Trimestre 1</SelectItem>
                  <SelectItem value="T2">Trimestre 2</SelectItem>
                  <SelectItem value="T3">Trimestre 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClasse && selectedMatiere && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notes de la classe</CardTitle>
              <Button onClick={handleSave} disabled={bulkUpsert.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead className="w-32">Note /20</TableHead>
                    <TableHead className="w-24">Coef.</TableHead>
                    <TableHead className="w-24">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades?.map((grade: any) => (
                    <TableRow key={grade.student_id}>
                      <TableCell className="font-medium">{grade.last_name}</TableCell>
                      <TableCell>{grade.first_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.25"
                          value={
                            editedGrades[grade.student_id] !== undefined
                              ? editedGrades[grade.student_id] || ""
                              : grade.score || ""
                          }
                          onChange={(e) => handleScoreChange(grade.student_id, e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>{grade.coefficient}</TableCell>
                      <TableCell>
                        {grade.validated && <CheckCircle className="h-4 w-4 text-green-600" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
