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
    const { subject, grade, theme, count = 10, mix = { easy: 0.4, medium: 0.4, hard: 0.2 } } = await req.json();

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

    // Calculer la distribution
    const easyCount = Math.round(count * mix.easy);
    const mediumCount = Math.round(count * mix.medium);
    const hardCount = count - easyCount - mediumCount;

    const systemPrompt = `Tu es un générateur de QCM pédagogiques pour ${subject} niveau ${grade}.
Génère exactement ${count} questions sur le thème "${theme}".
Distribution: ${easyCount} faciles, ${mediumCount} moyennes, ${hardCount} difficiles.

Chaque question doit avoir:
- Une question claire et précise
- 4 choix de réponse (A, B, C, D)
- UNE SEULE bonne réponse
- Des distracteurs pertinents et plausibles
- Une explication "pourquoi" pour la bonne réponse

Réponds UNIQUEMENT avec un JSON valide (pas de markdown):
{
  "items": [
    {
      "q": "Question ?",
      "choices": ["A", "B", "C", "D"],
      "answer": "B",
      "why": "Explication de la bonne réponse",
      "level": "easy|medium|hard",
      "skill": "compétence visée"
    }
  ]
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
          { role: 'user', content: `Génère ${count} questions de QCM sur: ${theme}` }
        ],
        temperature: 0.8,
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

    // Nettoyer le markdown si présent
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const qcmData = JSON.parse(content);

    // Sauvegarder dans la DB
    const { data: savedQCM, error: saveError } = await supabase
      .from('generated_qcms')
      .insert({
        user_id: user.id,
        subject,
        grade,
        theme,
        items: qcmData.items
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving QCM:', saveError);
      throw saveError;
    }

    return new Response(
      JSON.stringify({
        id: savedQCM.id,
        items: qcmData.items,
        scoring: {
          correct: 1,
          wrong: 0,
          time_limit_sec: 45
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-qcm-generate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});