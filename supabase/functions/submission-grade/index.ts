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

    const { submission_id, note, commentaire } = await req.json();

    if (!submission_id) {
      throw new Error('ID du rendu manquant');
    }

    // Verify submission belongs to teacher's assignment
    const { data: submission, error: subError } = await supabase
      .from('rendus_devoir')
      .select(`
        id,
        devoir:devoirs!inner(
          id,
          cours:cours!inner(id, enseignant_id)
        )
      `)
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      throw new Error('Rendu non trouvé');
    }

    const devoir = submission.devoir as any;
    if (devoir.cours.enseignant_id !== user.id) {
      throw new Error('Vous n\'êtes pas autorisé à noter ce rendu');
    }

    // Update submission
    const { data: updated, error: updateError } = await supabase
      .from('rendus_devoir')
      .update({
        note,
        commentaire_prof: commentaire,
        statut: 'note',
        note_at: new Date().toISOString(),
        graded_at: new Date().toISOString()
      })
      .eq('id', submission_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: 'submission_graded',
      props: {
        submission_id,
        note
      }
    });

    return new Response(JSON.stringify({
      success: true,
      submission: updated
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in submission-grade:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
