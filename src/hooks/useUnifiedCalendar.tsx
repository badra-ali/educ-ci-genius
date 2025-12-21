import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: "schedule" | "deadline" | "exam";
  color: string;
  details?: string;
  room?: string;
  teacher?: string;
}

const DAYS_MAP: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 0,
};

export const useUnifiedCalendar = () => {
  return useQuery({
    queryKey: ["unified-calendar"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get student's class
      const { data: eleveClasse } = await supabase
        .from("eleve_classes")
        .select("classe_id")
        .eq("user_id", user.id)
        .eq("actif", true)
        .single();

      const events: CalendarEvent[] = [];

      // Fetch schedule if student has a class
      if (eleveClasse) {
        const { data: scheduleData } = await supabase
          .from("schedule")
          .select(`
            *,
            matiere:matieres(nom, couleur),
            teacher:profiles!schedule_teacher_id_fkey(first_name, last_name)
          `)
          .eq("classe_id", eleveClasse.classe_id);

        if (scheduleData) {
          // Generate schedule events for the next 4 weeks
          const today = new Date();
          for (let week = 0; week < 4; week++) {
            scheduleData.forEach((item: any) => {
              const dayIndex = DAYS_MAP[item.day.toLowerCase()] ?? 1;
              const eventDate = new Date(today);
              eventDate.setDate(today.getDate() + ((dayIndex - today.getDay() + 7) % 7) + week * 7);
              
              if (eventDate >= today || week === 0) {
                events.push({
                  id: `schedule-${item.id}-${week}`,
                  title: item.matiere?.nom || "Cours",
                  date: eventDate,
                  startTime: item.start_time,
                  endTime: item.end_time,
                  type: "schedule",
                  color: item.matiere?.couleur || "#f97316",
                  room: item.room,
                  teacher: item.teacher
                    ? `${item.teacher.first_name} ${item.teacher.last_name}`
                    : undefined,
                });
              }
            });
          }
        }
      }

      // Fetch devoirs with deadlines
      const { data: devoirsData } = await supabase
        .from("devoirs")
        .select(`
          *,
          cours:cours(titre, matiere:matieres(nom, couleur))
        `)
        .eq("actif", true)
        .gte("deadline", new Date().toISOString());

      if (devoirsData) {
        devoirsData.forEach((devoir: any) => {
          events.push({
            id: `devoir-${devoir.id}`,
            title: devoir.titre,
            date: new Date(devoir.deadline),
            type: "deadline",
            color: devoir.cours?.matiere?.couleur || "#ef4444",
            details: `${devoir.cours?.titre || "Devoir"} - Note sur ${devoir.note_sur}`,
          });
        });
      }

      // Fetch QCMs with deadlines (if any)
      const { data: qcmsData } = await supabase
        .from("qcms")
        .select(`
          *,
          cours:cours(titre, matiere:matieres(nom, couleur))
        `)
        .eq("statut", "publie");

      if (qcmsData) {
        qcmsData.forEach((qcm: any) => {
          // QCMs don't have explicit deadlines in schema, but we can show them as available
          events.push({
            id: `qcm-${qcm.id}`,
            title: `QCM: ${qcm.titre}`,
            date: new Date(qcm.created_at),
            type: "exam",
            color: qcm.cours?.matiere?.couleur || "#8b5cf6",
            details: qcm.description || "QCM disponible",
          });
        });
      }

      return events.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
  });
};

export const getEventsForDate = (events: CalendarEvent[], date: Date) => {
  return events.filter(
    (event) =>
      event.date.getFullYear() === date.getFullYear() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getDate() === date.getDate()
  );
};

export const getEventsForMonth = (events: CalendarEvent[], year: number, month: number) => {
  return events.filter(
    (event) =>
      event.date.getFullYear() === year && event.date.getMonth() === month
  );
};
