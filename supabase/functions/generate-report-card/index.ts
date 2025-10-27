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

    const { student_id, period } = await req.json();

    if (!student_id || !period) {
      return new Response(
        JSON.stringify({ error: 'student_id et period requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les notes de l'élève
    const { data: grades, error: gradesError } = await supabaseClient
      .from('grades')
      .select(`
        *,
        matiere:matiere_id(nom, code, coefficient)
      `)
      .eq('student_id', student_id)
      .eq('period', period)
      .eq('validated', true);

    if (gradesError) {
      console.error('Grades error:', gradesError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des notes' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!grades || grades.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Aucune note trouvée pour cette période' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculer les moyennes par matière
    const gradesBySubject = grades.reduce((acc: any, grade: any) => {
      const subjectId = grade.matiere_id;
      if (!acc[subjectId]) {
        acc[subjectId] = {
          subject: grade.matiere,
          grades: [],
          totalWeighted: 0,
          totalCoeff: 0,
        };
      }
      acc[subjectId].grades.push(grade);
      acc[subjectId].totalWeighted += grade.score * grade.coefficient;
      acc[subjectId].totalCoeff += grade.coefficient;
      return acc;
    }, {});

    const subjectAverages = Object.values(gradesBySubject).map((subject: any) => ({
      subject: subject.subject.nom,
      average: (subject.totalWeighted / subject.totalCoeff).toFixed(2),
      coefficient: subject.subject.coefficient,
    }));

    // Calculer la moyenne générale
    const totalWeighted = subjectAverages.reduce(
      (sum: number, s: any) => sum + parseFloat(s.average) * s.coefficient,
      0
    );
    const totalCoeff = subjectAverages.reduce((sum: number, s: any) => sum + s.coefficient, 0);
    const generalAverage = (totalWeighted / totalCoeff).toFixed(2);

    // Créer ou mettre à jour le bulletin
    const { data: reportCard, error: reportError } = await supabaseClient
      .from('report_cards')
      .upsert({
        student_id,
        period,
        average: parseFloat(generalAverage),
        etablissement_id: grades[0].etablissement_id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'student_id,period',
      })
      .select()
      .single();

    if (reportError) {
      console.error('Report card error:', reportError);
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la création du bulletin' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Bulletin généré pour l'élève ${student_id}, période ${period}`);

    return new Response(
      JSON.stringify({ 
        data: {
          reportCard,
          subjectAverages,
          generalAverage,
        }
      }),
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