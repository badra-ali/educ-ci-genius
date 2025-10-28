import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { subject, grade, target, diagnostic = {}, days = 7 } = await req.json();

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Récupérer les compétences faibles de l'utilisateur
    const { data: weakSkills } = await supabase
      .from('skill_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('subject', subject)
      .lt('mastery_level', 0.7)
      .order('mastery_level', { ascending: true })
      .limit(5);

    const weakSkillsText = weakSkills?.map(s => s.skill_code).join(', ') || 'Aucune faiblesse identifiée';
    const timePerDay = diagnostic.time_per_day || 45;

    const systemPrompt = `Tu es un planificateur d'études expert pour ${subject} niveau ${grade}.
Objectif: ${target}
Compétences à renforcer: ${weakSkillsText}
Temps disponible par jour: ${timePerDay} minutes

Crée un plan de révision sur ${days} jours avec la méthode de répétition espacée.
Chaque jour doit alterner: APPRENDRE (nouveau) • PRATIQUER (exercices) • REVOIR (consolidation).

Réponds UNIQUEMENT avec un JSON valide (pas de markdown):
{
  "plan": [
    {
      "day": 1,
      "blocks": [
        {
          "type": "learn",
          "topic": "Sujet à apprendre",
          "duration": 20,
          "resources": ["Chapitre X", "Vidéo Y"]
        },
        {
          "type": "practice",
          "topic": "Exercices sur...",
          "duration": 20,
          "exercises": ["Ex 1", "Ex 2"]
        },
        {
          "type": "review",
          "topic": "Révision de...",
          "duration": 5,
          "method": "flashcards"
        }
      ],
      "focus": "Description du focus du jour"
    }
  ],
  "tips": ["Conseil 1", "Conseil 2", "Conseil 3"]
}`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Crée un plan de révision de ${days} jours pour préparer: ${target}` }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI response failed');
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0].message.content;

    // Nettoyer le markdown
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const planData = JSON.parse(content);

    // Calculer les dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Sauvegarder le plan
    const { data: savedPlan, error: saveError } = await supabase
      .from('revision_plans')
      .insert({
        user_id: user.id,
        subject,
        grade,
        target,
        plan: planData.plan,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving plan:', saveError);
      throw saveError;
    }

    return new Response(
      JSON.stringify({
        id: savedPlan.id,
        plan: planData.plan,
        tips: planData.tips,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-revise-plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});