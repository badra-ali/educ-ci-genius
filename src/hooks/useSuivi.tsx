import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Schedule Hooks
export const useSchedule = (classeId?: string) => {
  return useQuery({
    queryKey: ["schedule", classeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedule")
        .select(`
          *,
          matiere:matieres(nom, couleur),
          classe:classes(nom),
          teacher:profiles!schedule_teacher_id_fkey(first_name, last_name)
        `)
        .eq(classeId ? "classe_id" : "id", classeId || "")
        .order("day")
        .order("start_time");

      if (error) throw error;
      return data;
    },
    enabled: !!classeId,
  });
};

export const useMySchedule = () => {
  return useQuery({
    queryKey: ["my-schedule"],
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

      if (!eleveClasse) return [];

      const { data, error } = await supabase
        .from("schedule")
        .select(`
          *,
          matiere:matieres(nom, couleur, code),
          classe:classes(nom),
          teacher:profiles!schedule_teacher_id_fkey(first_name, last_name)
        `)
        .eq("classe_id", eleveClasse.classe_id)
        .order("day")
        .order("start_time");

      if (error) throw error;
      return data;
    },
  });
};

// Grades Hooks
export const useGrades = (studentId?: string, period?: string) => {
  return useQuery({
    queryKey: ["grades", studentId, period],
    queryFn: async () => {
      let query = supabase
        .from("grades")
        .select(`
          *,
          matiere:matieres(nom, couleur, code, coefficient),
          teacher:profiles!grades_teacher_id_fkey(first_name, last_name)
        `);

      if (studentId) query = query.eq("student_id", studentId);
      if (period) query = query.eq("period", period);

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useMyGrades = (period?: string) => {
  return useQuery({
    queryKey: ["my-grades", period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("grades")
        .select(`
          *,
          matiere:matieres(nom, couleur, code, coefficient),
          teacher:profiles!grades_teacher_id_fkey(first_name, last_name)
        `)
        .eq("student_id", user.id);

      if (period) query = query.eq("period", period);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useAddGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (grade: any) => {
      const { data, error } = await supabase
        .from("grades")
        .insert(grade)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grades"] });
      queryClient.invalidateQueries({ queryKey: ["my-grades"] });
      toast.success("Note ajoutée avec succès");
    },
  });
};

// Attendance Hooks
export const useAttendance = (studentId?: string, month?: string) => {
  return useQuery({
    queryKey: ["attendance", studentId, month],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("*");

      if (studentId) query = query.eq("student_id", studentId);
      if (month) {
        const startDate = new Date(month);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        query = query
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0]);
      }

      query = query.order("date", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useMyAttendance = (month?: string) => {
  return useQuery({
    queryKey: ["my-attendance", month],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("attendance")
        .select("*")
        .eq("student_id", user.id);

      if (month) {
        const startDate = new Date(month);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        query = query
          .gte("date", startDate.toISOString().split('T')[0])
          .lte("date", endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query.order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, justification_url }: { id: string; justification_url: string }) => {
      const { data, error } = await supabase
        .from("attendance")
        .update({ justification_url, validated: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["my-attendance"] });
      toast.success("Justificatif soumis avec succès");
    },
  });
};

// Report Card Hook
export const useReportCard = (studentId: string, period: string) => {
  return useQuery({
    queryKey: ["report-card", studentId, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_cards")
        .select("*")
        .eq("student_id", studentId)
        .eq("period", period)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!studentId && !!period,
  });
};

// Calculate average from grades
export const calculateAverage = (grades: any[]) => {
  if (!grades || grades.length === 0) return 0;

  const totalPoints = grades.reduce((sum, grade) => {
    const coef = grade.matiere?.coefficient || grade.coefficient || 1;
    return sum + (grade.score * coef);
  }, 0);

  const totalCoefficients = grades.reduce((sum, grade) => {
    return sum + (grade.matiere?.coefficient || grade.coefficient || 1);
  }, 0);

  return totalCoefficients > 0 ? (totalPoints / totalCoefficients).toFixed(2) : 0;
};

// Calculate attendance stats
export const calculateAttendanceStats = (attendance: any[]) => {
  if (!attendance || attendance.length === 0) {
    return { absences: 0, retards: 0, presenceRate: 100 };
  }

  const absences = attendance.filter(a => a.status === 'ABSENT').length;
  const retards = attendance.filter(a => a.status === 'LATE').length;
  const presents = attendance.filter(a => a.status === 'PRESENT').length;
  const total = attendance.length;

  const presenceRate = total > 0 ? parseFloat(((presents / total) * 100).toFixed(1)) : 100;

  return { absences, retards, presenceRate };
};
