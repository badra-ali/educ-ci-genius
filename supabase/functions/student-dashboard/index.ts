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

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get student's class
    const { data: eleveClass, error: classError } = await supabaseClient
      .from('eleve_classes')
      .select('classe_id')
      .eq('user_id', user.id)
      .eq('actif', true)
      .single();

    if (classError || !eleveClass) {
      throw new Error('No active class found');
    }

    const now = new Date();
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.toTimeString().slice(0, 8);

    // Get today's schedule
    const { data: todaySchedule } = await supabaseClient
      .from('schedule')
      .select(`
        *,
        matiere:matiere_id(nom, couleur),
        teacher:teacher_id(id)
      `)
      .eq('classe_id', eleveClass.classe_id)
      .eq('day', currentDay)
      .gte('start_time', currentTime)
      .order('start_time', { ascending: true })
      .limit(3);

    // Get grades for current period
    const currentPeriod = 'T1';
    const { data: grades } = await supabaseClient
      .from('grades')
      .select('score, coefficient, matiere_id')
      .eq('student_id', user.id)
      .eq('period', currentPeriod);

    // Get matiere names
    const matiereIds = grades ? [...new Set(grades.map(g => g.matiere_id))] : [];
    const { data: matieres } = await supabaseClient
      .from('matieres')
      .select('id, nom')
      .in('id', matiereIds);

    const matiereMap = new Map((matieres || []).map(m => [m.id, m.nom]));

    // Calculate averages by subject
    const subjectAverages: Record<string, { sum: number; coeff: number; name: string }> = {};
    let totalWeighted = 0;
    let totalCoeff = 0;

    if (grades) {
      for (const grade of grades) {
        const subjectId = grade.matiere_id;
        if (!subjectAverages[subjectId]) {
          subjectAverages[subjectId] = { sum: 0, coeff: 0, name: matiereMap.get(subjectId) || 'Unknown' };
        }
        subjectAverages[subjectId].sum += grade.score * grade.coefficient;
        subjectAverages[subjectId].coeff += grade.coefficient;
        totalWeighted += grade.score * grade.coefficient;
        totalCoeff += grade.coefficient;
      }
    }

    const averagesBySubject = Object.entries(subjectAverages).map(([id, data]) => ({
      subject: data.name,
      average: data.coeff > 0 ? data.sum / data.coeff : 0,
    }));

    const generalAverage = totalCoeff > 0 ? totalWeighted / totalCoeff : null;

    // Get attendance for current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: attendance } = await supabaseClient
      .from('attendance')
      .select('status')
      .eq('student_id', user.id)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0]);

    let attendancePct = 100;
    if (attendance && attendance.length > 0) {
      const presentCount = attendance.filter(a => a.status === 'PRESENT').length;
      attendancePct = Math.round((presentCount / attendance.length) * 100);
    }

    // Get unread messages count
    const { data: threads } = await supabaseClient
      .from('threads')
      .select('id')
      .contains('participants', [user.id]);

    let unreadMessages = 0;
    if (threads) {
      for (const thread of threads) {
        const { count } = await supabaseClient
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('thread_id', thread.id)
          .neq('author_id', user.id)
          .not('read_by', 'cs', `{${user.id}}`);

        if (count) unreadMessages += count;
      }
    }

    const response = {
      todaySchedule: todaySchedule || [],
      averages: {
        bySubject: averagesBySubject,
        general: generalAverage,
      },
      attendancePct,
      unreadMessages,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in student-dashboard:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
