import { useState, useEffect } from "react";
import { useChildren, useChildSchedule } from "@/hooks/useParent";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function ParentSchedule() {
  const [searchParams] = useSearchParams();
  const initialChild = searchParams.get("child") || "";
  
  const [selectedChild, setSelectedChild] = useState(initialChild);

  const { data: children } = useChildren();
  const { data: schedule, isLoading } = useChildSchedule(selectedChild);

  // Auto-select first child
  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0].eleve_id);
    }
  }, [children, selectedChild]);

  const days = ["LUN", "MAR", "MER", "JEU", "VEN"];
  const dayNames: Record<string, string> = {
    LUN: "Lundi",
    MAR: "Mardi",
    MER: "Mercredi",
    JEU: "Jeudi",
    VEN: "Vendredi",
  };

  const groupedSchedule = days.reduce((acc: any, day) => {
    acc[day] = schedule?.filter((s: any) => s.day === day) || [];
    return acc;
  }, {});

  const handleExportICS = async () => {
    if (!selectedChild) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-schedule-ics`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ student_id: selectedChild }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "emploi-du-temps.ics";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Emploi du temps exporté avec succès");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Emploi du temps</h1>
        {selectedChild && (
          <Button onClick={handleExportICS} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exporter (.ics)
          </Button>
        )}
      </div>

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

      {selectedChild && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Emploi du temps hebdomadaire
            </CardTitle>
            <CardDescription>Semaine type</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-96" />
            ) : schedule && schedule.length > 0 ? (
              <div className="space-y-6">
                {days.map((day) => (
                  <div key={day}>
                    <h3 className="font-semibold text-lg mb-3">{dayNames[day]}</h3>
                    {groupedSchedule[day].length > 0 ? (
                      <div className="space-y-2">
                        {groupedSchedule[day].map((session: any) => (
                          <div
                            key={session.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                            style={{
                              borderLeftWidth: "4px",
                              borderLeftColor: session.matiere?.couleur || "#3B82F6",
                            }}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-lg">{session.matiere?.nom}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {session.teacher?.first_name} {session.teacher?.last_name}
                              </div>
                              {session.room && (
                                <div className="text-sm text-muted-foreground">
                                  Salle: {session.room}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {session.start_time.substring(0, 5)} -{" "}
                                {session.end_time.substring(0, 5)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">Aucun cours ce jour</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Aucun emploi du temps disponible
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
