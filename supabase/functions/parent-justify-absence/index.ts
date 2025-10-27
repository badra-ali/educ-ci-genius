import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Non authentifié');
    }

    const formData = await req.formData();
    const student_id = formData.get('student_id') as string;
    const attendance_id = formData.get('attendance_id') as string;
    const reason = formData.get('reason') as string;
    const file = formData.get('file') as File;

    if (!student_id || !attendance_id) {
      throw new Error('Paramètres manquants');
    }

    // Verify parent-child relationship
    const { data: isParent } = await supabase.rpc('is_parent_of_student', {
      p_parent_id: user.id,
      p_student_id: student_id
    });

    if (!isParent) {
      throw new Error('Accès non autorisé');
    }

    // Verify attendance belongs to this student
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('id, student_id')
      .eq('id', attendance_id)
      .eq('student_id', student_id)
      .single();

    if (attError || !attendance) {
      throw new Error('Absence non trouvée');
    }

    let justificationUrl = null;

    // Upload file if provided
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${student_id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('justifications')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Erreur lors de l\'upload du fichier');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('justifications')
        .getPublicUrl(fileName);

      justificationUrl = urlData.publicUrl;
    }

    // Update attendance record
    const { data: updated, error: updateError } = await supabase
      .from('attendance')
      .update({
        reason: reason || null,
        justification_url: justificationUrl,
        decision: 'EN_ATTENTE'
      })
      .eq('id', attendance_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: 'parent_submitted_justification',
      props: {
        student_id,
        attendance_id
      }
    });

    return new Response(JSON.stringify({
      success: true,
      attendance: updated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parent-justify-absence:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
