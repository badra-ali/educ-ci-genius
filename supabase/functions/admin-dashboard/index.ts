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

    const isAdminSysteme = roles?.some(r => r.role === 'ADMIN_SYSTEME');
    const adminEcole = roles?.find(r => r.role === 'ADMIN_ECOLE');
    
    if (!isAdminSysteme && !adminEcole) {
      throw new Error('Accès refusé: rôle admin requis');
    }

    const etablissementId = adminEcole?.etablissement_id;

    // KPIs globaux ou par établissement
    const whereClause = isAdminSysteme ? {} : { etablissement_id: etablissementId };

    // Compter élèves actifs
    const { count: studentsCount } = await supabase
      .from('eleve_classes')
      .select('user_id', { count: 'exact', head: true })
      .eq('actif', true)
      .match(whereClause);

    // Compter classes actives
    const { count: classesCount } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('actif', true)
      .match(whereClause);

    // Compter enseignants
    const { count: teachersCount } = await supabase
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'ENSEIGNANT')
      .match(whereClause);

    // Assiduité de la semaine (absences)
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1);
    
    const { data: weekAttendance } = await supabase
      .from('attendance')
      .select('status')
      .gte('date', weekStart.toISOString().split('T')[0])
      .match(whereClause);

    const totalWeek = weekAttendance?.length || 0;
    const absentsWeek = weekAttendance?.filter(a => a.status === 'ABSENT').length || 0;
    const attendanceRate = totalWeek > 0 ? ((totalWeek - absentsWeek) / totalWeek * 100).toFixed(1) : '100.0';

    // Notes saisies vs attendues (approximation)
    const { count: gradesCount } = await supabase
      .from('grades')
      .select('id', { count: 'exact', head: true })
      .match(whereClause);

    // Bulletins publiés ce trimestre
    const { count: publishedReports } = await supabase
      .from('report_cards')
      .select('id', { count: 'exact', head: true })
      .match(whereClause);

    // Messages 7 derniers jours
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const { count: messagesCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    // Justificatifs en attente
    const { count: pendingJustifications } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('decision', 'EN_ATTENTE')
      .match(whereClause);

    return new Response(
      JSON.stringify({
        studentsCount: studentsCount || 0,
        classesCount: classesCount || 0,
        teachersCount: teachersCount || 0,
        attendanceRate: parseFloat(attendanceRate),
        gradesCount: gradesCount || 0,
        publishedReports: publishedReports || 0,
        messagesCount: messagesCount || 0,
        pendingJustifications: pendingJustifications || 0,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Erreur admin-dashboard:', error);
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
