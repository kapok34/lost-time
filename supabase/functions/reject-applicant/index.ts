import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);

serve(async (req) => {
  const { member_id, reason } = await req.json();

  if (!member_id) {
    return new Response("Missing member_id", { status: 400 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEYS['default'], {
    auth: { persistSession: false },
  });

  // Verify caller is admin
  const { data: callerData, error: callerError } = await supabase.auth.getUser(token);
  if (callerError || !callerData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", callerData.user.id);

  const isAdmin = (roles ?? []).some((r: { role?: string }) => r.role === "admin");
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  // Get applicant profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, language, rejection_reason")
    .eq("id", member_id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile not found:", profileError);
    return new Response("Profile not found", { status: 404 });
  }

  // Get email
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member_id);
  if (userError || !userData?.user?.email) {
    console.error("User email not found:", userError);
    return new Response("User email not found", { status: 404 });
  }

  const lang = (profile.language === "fr" || profile.language === "it") ? profile.language : "en";
  const note = reason?.trim() || profile.rejection_reason?.trim() || "";

  const t = {
    en: {
      subject: "lost time — not the right time",
      greeting: "Hello,",
      body: "Thank you for your application. After careful consideration, we have decided that your time has not come yet.",
      reasonLabel: "Feel free to write to admin@lost-time.org if you have any questions.",
      outro: "Godspeed!",
      signoff: "Yours truly,",
      brand: "— lost time",
    },
    fr: {
      subject: "lost time — ce n'est pas le bon moment",
      greeting: "Bonjour,",
      body: "Merci pour ta candidature. Après mûre réflexion, nous pensons que ton moment n'est pas encore venu.",
      reasonLabel: "N'hésite pas à nous écrire à admin@lost-time.org si tu as des questions.",
      outro: "Bon vent!",
      signoff: "Amitiés,",
      brand: "— lost time",
    },
    it: {
      subject: "Lost time — non è il momento giusto",
      greeting: "Ciao,",
      body: "Grazie per la tua candidatura. Dopo attenta valutazione, abbiamo deciso che il tuo momento ancora non è arrivato.",
      reasonLabel: "Scrivici a admin@lost-time.org per qualsiasi domanda.",
      outro: "Buona ricerca!",
      signoff: "Saluti,",
      brand: "— lost time",
    },
  }[lang];

  const reasonHtml = note
    ? `<p style="margin-top: 1em; color: #444; font-size: 0.95em;"><strong>${t.reasonLabel}</strong> ${note.replace(/\n/g, "<br>")}</p>`
    : "";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "lost time <noreply@lost-time.org>",
        to: [userData.user.email],
        subject: t.subject,
        html: `
          <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
            <p>${t.greeting}</p>
            <p>${t.body}</p>
            ${reasonHtml}
            <p style="margin-top: 1.5em;">${t.outro}</p>
            <p>${t.signoff}</p>
            <p style="color: #800000; font-size: 0.9em; margin-top: 2em;">${t.brand}</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(`Email failed: ${err}`, { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
