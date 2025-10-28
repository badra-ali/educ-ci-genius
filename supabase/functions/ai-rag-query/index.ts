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
    const { question, resourceId, topK = 5, language = 'fr' } = await req.json();

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

    // Générer l'embedding de la question
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: question
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const questionEmbedding = embeddingData.data[0].embedding;

    // Rechercher les chunks similaires
    const { data: chunks, error: searchError } = await supabase.rpc('match_resource_embeddings', {
      query_embedding: questionEmbedding,
      match_threshold: 0.7,
      match_count: topK,
      filter_resource_id: resourceId || null
    });

    if (searchError) {
      console.error('Search error:', searchError);
      throw searchError;
    }

    // Construire le contexte
    const context = chunks.map((chunk: any) => chunk.content).join('\n\n');

    // Appeler l'IA pour générer une réponse avec citations
    const systemPrompt = `Tu es un tuteur expert qui répond aux questions en te basant STRICTEMENT sur le contexte fourni.
Si la réponse n'est pas dans le contexte, dis "Je ne trouve pas cette information dans le document fourni."
TOUJOURS citer tes sources avec [Source: chunk_X] quand tu utilises une information.`;

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
          { role: 'user', content: `Contexte:\n${context}\n\nQuestion: ${question}` }
        ],
        max_tokens: 600,
        temperature: 0.3
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI response failed');
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices[0].message.content;

    // Préparer les citations
    const citations = chunks.map((chunk: any, idx: number) => ({
      id: chunk.id,
      content: chunk.content,
      resourceId: chunk.resource_id,
      similarity: chunk.similarity,
      index: idx
    }));

    return new Response(
      JSON.stringify({
        answer,
        citations,
        context: chunks
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in ai-rag-query:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// RPC function to match embeddings (à ajouter dans une migration si nécessaire)
/*
CREATE OR REPLACE FUNCTION match_resource_embeddings(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_resource_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  resource_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    re.resource_id,
    re.content,
    1 - (re.embedding <=> query_embedding) as similarity
  FROM resource_embeddings re
  WHERE 
    (filter_resource_id IS NULL OR re.resource_id = filter_resource_id)
    AND 1 - (re.embedding <=> query_embedding) > match_threshold
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
*/