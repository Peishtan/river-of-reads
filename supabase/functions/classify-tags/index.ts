import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STATIC_TAG_MAP: Record<string, string> = {
  adventure: "escapist", bleak: "escapist", dark: "escapist",
  dystopian: "escapist", escapist: "escapist", mystery: "escapist",
  thriller: "escapist", uncomfortable: "escapist",
  business: "ideas", craft: "ideas", future: "ideas", "idea-dense": "ideas",
  practical: "ideas", science: "ideas", systems: "ideas", technology: "ideas",
  culture: "history", food: "history", history: "history", legal: "history",
  literary: "history", politics: "history", travel: "history",
  nature: "nature",
  hope: "life", memoir: "life", "philosophy-lite": "life",
  psychology: "life", reflective: "life", warm: "life",
};

const VALID_VIBES = ["escapist", "ideas", "history", "nature", "life"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tags } = await req.json();
    if (!Array.isArray(tags) || tags.length === 0) {
      return new Response(JSON.stringify({ error: "No tags provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Filter to only truly unrecognized tags
    const normalizedTags = tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean);
    const unknownTags = normalizedTags.filter((t: string) => !STATIC_TAG_MAP[t] && !VALID_VIBES.includes(t));

    if (unknownTags.length === 0) {
      return new Response(JSON.stringify({ mappings: {}, message: "All tags already recognized" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check which tags already have user-specific mappings
    const { data: existing } = await supabase
      .from("tag_mappings")
      .select("tag, vibe_key")
      .eq("user_id", userId)
      .in("tag", unknownTags);

    const existingMap: Record<string, string> = {};
    (existing || []).forEach((e: { tag: string; vibe_key: string }) => {
      existingMap[e.tag] = e.vibe_key;
    });

    const stillUnknown = unknownTags.filter((t: string) => !existingMap[t]);

    if (stillUnknown.length === 0) {
      return new Response(JSON.stringify({ mappings: existingMap, message: "All tags already mapped" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call AI to classify
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You classify book tags/genres into exactly 5 reading stream categories. Each tag MUST map to exactly one category.

The categories are:
- "escapist" = Escapist & Adventure (action, suspense, fantasy, sci-fi, horror, romance, speculative fiction, page-turners)
- "ideas" = Ideas & Technology (business, science, tech, innovation, systems thinking, self-improvement, productivity)
- "history" = History & World (history, culture, politics, sociology, travel, food, journalism, current affairs, literary criticism)
- "nature" = Nature & Ocean (nature, environment, ecology, wildlife, ocean, outdoors, climate)
- "life" = Life & Reflective (memoir, psychology, philosophy, spirituality, relationships, personal essays, mindfulness, warmth)

Classify each tag into the single best-fitting category. When in doubt, pick the closest match.`,
          },
          {
            role: "user",
            content: `Classify these book tags: ${stillUnknown.join(", ")}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify_tags",
              description: "Classify book tags into reading stream categories",
              parameters: {
                type: "object",
                properties: {
                  classifications: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tag: { type: "string" },
                        vibe_key: { type: "string", enum: VALID_VIBES },
                      },
                      required: ["tag", "vibe_key"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["classifications"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify_tags" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI classification failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { classifications } = JSON.parse(toolCall.function.arguments);
    const newMappings: { user_id: string; tag: string; vibe_key: string }[] = [];
    const resultMap: Record<string, string> = { ...existingMap };

    for (const c of classifications) {
      const tag = c.tag.toLowerCase().trim();
      const vibe = c.vibe_key;
      if (VALID_VIBES.includes(vibe) && stillUnknown.includes(tag)) {
        resultMap[tag] = vibe;
        newMappings.push({ user_id: userId, tag, vibe_key: vibe });
      }
    }

    // Save to DB
    if (newMappings.length > 0) {
      const { error: insertError } = await supabase
        .from("tag_mappings")
        .upsert(newMappings, { onConflict: "user_id,tag" });
      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    return new Response(
      JSON.stringify({ mappings: resultMap, classified: newMappings.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("classify-tags error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
