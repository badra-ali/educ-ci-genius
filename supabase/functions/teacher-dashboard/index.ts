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

    // Get today's schedule
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase().substring(0, 3);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    const { data: todaySchedule } = await supabase
      .from('schedule')
      .select(`
        *,
        classe:classes(id, nom),
        matiere:matieres(id, nom, couleur)
      `)
      .eq('teacher_id', user.id)
      .eq('day', today)
      .gte('end_time', currentTime)
      .order('start_time', { ascending: true })
      .limit(3);

    // Get assignments to grade
    const { data: submissionsToGrade, count: submissionsCount } = await supabase
      .from('rendus_devoir')
      .select(`
        id,
        devoir:devoirs!inner(
          id,
          titre,
          cours:cours!inner(enseignant_id)
        )
      `, { count: 'exact' })
      .eq('statut', 'rendu')
      .eq('devoir.cours.enseignant_id', user.id);

    // Get unread messages
    const { data: threads } = await supabase
      .from('threads')
      .select('id, participants')
      .contains('participants', [user.id]);

    let unreadCount = 0;
    if (threads) {
      for (const thread of threads) {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .not('author_id', 'eq', user.id)
          .not('read_by', 'cs', `{${user.id}}`);
        unreadCount += count || 0;
      }
    }

    // Get class averages
    const { data: teacherClasses } = await supabase.rpc('get_teacher_classes', {
      p_teacher_id: user.id
    });

    const classAverages = [];
    if (teacherClasses) {
      for (const tc of teacherClasses) {
        const avg = await supabase.rpc('calculate_class_average', {
          p_classe_id: tc.classe_id,
          p_matiere_id: tc.matiere_id,
          p_period: 'T1'
        });
        
        classAverages.push({
          class_id: tc.classe_id,
          class_name: tc.classe_nom,
          subject_id: tc.matiere_id,
          subject_name: tc.matiere_nom,
          average: avg.data || 0
        });
      }
    }

    // Get upcoming assignments
    const { data: upcomingAssignments, count: assignmentsCount } = await supabase
      .from('devoirs')
      .select(`
        id,
        titre,
        deadline,
        cours!inner(enseignant_id)
      `, { count: 'exact' })
      .eq('cours.enseignant_id', user.id)
      .gte('deadline', new Date().toISOString())
      .eq('actif', true)
      .order('deadline', { ascending: true })
      .limit(5);

    const dashboard = {
      todaySchedule: todaySchedule || [],
      workload: {
        assignmentsOpen: assignmentsCount || 0,
        submissionsToGrade: submissionsCount || 0,
        messagesUnread: unreadCount
      },
      classAverages,
      upcomingAssignments: upcomingAssignments || [],
      alerts: []
    };

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: 'teacher_viewed_dashboard',
      props: {}
    });

    return new Response(JSON.stringify(dashboard), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in teacher-dashboard:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
