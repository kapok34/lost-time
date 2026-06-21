import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: { persistSession: false },
        global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      }
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = userData.user.id;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

    let serviceRoleKey: string | null = null;
    try {
      const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
      if (raw) {
        const parsed = JSON.parse(raw);
        serviceRoleKey = parsed?.default ?? null;
      }
    } catch {
      // ignore invalid JSON
    }
    if (!serviceRoleKey) {
      serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? null;
    }
    if (!serviceRoleKey) {
      console.error("Missing Supabase service role key");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { lang, answers } = body;

    if (!lang || !answers || Object.keys(answers).length === 0) {
      return new Response(JSON.stringify({ error: "Missing lang or answers" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Validate all 34 questions answered with 3-200 chars
    const questionIds = Array.from({ length: 34 }, (_, i) => String(i + 1));
    const missing = questionIds.filter((qid) => {
      const val = (answers[qid] ?? "").trim();
      return val.length < 3 || val.length > 200;
    });

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: `All ${missing.length} questions must have answers between 3-200 characters` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing answers (if any) to store as original_answers
    const { data: existingAnswers } = await supabaseAdmin
      .from("questionnaire_answers")
      .select("question_id, answer")
      .eq("user_id", userId)
      .eq("lang", lang);

    const originalAnswers: Record<string, string> = {};
    (existingAnswers ?? []).forEach((a: any) => {
      originalAnswers[a.question_id] = a.answer;
    });

    // Check if there's already a pending edit for this language
    const { data: existingPending } = await supabaseAdmin
      .from("pending_questionnaire_edits")
      .select("id")
      .eq("user_id", userId)
      .eq("lang", lang)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return new Response(
        JSON.stringify({ error: "You already have a pending edit for this language. Please wait for admin approval." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the pending edit
    const { data: editData, error: editError } = await supabaseAdmin
      .from("pending_questionnaire_edits")
      .insert({
        user_id: userId,
        lang,
        answers,
        original_answers: Object.keys(originalAnswers).length > 0 ? originalAnswers : null,
        status: "pending",
      })
      .select("id")
      .single();

    if (editError) {
      console.error("Failed to insert pending edit:", editError);
      return new Response(JSON.stringify({ error: "Failed to submit edit" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get user email for the admin email
    const { data: userInfo, error: userInfoError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userInfoError) {
      console.error("Failed to get user info:", userInfoError);
    }

    const userEmail = userInfo?.user?.email ?? "unknown";

    // Get user's member number
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("member_number")
      .eq("id", userId)
      .maybeSingle();

    const memberNum = profileData?.member_number ?? "—";

    // Send email notification to admin
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "lost time <noreply@lost-time.org>",
            to: [Deno.env.get("ADMIN_EMAIL") || "admin@lost-time.org"],
            subject: `Questionnaire edit pending approval — member no.${memberNum}`,
            html: `
              <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
                <p>A member has submitted questionnaire changes for approval:</p>
                <ul style="color: #555;">
                  <li><strong>Member:</strong> no.${memberNum}</li>
                  <li><strong>Email:</strong> ${userEmail}</li>
                  <li><strong>Language:</strong> ${lang.toUpperCase()}</li>
                  <li><strong>Submitted:</strong> ${new Date().toLocaleString()}</li>
                </ul>
                <p><a href="https://lost-time.org/admin" style="color: #800000; text-decoration: underline;">Review in Admin</a></p>
              </div>
            `,
          }),
        });
      } catch (err) {
        console.error("Failed to send admin notification:", err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, editId: editData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unhandled error in submit-questionnaire-edit:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
