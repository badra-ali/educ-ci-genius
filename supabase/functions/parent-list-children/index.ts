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

    // Get children
    const { data: children, error: childrenError } = await supabase.rpc('get_parent_children', {
      p_parent_id: user.id
    });

    if (childrenError) throw childrenError;

    // For each child, get quick KPIs
    const enrichedChildren = [];
    const currentPeriod = 'T1';

    for (const child of children || []) {
      // Average
      const { data: average } = await supabase.rpc('get_student_average', {
        p_student_id: child.eleve_id,
        p_period: currentPeriod
      });

      // Attendance rate (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: attendanceRate } = await supabase.rpc('calculate_attendance_rate', {
        p_student_id: child.eleve_id,
        p_start_date: startDate.toISOString().split('T')[0],
        p_end_date: endDate.toISOString().split('T')[0]
      });

      enrichedChildren.push({
        eleve_id: child.eleve_id,
        first_name: child.first_name,
        last_name: child.last_name,
        classe_id: child.classe_id,
        classe_nom: child.classe_nom,
        relation: child.relation,
        average: average || null,
        attendance_rate: attendanceRate || 100
      });
    }

    return new Response(JSON.stringify({ children: enrichedChildren }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parent-list-children:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
