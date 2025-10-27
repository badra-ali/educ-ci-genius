import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTeacherDashboard = () => {
  return useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("teacher-dashboard", {
        method: "POST",
      });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useTeacherClasses = () => {
  return useQuery({
    queryKey: ["teacher-classes"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase.rpc("get_teacher_classes", {
        p_teacher_id: user.id,
      });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useTeacherSchedule = () => {
  return useQuery({
    queryKey: ["teacher-schedule"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("schedule")
        .select(
          `
          *,
          classe:classes(id, nom),
          matiere:matieres(id, nom, couleur)
        `
        )
        .eq("teacher_id", user.id)
        .order("day")
        .order("start_time");

      if (error) throw error;
      return data || [];
    },
  });
};

export const useClassRoster = (classeId?: string) => {
  return useQuery({
    queryKey: ["class-roster", classeId],
    queryFn: async () => {
      if (!classeId) return [];

      const { data: eleveClasses, error: ecError } = await supabase
        .from("eleve_classes")
        .select("user_id")
        .eq("classe_id", classeId)
        .eq("actif", true);

      if (ecError) throw ecError;
      if (!eleveClasses || eleveClasses.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", eleveClasses.map((ec) => ec.user_id));

      if (profilesError) throw profilesError;

      return profiles.map((profile) => ({
        user_id: profile.id,
        profile,
      }));
    },
    enabled: !!classeId,
  });
};

interface BulkGradesInput {
  matiere_id: string;
  classe_id: string;
  period: string;
  rows: Array<{
    student_id: string;
    score: number;
    coefficient?: number;
  }>;
}

export const useBulkUpsertGrades = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BulkGradesInput) => {
      const { data, error } = await supabase.functions.invoke("grades-bulk-upsert", {
        body: input,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grades", variables.classe_id] });
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
      toast.success("Notes enregistrées avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'enregistrement des notes", {
        description: error.message,
      });
    },
  });
};

export const useClassGrades = (classeId?: string, matiereId?: string, period?: string) => {
  return useQuery({
    queryKey: ["grades", classeId, matiereId, period],
    queryFn: async () => {
      if (!classeId || !matiereId || !period) return [];

      // Get students
      const { data: eleveClasses } = await supabase
        .from("eleve_classes")
        .select("user_id")
        .eq("classe_id", classeId)
        .eq("actif", true);

      if (!eleveClasses || eleveClasses.length === 0) return [];

      const studentIds = eleveClasses.map((ec) => ec.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studentIds);

      if (!profiles) return [];

      // Get grades
      const { data: grades } = await supabase
        .from("grades")
        .select("*")
        .eq("matiere_id", matiereId)
        .eq("period", period)
        .in("student_id", studentIds);

      // Merge
      return profiles.map((profile) => {
        const grade = grades?.find((g) => g.student_id === profile.id);
        return {
          student_id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          score: grade?.score || null,
          coefficient: grade?.coefficient || 1.0,
          validated: grade?.validated || false,
          comment: grade?.comment || "",
        };
      });
    },
    enabled: !!classeId && !!matiereId && !!period,
  });
};

interface AttendanceInput {
  date: string;
  rows: Array<{
    student_id: string;
    status: "PRESENT" | "ABSENT" | "LATE";
    reason?: string;
  }>;
}

export const useBulkDeclareAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AttendanceInput) => {
      const { data, error } = await supabase.functions.invoke("attendance-bulk-declare", {
        body: input,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
      toast.success("Présences enregistrées avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'enregistrement des présences", {
        description: error.message,
      });
    },
  });
};

export const useClassAttendance = (classeId?: string, date?: string) => {
  return useQuery({
    queryKey: ["attendance", classeId, date],
    queryFn: async () => {
      if (!classeId || !date) return [];

      // Get students
      const { data: eleveClasses } = await supabase
        .from("eleve_classes")
        .select("user_id")
        .eq("classe_id", classeId)
        .eq("actif", true);

      if (!eleveClasses || eleveClasses.length === 0) return [];

      const studentIds = eleveClasses.map((ec) => ec.user_id);

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", studentIds);

      if (!profiles) return [];

      // Get attendance
      const { data: attendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date)
        .in("student_id", studentIds);

      // Merge
      return profiles.map((profile) => {
        const att = attendance?.find((a) => a.student_id === profile.id);
        return {
          student_id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          status: att?.status || "PRESENT",
          reason: att?.reason || "",
          decision: att?.decision || "EN_ATTENTE",
          justification_url: att?.justification_url || null,
        };
      });
    },
    enabled: !!classeId && !!date,
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submission_id,
      note,
      commentaire,
    }: {
      submission_id: string;
      note: number;
      commentaire?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("submission-grade", {
        body: { submission_id, note, commentaire },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
      toast.success("Devoir noté avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la notation", {
        description: error.message,
      });
    },
  });
};

export const useAssignmentSubmissions = (devoirId?: string) => {
  return useQuery({
    queryKey: ["submissions", devoirId],
    queryFn: async () => {
      if (!devoirId) return [];

      const { data, error } = await supabase
        .from("rendus_devoir")
        .select(
          `
          *,
          eleve:profiles!rendus_devoir_eleve_id_fkey(id, first_name, last_name)
        `
        )
        .eq("devoir_id", devoirId)
        .order("rendu_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!devoirId,
  });
};
