import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { useMySchedule } from "@/hooks/useSuivi";
import { ScheduleExport } from "./ScheduleExport";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];

export const ScheduleView = () => {
  const { data: schedule, isLoading } = useMySchedule();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {DAYS.map((day) => (
          <Skeleton key={day} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!schedule || schedule.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Aucun cours dans votre emploi du temps</p>
        </CardContent>
      </Card>
    );
  }

  const scheduleByDay = DAYS.reduce((acc, day) => {
    acc[day] = schedule.filter((item: any) => item.day === day);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <ScheduleExport />
      </div>
      {DAYS.map((day) => (
        <Card key={day}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {day}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleByDay[day].length === 0 ? (
              <p className="text-sm text-muted-foreground">Pas de cours</p>
            ) : (
              <div className="space-y-2">
                {scheduleByDay[day].map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    style={{
                      borderLeftWidth: '4px',
                      borderLeftColor: item.matiere?.couleur || '#3B82F6'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.matiere?.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.teacher ? `${item.teacher.first_name} ${item.teacher.last_name}` : 'Enseignant non assigné'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                        </p>
                        {item.room && (
                          <p className="text-xs text-muted-foreground">Salle {item.room}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
