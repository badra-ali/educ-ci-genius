import { useState } from "react";
import { useTeacherClasses, useClassAttendance, useBulkDeclareAttendance } from "@/hooks/useTeacher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Save, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TeacherAttendance() {
  const [selectedClasse, setSelectedClasse] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [editedAttendance, setEditedAttendance] = useState<
    Record<string, { status: string; reason: string }>
  >({});

  const { data: classes, isLoading: classesLoading } = useTeacherClasses();
  const { data: attendance, isLoading: attendanceLoading } = useClassAttendance(
    selectedClasse,
    selectedDate
  );
  const bulkDeclare = useBulkDeclareAttendance();

  const uniqueClasses = classes
    ? Array.from(new Set(classes.map((c: any) => c.classe_id))).map((id) => {
        const cls = classes.find((c: any) => c.classe_id === id);
        return { id: cls.classe_id, nom: cls.classe_nom };
      })
    : [];

  const handleStatusChange = (studentId: string, status: string) => {
    setEditedAttendance((prev) => ({
      ...prev,
      [studentId]: {
        status,
        reason: prev[studentId]?.reason || "",
      },
    }));
  };

  const handleReasonChange = (studentId: string, reason: string) => {
    setEditedAttendance((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || "PRESENT",
        reason,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedClasse) {
      toast.error("Veuillez sélectionner une classe");
      return;
    }

    const rows = attendance
      ?.filter((a: any) => editedAttendance[a.student_id])
      .map((a: any) => ({
        student_id: a.student_id,
        status: editedAttendance[a.student_id].status as any,
        reason: editedAttendance[a.student_id].reason || undefined,
      }));

    if (!rows || rows.length === 0) {
      toast.error("Aucune modification");
      return;
    }

    await bulkDeclare.mutateAsync({
      date: selectedDate,
      rows,
    });

    setEditedAttendance({});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge variant="default">Présent</Badge>;
      case "ABSENT":
        return <Badge variant="destructive">Absent</Badge>;
      case "LATE":
        return <Badge variant="secondary">Retard</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getDecisionIcon = (decision: string) => {
    switch (decision) {
      case "VALIDE":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REFUSE":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Gestion des présences</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner la classe et la date</CardTitle>
          <CardDescription>Déclarez les présences pour votre classe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
              <label className="text-sm font-medium mb-2 block">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedClasse && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Appel de la classe</CardTitle>
              <Button onClick={handleSave} disabled={bulkDeclare.isPending}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <Skeleton className="h-96" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénom</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Justification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.map((att: any) => (
                    <TableRow key={att.student_id}>
                      <TableCell className="font-medium">{att.last_name}</TableCell>
                      <TableCell>{att.first_name}</TableCell>
                      <TableCell>
                        <Select
                          value={editedAttendance[att.student_id]?.status || att.status}
                          onValueChange={(value) => handleStatusChange(att.student_id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PRESENT">Présent</SelectItem>
                            <SelectItem value="ABSENT">Absent</SelectItem>
                            <SelectItem value="LATE">Retard</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Motif..."
                          value={editedAttendance[att.student_id]?.reason || att.reason}
                          onChange={(e) => handleReasonChange(att.student_id, e.target.value)}
                          className="w-full"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getDecisionIcon(att.decision)}
                          {att.justification_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(att.justification_url, "_blank")}
                            >
                              Voir
                            </Button>
                          )}
                        </div>
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
