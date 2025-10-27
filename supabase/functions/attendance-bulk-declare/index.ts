import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AttendanceRow {
  student_id: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE';
  reason?: string;
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

    const { date, rows } = await req.json();

    if (!date || !rows || !Array.isArray(rows)) {
      throw new Error('Paramètres manquants ou invalides');
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

    // Prepare attendance records
    const attendanceData = rows.map((row: AttendanceRow) => ({
      student_id: row.student_id,
      date,
      status: row.status,
      reason: row.reason || null,
      declared_by: user.id,
      etablissement_id: userRole.etablissement_id,
      decision: 'EN_ATTENTE',
      validated: false
    }));

    // Upsert attendance
    const { data: upsertedAttendance, error: upsertError } = await supabase
      .from('attendance')
      .upsert(attendanceData, {
        onConflict: 'student_id,date',
        ignoreDuplicates: false
      })
      .select();

    if (upsertError) {
      throw upsertError;
    }

    // Log analytics
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      name: 'attendance_declared',
      props: {
        date,
        count: rows.length
      }
    });

    return new Response(JSON.stringify({
      success: true,
      count: upsertedAttendance?.length || 0,
      attendance: upsertedAttendance
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in attendance-bulk-declare:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
