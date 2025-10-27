import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formData = await req.formData();
    const attendanceId = formData.get('attendance_id') as string;
    const reason = formData.get('reason') as string;
    const file = formData.get('file') as File;

    if (!attendanceId) {
      return new Response(
        JSON.stringify({ error: 'attendance_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'absence appartient à l'élève
    const { data: attendance, error: attendanceError } = await supabaseClient
      .from('attendance')
      .select('*, students!inner(user_id)')
      .eq('id', attendanceId)
      .single();

    if (attendanceError || !attendance || attendance.students.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Absence non trouvée ou accès refusé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let justificationUrl = null;

    // Upload du fichier si fourni
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${attendanceId}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from('justifications')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Erreur lors de l\'upload du fichier' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: urlData } = supabaseClient.storage
        .from('justifications')
        .getPublicUrl(fileName);

      justificationUrl = urlData.publicUrl;
    }

    // Mettre à jour l'enregistrement d'assiduité
    const { data: updated, error: updateError } = await supabaseClient
      .from('attendance')
      .update({
        reason: reason || attendance.reason,
        justification_url: justificationUrl || attendance.justification_url,
        validated: false, // En attente de validation
      })
      .eq('id', attendanceId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la mise à jour' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Justification soumise pour l'absence ${attendanceId} par l'élève ${user.id}`);

    return new Response(
      JSON.stringify({ data: updated }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});