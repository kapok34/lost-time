import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function handler(req: Request): Promise<Response> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const { member_id } = await req.json();

  if (!member_id) {
    return new Response("Missing member_id", { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, member_number, language")
    .eq("id", member_id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error("Profile not found:", profileError);
    return new Response("Profile not found", { status: 404 });
  }

  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member_id);
  if (userError || !userData?.user?.email) {
    console.error("User email not found:", userError);
    return new Response("User email not found", { status: 404 });
  }

  const memberNum = profile.member_number ?? "—";
  const deleteUrl = "https://lost-time.org/delete-account";
  const lang = (profile.language === "fr" || profile.language === "it") ? profile.language : "en";

  const t = {
    en: {
      subject: `In search of — member #${memberNum}`,
      greeting: "Hello,",
      approved: `Your application has been approved. You are now <strong style="color: #b91c1c;">member #${memberNum}</strong> of lost time.`,
      login: `You can log in at <a href="https://lost-time.org/login" style="color: #b91c1c; text-decoration: underline;">lost-time.org</a> to browse members' answers and begin corresponding.`,
      changeLabel: "Need to change your location or your answers? Want to add another language?",
      changeText: "Write to admin@lost-time.org and we will update your profile for you.",
      deleteLabel: "Want to delete your account?",
      deleteText: `Delete your account</a> — this will permanently remove your profile, answers, messages and all associated data.`,
      outro: "Godspeed.",
      signoff: "Yours truly,",
      brand: "— lost time",
    },
    fr: {
      subject: `À la recherche de — membre #${memberNum}`,
      greeting: "Bonjour,",
      approved: `Ta candidature a été approuvée. Tu es désormais <strong style="color: #b91c1c;">membre #${memberNum}</strong> de lost time.`,
      login: `Tu peux te connecter sur <a href="https://lost-time.org/login" style="color: #b91c1c; text-decoration: underline;">lost-time.org</a> pour parcourir les réponses des membres et entamer une correspondance.`,
      changeLabel: "Besoin de modifier ta localisation ou tes réponses ? Envie d'ajouter une autre langue ?",
      changeText: "Écris à admin@lost-time.org et nous mettrons ton profil à jour.",
      deleteLabel: "Tu souhaites supprimer ton compte ?",
      deleteText: `Supprimer ton compte</a> — cela supprimera définitivement ton profil, tes réponses, tes messages et toutes les données associées.`,
      outro: "Bonne recherche.",
      signoff: "Amitiés,",
      brand: "— lost time",
    },
    it: {
      subject: `Alla ricerca di — socio #${memberNum}`,
      greeting: "Ciao,",
      approved: `La tua candidatura è stata approvata. Sei ora <strong style="color: #b91c1c;">membro #${memberNum}</strong> di lost time.`,
      login: `Puoi accedere su <a href="https://lost-time.org/login" style="color: #b91c1c; text-decoration: underline;">lost-time.org</a> per sfogliare le risposte dei membri e iniziare a corrispondere.`,
      changeLabel: "Hai bisogno di modificare la tua localizzazione o le tue risposte? Vuoi aggiungere un'altra lingua?",
      changeText: "Scrivi ad admin@lost-time.org aggiorneremo il tuo profilo.",
      deleteLabel: "Vuoi eliminare il tuo account?",
      deleteText: `Elimina il tuo account</a> — questo rimuoverà permanentemente il tuo profilo, le tue risposte, i messaggi e tutti i dati associati.`,
      outro: "Buona ricerca.",
      signoff: "Saluti,",
      brand: "— lost time",
    },
  }[lang];

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "lost time <noreply@losttime.app>",
        to: [userData.user.email],
        subject: t.subject,
        html: `
          <div style="max-width: 480px; margin: 0 auto; font-family: Georgia, serif; line-height: 1.65; color: #1a1a1a;">
            <p>${t.greeting}</p>
            <p>${t.approved}</p>
            <p>${t.login}</p>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 2em 0;" />
            <p style="color: #444; font-size: 0.95em;">
              <strong>${t.changeLabel}</strong><br>
              ${t.changeText}
            </p>
            <p style="color: #444; font-size: 0.95em;">
              <strong>${t.deleteLabel}</strong><br>
              <a href="${deleteUrl}" style="color: #b91c1c; text-decoration: underline;">${t.deleteText}
            </p>
            <p style="margin-top: 1.5em;">${t.outro}</p>
            <p>${t.signoff}</p>
            <p style="color: #888; font-size: 0.9em; margin-top: 2em;">${t.brand}</p>
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
}

serve(handler);
