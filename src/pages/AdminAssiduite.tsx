import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { usePendingAttendance, useDecideAttendance } from "@/hooks/useAdmin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Eye, FileText } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminAssiduite() {
  const { data: pendingAttendances, isLoading } = usePendingAttendance();
  const decideAttendance = useDecideAttendance();

  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [decision, setDecision] = useState<'VALIDE' | 'REFUSE' | null>(null);
  const [note, setNote] = useState('');

  const handleDecide = () => {
    if (!selectedAttendance || !decision) return;

    decideAttendance.mutate(
      {
        attendance_id: selectedAttendance.id,
        decision,
        note: note || undefined,
      },
      {
        onSuccess: () => {
          setSelectedAttendance(null);
          setDecision(null);
          setNote('');
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      ABSENT: { variant: 'destructive', label: 'Absent' },
      LATE: { variant: 'warning', label: 'Retard' },
    };
    const s = variants[status] || { variant: 'default', label: status };
    return <Badge variant={s.variant as any}>{s.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assiduité - Justificatifs en attente</h1>
        <p className="text-muted-foreground">Décidez de la validation ou du refus des justificatifs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Justificatifs en attente ({pendingAttendances?.length || 0})</CardTitle>
          <CardDescription>Cliquez sur une ligne pour voir les détails et décider</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Chargement...</p>
          ) : pendingAttendances && pendingAttendances.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Élève</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Justificatif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingAttendances.map((att: any) => (
                  <TableRow key={att.id}>
                    <TableCell className="font-medium">
                      {format(new Date(att.date), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {att.profiles?.first_name} {att.profiles?.last_name}
                    </TableCell>
                    <TableCell>{att.classes?.[0]?.classes?.nom || '—'}</TableCell>
                    <TableCell>{getStatusBadge(att.status)}</TableCell>
                    <TableCell>
                      {att.justification_url ? (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => window.open(att.justification_url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Voir
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">Aucun fichier</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(att);
                          setDecision(null);
                          setNote('');
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(att);
                          setDecision('VALIDE');
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Valider
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedAttendance(att);
                          setDecision('REFUSE');
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Refuser
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">Aucun justificatif en attente</p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de décision */}
      <Dialog open={!!selectedAttendance && !!decision} onOpenChange={() => {
        setSelectedAttendance(null);
        setDecision(null);
        setNote('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === 'VALIDE' ? 'Valider' : 'Refuser'} le justificatif
            </DialogTitle>
            <DialogDescription>
              Élève: {selectedAttendance?.profiles?.first_name} {selectedAttendance?.profiles?.last_name}
              <br />
              Date: {selectedAttendance?.date && format(new Date(selectedAttendance.date), 'dd MMMM yyyy', { locale: fr })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="note">Note / Commentaire (optionnel)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ajoutez un commentaire si nécessaire..."
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {note.length} / 200 caractères
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSelectedAttendance(null);
              setDecision(null);
              setNote('');
            }}>
              Annuler
            </Button>
            <Button
              variant={decision === 'VALIDE' ? 'default' : 'destructive'}
              onClick={handleDecide}
              disabled={decideAttendance.isPending}
            >
              {decideAttendance.isPending ? 'Enregistrement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
