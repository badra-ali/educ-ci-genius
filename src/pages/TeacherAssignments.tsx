import { useDevoirs } from "@/hooks/useDevoirs";
import { useAssignmentSubmissions, useGradeSubmission } from "@/hooks/useTeacher";
import { useCours } from "@/hooks/useCours";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

export default function TeacherAssignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    cours_id: "",
    titre: "",
    consignes: "",
    deadline: "",
  });

  const { devoirsList: assignments, loading: isLoading, createDevoir } = useDevoirs();
  const { data: submissions } = useAssignmentSubmissions(selectedAssignment || undefined);
  const { coursList: courses } = useCours();
  const gradeSubmission = useGradeSubmission();

  const [gradingData, setGradingData] = useState<Record<string, { note: string; commentaire: string }>>({});

  const handleCreateAssignment = async () => {
    if (!newAssignment.cours_id || !newAssignment.titre || !newAssignment.deadline) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    await createDevoir({
      cours_id: newAssignment.cours_id,
      titre: newAssignment.titre,
      consignes: newAssignment.consignes,
      deadline: new Date(newAssignment.deadline).toISOString(),
      note_sur: 20,
    });

    setShowCreateDialog(false);
    setNewAssignment({ cours_id: "", titre: "", consignes: "", deadline: "" });
  };

  const handleGrade = async (submissionId: string) => {
    const data = gradingData[submissionId];
    if (!data || !data.note) {
      toast.error("Veuillez entrer une note");
      return;
    }

    await gradeSubmission.mutateAsync({
      submission_id: submissionId,
      note: parseFloat(data.note),
      commentaire: data.commentaire,
    });

    setGradingData((prev) => {
      const updated = { ...prev };
      delete updated[submissionId];
      return updated;
    });
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case "note":
        return <Badge variant="default">Noté</Badge>;
      case "rendu":
        return <Badge variant="secondary">Rendu</Badge>;
      case "en_retard":
        return <Badge variant="destructive">En retard</Badge>;
      default:
        return <Badge variant="outline">Assigné</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mes devoirs</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau devoir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau devoir</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cours</Label>
                <Select
                  value={newAssignment.cours_id}
                  onValueChange={(value) => setNewAssignment((prev) => ({ ...prev, cours_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((cours: any) => (
                      <SelectItem key={cours.id} value={cours.id}>
                        {cours.titre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titre</Label>
                <Input
                  value={newAssignment.titre}
                  onChange={(e) => setNewAssignment((prev) => ({ ...prev, titre: e.target.value }))}
                  placeholder="Titre du devoir"
                />
              </div>
              <div>
                <Label>Consignes</Label>
                <Textarea
                  value={newAssignment.consignes}
                  onChange={(e) => setNewAssignment((prev) => ({ ...prev, consignes: e.target.value }))}
                  placeholder="Consignes détaillées..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Date limite</Label>
                <Input
                  type="datetime-local"
                  value={newAssignment.deadline}
                  onChange={(e) => setNewAssignment((prev) => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateAssignment} className="w-full">
                Créer le devoir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assignments List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des devoirs</CardTitle>
            <CardDescription>Cliquez sur un devoir pour voir les rendus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assignments?.map((assignment: any) => (
                <div
                  key={assignment.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAssignment === assignment.id ? "border-primary bg-accent" : ""
                  }`}
                  onClick={() => setSelectedAssignment(assignment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{assignment.titre}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Échéance: {format(new Date(assignment.deadline), "PPP", { locale: fr })}
                      </p>
                    </div>
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submissions */}
        {selectedAssignment && (
          <Card>
            <CardHeader>
              <CardTitle>Rendus des élèves</CardTitle>
              <CardDescription>Notes et corrections</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Note</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions?.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        {sub.eleve?.first_name} {sub.eleve?.last_name}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.statut)}</TableCell>
                      <TableCell>
                        {sub.note ? (
                          <span className="font-medium">{sub.note}/20</span>
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            placeholder="Note"
                            className="w-20"
                            value={gradingData[sub.id]?.note || ""}
                            onChange={(e) =>
                              setGradingData((prev) => ({
                                ...prev,
                                [sub.id]: { ...prev[sub.id], note: e.target.value },
                              }))
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {!sub.note && sub.statut === "rendu" && (
                          <Button size="sm" onClick={() => handleGrade(sub.id)}>
                            Noter
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
