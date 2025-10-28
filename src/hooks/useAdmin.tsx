import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types
export interface AdminDashboardData {
  studentsCount: number;
  classesCount: number;
  teachersCount: number;
  attendanceRate: number;
  gradesCount: number;
  publishedReports: number;
  messagesCount: number;
  pendingJustifications: number;
}

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  role: string;
  etablissement?: string;
  classe?: any;
  matieres?: string[];
  enfants_count?: number;
}

// Hook: Dashboard admin
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-dashboard', {
        method: 'POST'
      });
      
      if (error) throw error;
      return data as AdminDashboardData;
    },
    staleTime: 30000, // 30 secondes
  });
};

// Hook: Liste des utilisateurs par rôle
export const useUsersList = (role?: string, etablissementId?: string) => {
  return useQuery({
    queryKey: ['admin-users', role, etablissementId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-users-list', {
        body: { role, etablissement_id: etablissementId }
      });
      
      if (error) throw error;
      return data.users as UserListItem[];
    },
  });
};

// Hook: Établissements (ADMIN_SYSTEME)
export const useEtablissements = () => {
  return useQuery({
    queryKey: ['etablissements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etablissements')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook: Créer/Modifier établissement
export const useUpsertEtablissement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (etablissement: any) => {
      const { data, error } = await supabase
        .from('etablissements')
        .upsert(etablissement)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etablissements'] });
      toast.success('Établissement enregistré');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
};

// Hook: Classes
export const useClasses = (etablissementId?: string) => {
  return useQuery({
    queryKey: ['classes', etablissementId],
    queryFn: async () => {
      let query = supabase
        .from('classes')
        .select('*, etablissements(nom)')
        .eq('actif', true)
        .order('nom');
      
      if (etablissementId) {
        query = query.eq('etablissement_id', etablissementId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook: Créer/Modifier classe
export const useUpsertClasse = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (classe: any) => {
      const { data, error } = await supabase
        .from('classes')
        .upsert(classe)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Classe enregistrée');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
};

// Hook: Matières
export const useMatieres = (etablissementId?: string) => {
  return useQuery({
    queryKey: ['matieres', etablissementId],
    queryFn: async () => {
      let query = supabase
        .from('matieres')
        .select('*')
        .eq('actif', true)
        .order('nom');
      
      if (etablissementId) {
        query = query.eq('etablissement_id', etablissementId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook: Créer/Modifier matière
export const useUpsertMatiere = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (matiere: any) => {
      const { data, error } = await supabase
        .from('matieres')
        .upsert(matiere)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matieres'] });
      toast.success('Matière enregistrée');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
};

// Hook: Verrouiller période de notes
export const useLockGradingPeriod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ etablissement_id, period }: { etablissement_id: string; period: string }) => {
      const { data, error } = await supabase.functions.invoke('admin-grades-lock-period', {
        body: { etablissement_id, period }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Période verrouillée');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
};

// Hook: Justificatifs en attente
export const usePendingAttendance = (etablissementId?: string) => {
  return useQuery({
    queryKey: ['pending-attendance', etablissementId],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles:student_id(first_name, last_name),
          classes:eleve_classes!inner(classes(nom))
        `)
        .eq('decision', 'EN_ATTENTE')
        .order('date', { ascending: false });
      
      if (etablissementId) {
        query = query.eq('etablissement_id', etablissementId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook: Décider justificatif
export const useDecideAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attendance_id, decision, note }: { 
      attendance_id: string; 
      decision: 'VALIDE' | 'REFUSE'; 
      note?: string 
    }) => {
      const { data, error } = await supabase.functions.invoke('admin-attendance-decide', {
        body: { attendance_id, decision, note }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-attendance'] });
      toast.success('Décision enregistrée');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
};

// Hook: Settings globaux
export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .order('key');
      
      if (error) throw error;
      return data;
    },
  });
};

// Hook: Settings établissement
export const useEtabSettings = (etablissementId: string) => {
  return useQuery({
    queryKey: ['etab-settings', etablissementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('etab_settings')
        .select('*')
        .eq('etablissement_id', etablissementId)
        .order('key');
      
      if (error) throw error;
      return data;
    },
    enabled: !!etablissementId,
  });
};

// Hook: Upsert setting
export const useUpsertSetting = (isGlobal: boolean = false) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (setting: any) => {
      const table = isGlobal ? 'settings' : 'etab_settings';
      const { data, error } = await supabase
        .from(table)
        .upsert(setting)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: isGlobal ? ['settings'] : ['etab-settings'] });
      toast.success('Paramètre enregistré');
    },
    onError: (error: any) => {
      toast.error('Erreur: ' + error.message);
    },
  });
};
