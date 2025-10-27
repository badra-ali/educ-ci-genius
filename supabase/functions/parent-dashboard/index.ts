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

    const { child_id } = await req.json();

    if (!child_id) {
      throw new Error('ID enfant manquant');
    }

    // Verify parent-child relationship
    const { data: isParent } = await supabase.rpc('is_parent_of_student', {
      p_parent_id: user.id,
      p_student_id: child_id
    });

    if (!isParent) {
      throw new Error('Accès non autorisé');
    }

    // Get child's class
    const { data: eleveClasse } = await supabase
      .from('eleve_classes')
      .select('classe_id')
      .eq('user_id', child_id)
      .eq('actif', true)
      .single();

    if (!eleveClasse) {
      throw new Error('Classe non trouvée');
    }

    // Today's schedule
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase().substring(0, 3);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    const { data: todaySchedule } = await supabase
      .from('schedule')
      .select(`
        *,
        matiere:matieres(id, nom, couleur)
      `)
      .eq('classe_id', eleveClasse.classe_id)
      .eq('day', today)
      .gte('end_time', currentTime)
      .order('start_time', { ascending: true })
      .limit(3);

    // Get current period (T1 by default for now)
    const currentPeriod = 'T1';

    // General average
    const { data: averageData } = await supabase.rpc('get_student_average', {
      p_student_id: child_id,
      p_period: currentPeriod
    });

    // Grades by subject
    const { data: grades } = await supabase
      .from('grades')
      .select(`
        score,
        coefficient,
        matiere:matieres(id, nom)
      `)
      .eq('student_id', child_id)
      .eq('period', currentPeriod)
      .eq('validated', true);

    const averagesBySubject = grades ? grades.reduce((acc: any[], g: any) => {
      const existing = acc.find(a => a.matiere_id === g.matiere.id);
      if (!existing) {
        acc.push({
          matiere_id: g.matiere.id,
          matiere_nom: g.matiere.nom,
          average: g.score
        });
      }
      return acc;
    }, []) : [];

    // Attendance rate (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: attendanceRate } = await supabase.rpc('calculate_attendance_rate', {
      p_student_id: child_id,
      p_start_date: startDate.toISOString().split('T')[0],
      p_end_date: endDate.toISOString().split('T')[0]
    });

    // Unread messages
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

    const dashboard = {
      todaySchedule: todaySchedule || [],
      averages: {
        general: averageData || null,
        bySubject: averagesBySubject
      },
      attendancePct: attendanceRate || 100,
      unreadMessages: unreadCount
    };

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: 'parent_viewed_dashboard',
      props: { child_id }
    });

    return new Response(JSON.stringify(dashboard), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in parent-dashboard:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
