import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GradingRequest {
  submission_id: string;
  student_text: string;
  assignment_instructions: string;
  max_score: number;
  subject?: string;
  level?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { 
      submission_id, 
      student_text, 
      assignment_instructions, 
      max_score,
      subject,
      level
    } = await req.json() as GradingRequest;

    if (!student_text || !assignment_instructions) {
      throw new Error("Missing required fields: student_text and assignment_instructions");
    }

    const systemPrompt = `Tu es un assistant pédagogique expert en correction de devoirs.
Tu aides les enseignants à évaluer les travaux des élèves de manière constructive et bienveillante.

Contexte:
- Matière: ${subject || "Non spécifié"}
- Niveau: ${level || "Non spécifié"}
- Note maximale: ${max_score}/20

Tu dois analyser le travail de l'élève et fournir:
1. Une note suggérée sur ${max_score}
2. Des points forts du travail
3. Des axes d'amélioration constructifs
4. Un feedback personnalisé pour l'élève

Sois encourageant tout en étant précis sur les améliorations possibles.
Adapte ton langage au niveau de l'élève.`;

    const userPrompt = `Consignes du devoir:
---
${assignment_instructions}
---

Travail de l'élève:
---
${student_text}
---

Analyse ce travail et fournis tes suggestions de correction.`;

    console.log("Calling Lovable AI for grading assistance...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_grading_feedback",
              description: "Provide structured grading feedback for a student submission",
              parameters: {
                type: "object",
                properties: {
                  suggested_score: {
                    type: "number",
                    description: "Suggested score out of max_score"
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of strengths in the student's work"
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of areas for improvement"
                  },
                  student_feedback: {
                    type: "string",
                    description: "Personalized feedback message for the student"
                  },
                  teacher_notes: {
                    type: "string",
                    description: "Private notes for the teacher"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level in the assessment"
                  }
                },
                required: ["suggested_score", "strengths", "improvements", "student_feedback", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_grading_feedback" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requêtes atteinte. Veuillez réessayer dans quelques instants." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Crédits IA insuffisants. Veuillez recharger votre compte." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response received");

    // Extract the tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_grading_feedback") {
      // Fallback to parsing content if no tool call
      const content = data.choices?.[0]?.message?.content;
      return new Response(JSON.stringify({
        success: true,
        submission_id,
        feedback: {
          raw_response: content,
          suggested_score: null,
          strengths: [],
          improvements: [],
          student_feedback: content || "Analyse en cours...",
          confidence: "low"
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const feedback = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      success: true,
      submission_id,
      feedback: {
        suggested_score: feedback.suggested_score,
        strengths: feedback.strengths || [],
        improvements: feedback.improvements || [],
        student_feedback: feedback.student_feedback,
        teacher_notes: feedback.teacher_notes || "",
        confidence: feedback.confidence
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in ai-grading-assist:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
