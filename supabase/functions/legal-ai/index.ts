import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HF_ENDPOINT =
  "https://router.huggingface.co/hf-inference/models/meta-llama/Meta-Llama-3.1-70B-Instruct";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HF_API_KEY = Deno.env.get("HF_API_KEY");
    if (!HF_API_KEY) {
      return new Response(
        JSON.stringify({ error: "HF_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { systemPrompt, userPrompt, stream } = await req.json();

    // Build the prompt in Llama chat format
    const fullPrompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt || "You are a helpful legal AI assistant."}<|eot_id|><|start_header_id|>user<|end_header_id|>

${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

    if (stream) {
      // Streaming mode
      const response = await fetch(HF_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
            stream: true,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("HF API error:", response.status, errText);
        return new Response(
          JSON.stringify({ error: `Model error: ${response.status}`, details: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Pass through the SSE stream from HF
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
      });
    } else {
      // Non-streaming mode
      const response = await fetch(HF_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 2048,
            temperature: 0.7,
            top_p: 0.9,
            return_full_text: false,
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("HF API error:", response.status, errText);
        return new Response(
          JSON.stringify({ error: `Model error: ${response.status}`, details: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      // HF returns an array with generated_text
      const generatedText = Array.isArray(data)
        ? data[0]?.generated_text || ""
        : data.generated_text || "";

      return new Response(
        JSON.stringify({ content: generatedText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("legal-ai error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
