import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function handler(req: Request): Promise<Response> {
  // Validate caller is admin via auth token
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    }
  );

  const { data: userData, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEYS['default'], {
    auth: { persistSession: false },
  });

  // Verify admin role
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { editId, action, rejectionReason } = await req.json();
  if (!editId || !action || !['approve', 'reject'].includes(action)) {
    return new Response("Missing or invalid parameters", { status: 400 });
  }

  // Fetch the pending edit
  const { data: edit, error: editError } = await supabaseAdmin
    .from("pending_questionnaire_edits")
    .select("*, profiles!inner(member_number, language)")
    .eq("id", editId)
    .eq("status", "pending")
    .single();

  if (editError || !edit) {
    return new Response("Edit not found or already processed", { status: 404 });
  }

  const userId = edit.user_id;
  const lang = edit.lang;
  const answers = edit.answers as Record<string, string>;
  const memberNum = edit.profiles?.member_number ?? "—";
  const userLang = edit.profiles?.language ?? "en";

  if (action === "approve") {
    // Build upsert rows
    const qs = Object.keys(answers).map((qid) => ({
      user_id: userId,
      question_id: Number(qid),
      answer: answers[qid].trim(),
      lang,
    }));

    // Upsert answers
    const { error: upsertError } = await supabaseAdmin
      .from("questionnaire_answers")
      .upsert(qs, { onConflict: "user_id,question_id,lang" });

    if (upsertError) {
      console.error("Failed to upsert answers:", upsertError);
      return new Response("Failed to apply changes", { status: 500 });
    }

    // Update profile to include this language if new
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("questionnaire_languages")
      .eq("id", userId)
      .single();

    const currentLangs = (profile?.questionnaire_languages ?? []) as string[];
    if (!currentLangs.includes(lang)) {
      await supabaseAdmin
        .from("profiles")
        .update({ questionnaire_languages: [...currentLangs, lang] })
        .eq("id", userId);
    }

    // Mark edit as approved
    await supabaseAdmin
      .from("pending_questionnaire_edits")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", editId);

    // Notify user of approval
    if (RESEND_API_KEY) {
      const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userInfo?.user?.email;
      if (email) {
        const t: Record<string, Record<string, string>> = {
          en: {
            subject: "well done",
            body: `Your edits have been approved.`,
            signoff: "Yours truly,",
            brand: "— lost time",
          },
          fr: {
            subject: "bien joué",
            body: `Tes modifications ont été approuvées.`,
            signoff: "Amitiés,",
            brand: "— lost time",
          },
          it: {
            subject: "complimenti",
            body: `Le tue modifiche sono state approvate.`,
            signoff: "Saluti,",
            brand: "— lost time",
          },
        };
        const m = t[userLang] ?? t.en;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "lost time <noreply@lost-time.org>",
              to: [email],
              subject: m.subject,
              html: `
                <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
                  <p>${m.body}</p>
                  <p style="margin-top: 1.5em;">${m.signoff}</p>
                  <p style="color: #800000; font-size: 0.9em; margin-top: 2em;">${m.brand}</p>
                </div>
              `,
            }),
          });
        } catch (err) {
          console.error("Failed to send approval email:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, action: "approved" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } else {
    // Reject
    await supabaseAdmin
      .from("pending_questionnaire_edits")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", editId);

    // Notify user of rejection
    if (RESEND_API_KEY) {
      const { data: userInfo } = await supabaseAdmin.auth.admin.getUserById(userId);
      const email = userInfo?.user?.email;
      if (email) {
        const t: Record<string, Record<string, string>> = {
          en: {
            subject: "try again",
            body: `Your edits were rejected.` +
              (rejectionReason ? ` Reason: ${rejectionReason}` : ""),
            signoff: "Yours truly,",
            brand: "— lost time",
          },
          fr: {
            subject: "essaie encore",
            body: `Tes modifications n'ont pas été approuvées.` +
              (rejectionReason ? ` Motif : ${rejectionReason}` : ""),
            signoff: "Amitiés,",
            brand: "— lost time",
          },
          it: {
            subject: "ripensaci",
            body: `Le tue modifiche non sono state approvate.` +
              (rejectionReason ? ` Motivo: ${rejectionReason}` : ""),
            signoff: "Saluti,",
            brand: "— lost time",
          },
        };
        const m = t[userLang] ?? t.en;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "lost time <noreply@lost-time.org>",
              to: [email],
              subject: m.subject,
              html: `
                <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
                  <p>${m.body}</p>
                  <p style="margin-top: 1.5em;">${m.signoff}</p>
                  <p style="color: #800000; font-size: 0.9em; margin-top: 2em;">${m.brand}</p>
                </div>
              `,
            }),
          });
        } catch (err) {
          console.error("Failed to send rejection email:", err);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, action: "rejected" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
