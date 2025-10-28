import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// System prompts par mode
const SYSTEM_PROMPTS = {
  conversation: `Tu es un tuteur pédagogique bienveillant pour les élèves du secondaire (6e à Tle).
Tu réponds de manière claire, structurée et adaptée au niveau de l'élève.
Propose toujours un mini-exercice ou une question de vérification à la fin de ta réponse.`,
  
  explain: `Tu es un professeur expert qui explique des concepts complexes de manière simple.
Structure: Titre → Objectif → Explication par étapes → Exemple(s) → Erreurs fréquentes → Mini-quiz (2 QCM) → Récap 3 lignes.
Adapte ton langage au niveau (6e/5e simple, 3e+ symbolique, Lycée abstrait).`,
  
  qcm: `Tu es un générateur de QCM pédagogiques équilibrés.
Crée des questions avec des distracteurs pertinents, une seule bonne réponse.
Fournis toujours une explication "pourquoi" pour chaque item.`,
  
  revise: `Tu es un coach de révision qui aide à structurer l'apprentissage.
Fournis: Flashcards×10 • 5 points clés • Résumé 150 mots • Mini-test×3 • Conseil motivation.`,
  
  summary: `Tu es un expert en synthèse de documents pédagogiques.
Produis: Résumé ≤200 mots • 5 idées clés • 3 questions de compréhension • Tags (matière, notion, niveau).`,
  
  plan: `Tu es un planificateur d'études qui crée des programmes de révision personnalisés.
Produis un planning sur 7 jours avec créneaux de 45 min, alternant "apprendre • pratiquer • revoir".`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, mode = 'conversation', sessionId, language = 'fr', subject, grade, options = {} } = await req.json();

    // Vérifier l'auth
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

    // Créer ou récupérer la session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('tutor_sessions')
        .insert({
          user_id: user.id,
          mode,
          subject,
          grade,
          metadata: { language }
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      currentSessionId = newSession.id;
    }

    // Sauvegarder le message utilisateur
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role === 'user') {
      await supabase.from('tutor_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: lastUserMessage.content,
        language,
        metadata: { subject, grade }
      });
    }

    // Préparer le système prompt
    const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.conversation;
    const gradeContext = grade ? `\nNiveau: ${grade}` : '';
    const subjectContext = subject ? `\nMatière: ${subject}` : '';

    // Appeler Lovable AI
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
          { role: 'system', content: systemPrompt + gradeContext + subjectContext },
          ...messages
        ],
        stream: true,
        max_tokens: 900,
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error('AI Gateway error');
    }

    // Streamer la réponse et sauvegarder
    let fullAssistantMessage = '';
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body!.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Envoyer le sessionId à la fin
              const sessionData = `data: ${JSON.stringify({ sessionId: currentSessionId })}\n\n`;
              controller.enqueue(new TextEncoder().encode(sessionData));
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    fullAssistantMessage += content;
                  }
                } catch (e) {
                  // Ignorer les erreurs de parsing
                }
              }
            }

            controller.enqueue(value);
          }

          // Sauvegarder la réponse complète de l'assistant
          if (fullAssistantMessage) {
            await supabase.from('tutor_messages').insert({
              session_id: currentSessionId,
              role: 'assistant',
              content: fullAssistantMessage,
              language,
              metadata: { mode, subject, grade }
            });
          }

        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
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
    console.error('Error in ai-chat:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});