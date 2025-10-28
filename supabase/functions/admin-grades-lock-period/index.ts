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

    const isAdminEcole = roles?.some(r => r.role === 'ADMIN_ECOLE' || r.role === 'ADMIN_SYSTEME');
    
    if (!isAdminEcole) {
      throw new Error('Accès refusé: rôle admin requis');
    }

    const { etablissement_id, period } = await req.json();

    if (!etablissement_id || !period) {
      throw new Error('etablissement_id et period requis');
    }

    // Appeler la fonction de verrouillage
    const { error: lockError } = await supabase.rpc('lock_grading_period', {
      _etablissement_id: etablissement_id,
      _period: period
    });

    if (lockError) throw lockError;

    // Enregistrer dans l'audit log
    await supabase.from('audit_log').insert({
      user_id: userData.user.id,
      action: 'LOCK_PERIOD',
      entity_type: 'grades',
      entity_id: etablissement_id,
      new_data: { period, locked_at: new Date().toISOString() }
    });

    console.log(`Période ${period} verrouillée pour établissement ${etablissement_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Période ${period} verrouillée avec succès` 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Erreur admin-grades-lock-period:', error);
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
