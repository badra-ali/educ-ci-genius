import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useChildren = () => {
  return useQuery({
    queryKey: ["parent-children"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("parent-list-children", {
        method: "POST",
      });

      if (error) throw error;
      return data.children || [];
    },
  });
};

export const useParentDashboard = (childId?: string) => {
  return useQuery({
    queryKey: ["parent-dashboard", childId],
    queryFn: async () => {
      if (!childId) return null;

      const { data, error } = await supabase.functions.invoke("parent-dashboard", {
        body: { child_id: childId },
      });

      if (error) throw error;
      return data;
    },
    enabled: !!childId,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useChildSchedule = (childId?: string) => {
  return useQuery({
    queryKey: ["child-schedule", childId],
    queryFn: async () => {
      if (!childId) return [];

      // Get child's class
      const { data: eleveClasse, error: ecError } = await supabase
        .from("eleve_classes")
        .select("classe_id")
        .eq("user_id", childId)
        .eq("actif", true)
        .single();

      if (ecError || !eleveClasse) return [];

      // Get schedule
      const { data, error } = await supabase
        .from("schedule")
        .select(
          `
          *,
          matiere:matieres(id, nom, couleur),
          teacher:profiles!schedule_teacher_id_fkey(id, first_name, last_name)
        `
        )
        .eq("classe_id", eleveClasse.classe_id)
        .order("day")
        .order("start_time");

      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
};

export const useChildGrades = (childId?: string, period: string = "T1") => {
  return useQuery({
    queryKey: ["child-grades", childId, period],
    queryFn: async () => {
      if (!childId) return [];

      const { data, error } = await supabase
        .from("grades")
        .select(
          `
          *,
          matiere:matieres(id, nom, code)
        `
        )
        .eq("student_id", childId)
        .eq("period", period)
        .eq("validated", true)
        .order("matiere(nom)");

      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
};

export const useChildReportCards = (childId?: string) => {
  return useQuery({
    queryKey: ["child-report-cards", childId],
    queryFn: async () => {
      if (!childId) return [];

      const { data, error } = await supabase
        .from("report_cards")
        .select("*")
        .eq("student_id", childId)
        .order("period", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
};

export const useChildAttendance = (childId?: string) => {
  return useQuery({
    queryKey: ["child-attendance", childId],
    queryFn: async () => {
      if (!childId) return [];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", childId)
        .order("date", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!childId,
  });
};

export const useJustifyChildAbsence = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      student_id,
      attendance_id,
      reason,
      file,
    }: {
      student_id: string;
      attendance_id: string;
      reason?: string;
      file?: File;
    }) => {
      const formData = new FormData();
      formData.append("student_id", student_id);
      formData.append("attendance_id", attendance_id);
      if (reason) formData.append("reason", reason);
      if (file) formData.append("file", file);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Non authentifié");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parent-justify-absence`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la justification");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["child-attendance", variables.student_id] });
      toast.success("Justification envoyée avec succès");
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de l'envoi de la justification", {
        description: error.message,
      });
    },
  });
};

export const useParentThreads = () => {
  return useQuery({
    queryKey: ["parent-threads"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("threads")
        .select("*")
        .contains("participants", [user.id])
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};
