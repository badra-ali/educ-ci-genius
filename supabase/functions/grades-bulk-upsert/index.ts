import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GradeRow {
  student_id: string;
  score: number;
  coefficient?: number;
}

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

    const { matiere_id, classe_id, period, rows } = await req.json();

    if (!matiere_id || !classe_id || !period || !rows || !Array.isArray(rows)) {
      throw new Error('Paramètres manquants ou invalides');
    }

    // Verify teacher teaches this subject/class
    const { data: affectation, error: affError } = await supabase
      .from('enseignant_matieres')
      .select('id')
      .eq('user_id', user.id)
      .eq('matiere_id', matiere_id)
      .eq('classe_id', classe_id)
      .single();

    if (affError || !affectation) {
      throw new Error('Vous n\'êtes pas affecté à cette classe/matière');
    }

    // Get etablissement_id
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('etablissement_id')
      .eq('user_id', user.id)
      .single();

    if (!userRole?.etablissement_id) {
      throw new Error('Établissement non trouvé');
    }

    // Prepare grades for upsert
    const gradesData = rows.map((row: GradeRow) => ({
      student_id: row.student_id,
      matiere_id,
      teacher_id: user.id,
      etablissement_id: userRole.etablissement_id,
      period,
      score: row.score,
      coefficient: row.coefficient || 1.0,
      validated: false
    }));

    // Upsert grades
    const { data: upsertedGrades, error: upsertError } = await supabase
      .from('grades')
      .upsert(gradesData, {
        onConflict: 'student_id,matiere_id,period',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      throw upsertError;
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: 'bulk_grades_saved',
      props: {
        matiere_id,
        classe_id,
        period,
        count: rows.length
      }
    });

    return new Response(JSON.stringify({
      success: true,
      count: upsertedGrades?.length || 0,
      grades: upsertedGrades
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in grades-bulk-upsert:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
