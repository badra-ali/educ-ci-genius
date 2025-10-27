import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMyAttendance, calculateAttendanceStats } from "@/hooks/useSuivi";
import { UserCheck, Upload } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const STATUS_CONFIG = {
  PRESENT: { label: "Présent", variant: "default" as const, color: "bg-green-500" },
  ABSENT: { label: "Absent", variant: "destructive" as const, color: "bg-red-500" },
  LATE: { label: "Retard", variant: "secondary" as const, color: "bg-yellow-500" },
};

export const AttendanceView = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: attendance, isLoading } = useMyAttendance(currentMonth);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const stats = calculateAttendanceStats(attendance || []);

  return (
    <Card>
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
          <UserCheck className="w-6 h-6 text-secondary" />
        </div>
        <CardTitle>Suivi d'Assiduité</CardTitle>
        <CardDescription>
          Absences et retards enregistrés
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="p-4 border rounded-lg text-center">
            <p className="text-3xl font-bold text-primary">{stats.absences}</p>
            <p className="text-sm text-muted-foreground">Absences ce mois</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-3xl font-bold text-accent">{stats.retards}</p>
            <p className="text-sm text-muted-foreground">Retards ce mois</p>
          </div>
          <div className="p-4 border rounded-lg text-center">
            <p className="text-3xl font-bold text-secondary">{stats.presenceRate}%</p>
            <p className="text-sm text-muted-foreground">Taux de présence</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="font-semibold">Historique</h3>
          {!attendance || attendance.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Aucun enregistrement pour ce mois
            </p>
          ) : (
            <div className="space-y-2">
              {attendance.map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG].color}`}
                    />
                    <div>
                      <p className="font-medium">
                        {format(new Date(record.date), "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                      {record.reason && (
                        <p className="text-sm text-muted-foreground">{record.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG].variant}>
                      {STATUS_CONFIG[record.status as keyof typeof STATUS_CONFIG].label}
                    </Badge>
                    {record.status !== 'PRESENT' && !record.justification_url && (
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Justifier
                      </Button>
                    )}
                    {record.justification_url && (
                      <Badge variant="outline">
                        {record.validated ? "✓ Validé" : "En attente"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button variant="outline" className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Soumettre un justificatif
        </Button>
      </CardContent>
    </Card>
  );
};
