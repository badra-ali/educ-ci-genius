import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (!userData.user) {
      throw new Error('Non autorisé');
    }

    // Vérifier le rôle admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role, etablissement_id')
      .eq('user_id', userData.user.id);

    const isAdminSysteme = roles?.some(r => r.role === 'ADMIN_SYSTEME');
    const adminEcole = roles?.find(r => r.role === 'ADMIN_ECOLE');
    
    if (!isAdminSysteme && !adminEcole) {
      throw new Error('Accès refusé');
    }

    const { role: filterRole, etablissement_id } = await req.json();

    // Construire la requête selon le filtre de rôle
    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        avatar_url,
        phone,
        user_roles!inner(role, etablissement_id),
        etablissements:user_roles(etablissements(nom))
      `);

    // Filtrer par établissement si admin école
    if (!isAdminSysteme && adminEcole) {
      query = query.eq('user_roles.etablissement_id', adminEcole.etablissement_id);
    } else if (etablissement_id) {
      query = query.eq('user_roles.etablissement_id', etablissement_id);
    }

    // Filtrer par rôle si spécifié
    if (filterRole) {
      query = query.eq('user_roles.role', filterRole);
    }

    const { data: users, error } = await query;

    if (error) throw error;

    // Enrichir avec des infos spécifiques selon le rôle
    const enrichedUsers = await Promise.all(
      users.map(async (user: any) => {
        const userRole = user.user_roles[0]?.role;
        let additionalInfo = {};

        if (userRole === 'ELEVE') {
          const { data: classInfo } = await supabase
            .from('eleve_classes')
            .select('classes(nom, niveau)')
            .eq('user_id', user.id)
            .eq('actif', true)
            .single();
          
          additionalInfo = { classe: classInfo?.classes };
        } else if (userRole === 'ENSEIGNANT') {
          const { data: subjects } = await supabase
            .from('enseignant_matieres')
            .select('matieres(nom)')
            .eq('user_id', user.id);
          
          additionalInfo = { matieres: subjects?.map((s: any) => s.matieres.nom) };
        } else if (userRole === 'PARENT') {
          const { count: childrenCount } = await supabase
            .from('parent_eleves')
            .select('eleve_id', { count: 'exact', head: true })
            .eq('parent_id', user.id);
          
          additionalInfo = { enfants_count: childrenCount };
        }

        return {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
          phone: user.phone,
          role: userRole,
          etablissement: user.etablissements?.[0]?.etablissements?.nom,
          ...additionalInfo,
        };
      })
    );

    return new Response(
      JSON.stringify({ users: enrichedUsers }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Erreur admin-users-list:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
