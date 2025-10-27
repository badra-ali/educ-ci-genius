import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPTS = {
  explanation: `Vous êtes "Tuteur IA", un tuteur pédagogique expert qui aide les apprenants en français ou en anglais.

Règles importantes :
- Expliquez clairement avec des exemples concrets
- Adaptez votre vocabulaire au niveau de l'apprenant
- Utilisez des analogies pour les concepts abstraits
- Structurez toujours vos explications : Introduction → Explication → Points clés
- Terminez avec un résumé et 2 questions rapides de compréhension
- Réponses ≤ 250 mots`,

  qcm: `Vous êtes "Tuteur IA", un expert en création de QCM pédagogiques.

Règles importantes :
- Générez des questions claires et sans ambiguïté
- Créez 4 options de réponse (A, B, C, D)
- Variez la difficulté (facile/moyen/difficile)
- Incluez des distracteurs plausibles mais incorrects
- Fournissez une explication pour chaque réponse
- Format JSON structuré :
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "answer": "B",
    "explanation": "...",
    "difficulty": "medium"
  }
]`,

  revision: `Vous êtes "Tuteur IA", un assistant de révision structuré et efficace.

Règles importantes :
- Créez des flashcards (question → réponse courte)
- Identifiez 5 points clés à mémoriser
- Fournissez un résumé concis (≤ 150 mots)
- Ajoutez un message d'encouragement
- Suggérez des techniques de mémorisation
- Soyez positif et motivant`,

  summary: `Vous êtes "Tuteur IA", un expert en synthèse et analyse de documents.

Règles importantes :
- Extrayez le titre et le thème principal
- Résumez en ≤ 200 mots
- Identifiez 5 idées clés
- Créez 3 questions de compréhension
- Ajoutez des tags (discipline, niveau, mots-clés)
- Structure claire et hiérarchisée`,

  default: `Vous êtes "Tuteur IA", l'assistant intelligent de la plateforme Educ-CI Genius.

Mission : aider les élèves à comprendre, réviser et pratiquer leurs leçons en français ou anglais.

Règles :
- Ton amical et clair
- Toujours inclure des exemples
- Réponses ≤ 250 mots
- Poser des questions clarificatrices si besoin
- Terminer avec une suggestion actionnable
- Ne jamais donner de code sauf si demandé explicitement`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
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

    const { messages, mode, sessionId, language } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: session, error: sessionError } = await supabase
        .from('tutor_sessions')
        .insert({
          user_id: user.id,
          language: language || 'fr',
          title: messages[0]?.content?.substring(0, 50) || 'Nouvelle conversation'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      currentSessionId = session.id;
    }

    // Save user message
    await supabase.from('tutor_messages').insert({
      session_id: currentSessionId,
      role: 'user',
      content: messages[messages.length - 1].content,
      mode: mode || null
    });

    // Select appropriate system prompt
    const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits AI épuisés. Contactez l\'administrateur.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    // Stream response back to client
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                    controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }

          // Save assistant response
          if (fullResponse) {
            await supabase.from('tutor_messages').insert({
              session_id: currentSessionId,
              role: 'assistant',
              content: fullResponse,
              mode: mode || null,
              metadata: { language: language || 'fr' }
            });
          }

          controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ sessionId: currentSessionId })}\n\n`));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in tutor-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});