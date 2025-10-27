import { useState, useEffect } from "react";
import { useChildren, useChildAttendance, useJustifyChildAbsence } from "@/hooks/useParent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ParentAttendance() {
  const [searchParams] = useSearchParams();
  const initialChild = searchParams.get("child") || "";
  
  const [selectedChild, setSelectedChild] = useState(initialChild);
  const [showJustifyDialog, setShowJustifyDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: children } = useChildren();
  const { data: attendance, isLoading } = useChildAttendance(selectedChild);
  const justifyMutation = useJustifyChildAbsence();

  // Auto-select first child
  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].eleve_id);
    }
  }, [children, selectedChild]);

  const handleJustify = async () => {
    if (!selectedAttendance || !selectedChild) return;

    await justifyMutation.mutateAsync({
      student_id: selectedChild,
      attendance_id: selectedAttendance.id,
      reason,
      file: file || undefined,
    });

    setShowJustifyDialog(false);
    setReason("");
    setFile(null);
    setSelectedAttendance(null);
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

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "VALIDE":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Validé
          </Badge>
        );
      case "REFUSE":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Refusé
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
        );
    }
  };

  // Calculate stats
  const stats = {
    total: attendance?.length || 0,
    absences: attendance?.filter((a: any) => a.status === "ABSENT").length || 0,
    retards: attendance?.filter((a: any) => a.status === "LATE").length || 0,
    enAttente: attendance?.filter((a: any) => a.decision === "EN_ATTENTE").length || 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Assiduité</h1>

      <Card>
        <CardHeader>
          <CardTitle>Sélectionner l'enfant</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un enfant" />
            </SelectTrigger>
            <SelectContent>
              {children?.map((child: any) => (
                <SelectItem key={child.eleve_id} value={child.eleve_id}>
                  {child.first_name} {child.last_name} - {child.classe_nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats */}
      {selectedChild && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total jours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Absences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.absences}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Retards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.retards}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.enAttente}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance List */}
      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historique d'assiduité
            </CardTitle>
            <CardDescription>100 derniers enregistrements</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : attendance && attendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Décision</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((att: any) => (
                    <TableRow key={att.id}>
                      <TableCell>
                        {format(new Date(att.date), "PPP", { locale: fr })}
                      </TableCell>
                      <TableCell>{getStatusBadge(att.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {att.reason || "-"}
                      </TableCell>
                      <TableCell>{getDecisionBadge(att.decision)}</TableCell>
                      <TableCell>
                        {(att.status === "ABSENT" || att.status === "LATE") &&
                          att.decision === "EN_ATTENTE" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAttendance(att);
                                setShowJustifyDialog(true);
                              }}
                            >
                              Justifier
                            </Button>
                          )}
                        {att.justification_url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(att.justification_url, "_blank")}
                          >
                            Voir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun enregistrement d'assiduité
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Justify Dialog */}
      <Dialog open={showJustifyDialog} onOpenChange={setShowJustifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justifier l'absence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motif</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez le motif de l'absence..."
                rows={3}
              />
            </div>
            <div>
              <Label>Pièce justificative (optionnel)</Label>
              <Input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formats acceptés: Images (JPG, PNG) ou PDF
              </p>
            </div>
            <Button
              onClick={handleJustify}
              className="w-full"
              disabled={justifyMutation.isPending}
            >
              <Upload className="mr-2 h-4 w-4" />
              Envoyer la justification
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
