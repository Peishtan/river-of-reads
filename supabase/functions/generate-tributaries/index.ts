import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VIBE_LABELS: Record<string, string> = {
  escapist: "Escapist & Adventure",
  ideas: "Ideas & Technology",
  nature: "Nature & Ocean",
  history: "History & World",
  life: "Life & Reflective",
  current: "The Main Current",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceRoleKey) {
      return new Response(JSON.stringify({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Fetch candidate books (most recent 50) with admin client:
    // include this user's books + legacy demo books with NULL user_id
    const { data: books, error: booksError } = await adminSupabase
      .from("books")
      .select("title, author, vibes, rating, date_read")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("date_read", { ascending: false })
      .limit(50);

    if (booksError) {
      console.error("Error fetching books:", booksError);
      return new Response(JSON.stringify({ error: "Failed to fetch books" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!books || books.length < 3) {
      return new Response(
        JSON.stringify({ error: "Not enough books to generate recommendations (need at least 3)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch existing tributaries to avoid duplicates
    const { data: existing } = await supabase
      .from("tributaries")
      .select("title")
      .eq("user_id", userId);

    const existingTitles = new Set((existing || []).map((t: { title: string }) => t.title.toLowerCase()));

    // Also build a set of already-read book titles for hard dedup against AI suggestions
    const readTitles = new Set((books || []).map((b) => b.title.toLowerCase()));

    // Count vibe frequencies to identify strongest streams
    const vibeCounts: Record<string, number> = {};
    for (const book of books) {
      for (const vibe of book.vibes || []) {
        vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
      }
    }
    const topVibes = Object.entries(vibeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([v]) => v);

    // Build the book list for the prompt
    const bookList = books
      .slice(0, 30)
      .map((b) => {
        const vibeNames = (b.vibes || []).map((v: string) => VIBE_LABELS[v] || v).join(", ");
        return `- "${b.title}" by ${b.author || "Unknown"} (${vibeNames})${b.rating ? ` [${b.rating}/5]` : ""}`;
      })
      .join("\n");

    const topVibeNames = topVibes.map((v) => VIBE_LABELS[v] || v).join(", ");

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a literary recommendation engine for "River of Reading" — a visualization that maps someone's reading life as a flowing river with tributaries.

The reader's strongest streams are: ${topVibeNames}.

The available stream categories are:
${Object.entries(VIBE_LABELS).map(([k, v]) => `- "${v}" (key: ${k})`).join("\n")}

Your job: suggest exactly 3 books that would be great next reads. Prioritize books that:
1. Bridge two or more of their active streams (e.g., a book that's both "Nature & Ocean" and "Life & Reflective")
2. Could pull them toward an underexplored stream
3. Are genuinely excellent, well-regarded books

Do NOT suggest books they've already read.`;

    const userPrompt = `Here are my recent reads:\n\n${bookList}\n\nSuggest 3 books I should read next.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_books",
              description: "Return exactly 3 book recommendations",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Book title" },
                        author: { type: "string", description: "Book author" },
                        source_streams: {
                          type: "array",
                          items: { type: "string" },
                          description: `Stream display labels this book bridges. Use exact labels: ${Object.values(VIBE_LABELS).join(", ")}`,
                        },
                        reason: {
                          type: "string",
                          description: "One sentence explaining why this book fits their reading river (max 120 chars)",
                        },
                      },
                      required: ["title", "author", "source_streams", "reason"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_books" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.error("No tool call in AI response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "AI returned unexpected format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { recommendations } = JSON.parse(toolCall.function.arguments);

    // Filter out duplicates and insert
    const newTributaries = recommendations
      .filter((r: { title: string }) => !existingTitles.has(r.title.toLowerCase()) && !readTitles.has(r.title.toLowerCase()))
      .map((r: { title: string; author: string; source_streams: string[]; reason: string }) => ({
        title: r.title,
        author: r.author,
        source_streams: r.source_streams,
        reason: r.reason,
        user_id: userId,
        dismissed: false,
      }));

    if (newTributaries.length === 0) {
      return new Response(
        JSON.stringify({ message: "All suggestions already exist", inserted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("tributaries")
      .insert(newTributaries)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save recommendations" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: `Inserted ${inserted.length} tributaries`, tributaries: inserted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-tributaries error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
