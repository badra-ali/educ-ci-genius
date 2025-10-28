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

    const isAdmin = roles?.some(r => r.role === 'ADMIN_ECOLE' || r.role === 'ADMIN_SYSTEME');
    
    if (!isAdmin) {
      throw new Error('Accès refusé: rôle admin requis');
    }

    const { attendance_id, decision, note } = await req.json();

    if (!attendance_id || !decision) {
      throw new Error('attendance_id et decision requis');
    }

    if (!['VALIDE', 'REFUSE'].includes(decision)) {
      throw new Error('decision doit être VALIDE ou REFUSE');
    }

    // Mettre à jour la décision
    const { data: updated, error: updateError } = await supabase
      .from('attendance')
      .update({
        decision,
        validated: true,
        validated_by: userData.user.id,
        reason: note || null
      })
      .eq('id', attendance_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Enregistrer dans l'audit log
    await supabase.from('audit_log').insert({
      user_id: userData.user.id,
      action: `ATTENDANCE_${decision}`,
      entity_type: 'attendance',
      entity_id: attendance_id,
      new_data: { decision, note, validated_at: new Date().toISOString() }
    });

    console.log(`Justificatif ${attendance_id} décidé: ${decision}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        attendance: updated 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Erreur admin-attendance-decide:', error);
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
