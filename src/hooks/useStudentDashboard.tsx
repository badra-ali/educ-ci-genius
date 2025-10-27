import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

const DAYS_MAP: Record<string, string> = {
  "Monday": "Lundi",
  "Tuesday": "Mardi",
  "Wednesday": "Mercredi",
  "Thursday": "Jeudi",
  "Friday": "Vendredi",
};

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ["student-dashboard"],
    queryFn: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get user role to find class
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("etablissement_id")
        .eq("user_id", user.id)
        .eq("role", "ELEVE")
        .single();

      if (!userRoles) throw new Error("Student role not found");

      // Get student's class
      const { data: eleveClass } = await supabase
        .from("eleve_classes")
        .select("classe_id, classes(id, nom)")
        .eq("user_id", user.id)
        .eq("actif", true)
        .single();

      if (!eleveClass) throw new Error("No active class found");

      // Get today's day
      const today = new Date();
      const dayName = format(today, "EEEE");
      const frenchDay = DAYS_MAP[dayName] || dayName;
      const currentTime = format(today, "HH:mm:ss");

      // Get next course from schedule
      const { data: nextCourse } = await supabase
        .from("schedule")
        .select(`
          *,
          matiere:matiere_id(nom, couleur),
          teacher:teacher_id(id)
        `)
        .eq("classe_id", eleveClass.classe_id)
        .eq("day", frenchDay)
        .gte("start_time", currentTime)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      // Get grades for current period (T1 as default)
      const currentPeriod = "T1";
      const { data: grades } = await supabase
        .from("grades")
        .select("score, coefficient")
        .eq("student_id", user.id)
        .eq("period", currentPeriod);

      // Calculate average
      let averageGrade = null;
      if (grades && grades.length > 0) {
        const totalWeighted = grades.reduce((sum, g) => sum + (g.score * g.coefficient), 0);
        const totalCoeff = grades.reduce((sum, g) => sum + g.coefficient, 0);
        averageGrade = totalCoeff > 0 ? totalWeighted / totalCoeff : null;
      }

      // Get attendance for current month
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const { data: attendance } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", user.id)
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));

      let attendanceRate = null;
      let absencesCount = 0;
      if (attendance && attendance.length > 0) {
        const presentCount = attendance.filter(a => a.status === "PRESENT").length;
        attendanceRate = (presentCount / attendance.length) * 100;
        absencesCount = attendance.filter(a => a.status === "ABSENT").length;
      }

      // Get unread messages count
      const { data: threads } = await supabase
        .from("threads")
        .select("id, participants")
        .contains("participants", [user.id]);

      let unreadMessages = 0;
      if (threads) {
        for (const thread of threads) {
          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", thread.id)
            .neq("author_id", user.id)
            .not("read_by", "cs", `{${user.id}}`);

          if (count) unreadMessages += count;
        }
      }

      return {
        nextCourse,
        averageGrade,
        averageTrend: null, // Could calculate trend from previous period
        attendanceRate,
        absencesCount,
        unreadMessages,
      };
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true,
  });
};

export const useNextCourse = () => {
  return useQuery({
    queryKey: ["next-course"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: eleveClass } = await supabase
        .from("eleve_classes")
        .select("classe_id")
        .eq("user_id", user.id)
        .eq("actif", true)
        .single();

      if (!eleveClass) return null;

      const today = new Date();
      const dayName = format(today, "EEEE");
      const frenchDay = DAYS_MAP[dayName] || dayName;
      const currentTime = format(today, "HH:mm:ss");

      const { data } = await supabase
        .from("schedule")
        .select(`
          *,
          matiere:matiere_id(nom, couleur),
          teacher:teacher_id(id)
        `)
        .eq("classe_id", eleveClass.classe_id)
        .eq("day", frenchDay)
        .gte("start_time", currentTime)
        .order("start_time", { ascending: true })
        .limit(1)
        .maybeSingle();

      return data;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};
