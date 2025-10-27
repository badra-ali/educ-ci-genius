import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "ELEVE" | "ENSEIGNANT" | "PARENT" | "ADMIN_ECOLE" | "ADMIN_SYSTEME";

interface UserRoleData {
  role: AppRole;
  etablissement_id: string | null;
}

export const useUserRole = () => {
  const [roles, setRoles] = useState<UserRoleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [primaryRole, setPrimaryRole] = useState<AppRole | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRoles([]);
          setPrimaryRole(null);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc('get_user_roles', {
          _user_id: user.id
        });

        if (error) throw error;

        if (data && data.length > 0) {
          setRoles(data);
          // Le rôle principal est le premier (ou priorité: admin > enseignant > parent > élève)
          const rolePriority: AppRole[] = ['ADMIN_SYSTEME', 'ADMIN_ECOLE', 'ENSEIGNANT', 'PARENT', 'ELEVE'];
          const sortedRoles = data.sort((a: UserRoleData, b: UserRoleData) => 
            rolePriority.indexOf(a.role) - rolePriority.indexOf(b.role)
          );
          setPrimaryRole(sortedRoles[0].role);
        }
      } catch (error: any) {
        console.error("Error fetching user roles:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger vos rôles utilisateur",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [toast]);

  const hasRole = (role: AppRole) => roles.some(r => r.role === role);

  const isAdmin = hasRole("ADMIN_SYSTEME") || hasRole("ADMIN_ECOLE");

  return {
    roles,
    primaryRole,
    loading,
    hasRole,
    isAdmin,
  };
};
