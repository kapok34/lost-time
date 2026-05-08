import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export async function handler(req: Request): Promise<Response> {
  // Validate internal apikey header (trigger calls only)
  const apiKey = req.headers.get("apikey");
  const expectedKey = Deno.env.get("INTERNAL_API_KEY");
  if (!expectedKey || apiKey !== expectedKey) {
    return new Response("Unauthorized", { status: 401 });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);

  const { member_id } = await req.json();

  if (!member_id) {
    return new Response("Missing member_id", { status: 400 });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEYS['default'], {
    auth: { persistSession: false },
  });

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, member_number, language")
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
      approved: `Your application has been approved. You are now <strong style="color: #800000;">member #${memberNum}</strong> of lost time.`,
      login: `You can log in at <a href="https://lost-time.org/login" style="color: #800000; text-decoration: underline;">lost-time.org</a> to browse members' portraits and begin corresponding.`,
      manifestoTitle: "Manifesto",
      manifestoJuggling: "No juggling: each member can hold only one active correspondence at a time.",
      manifestoHeyYou: `No "hey you": your first message to another member must contain at least 34 characters.`,
      manifestoGhosting: "No ghosting: you can end a correspondence only after you have responded, or if your correspondent has not responded for over 34 hours.",
      manifestoBenching: "No boomerang: if you end a correspondence, you have to wait 34 days before you can restart it.",
      manifestoPenPals: "No pen pals (here): you get 10 messages each before the correspondence ends automatically. Move the conversation elsewhere if you click.",
      changeLabel: "Need to change your location or your answers? Want to add another language?",
      changeText: "Write to admin@lost-time.org and we will update your portrait for you.",
      deleteLabel: "Want to delete your account?",
      deleteText: `Delete your account</a> — this will permanently remove your portrait, answers, messages and all associated data.`,
      outro: "Godspeed.",
      signoff: "Yours truly,",
      brand: "— lost time",
    },
    fr: {
      subject: `À la recherche de — membre #${memberNum}`,
      greeting: "Bonjour,",
      approved: `Ta candidature a été approuvée. Tu es désormais <strong style="color: #800000;">membre #${memberNum}</strong> de lost time.`,
      login: `Tu peux te connecter sur <a href="https://lost-time.org/login" style="color: #800000; text-decoration: underline;">lost-time.org</a> pour parcourir les portraits des membres et entamer une correspondance.`,
      manifestoTitle: "Manifeste",
      manifestoJuggling: "Pas de jonglage : chaque membre ne peut entretenir qu'une seule correspondance à la fois.",
      manifestoHeyYou: `Pas de « salut toi » : ton premier message à un autre membre doit contenir au moins 34 caractères.`,
      manifestoGhosting: "Pas de fantômisation : tu ne peux mettre fin à une correspondance qu'après avoir répondu, ou si ton correspondant n'a pas répondu depuis plus de 34 heures.",
      manifestoBenching: "Pas de boomerang : si tu mets fin à une correspondance, tu dois attendre 34 jours avant de la reprendre.",
      manifestoPenPals: "Pas d'éternels correspondants (ici) : vous avez droit à 10 messages chacun avant que la correspondance ne se termine automatiquement. Poursuivez la conversation ailleurs si vous vous entendez bien.",
      changeLabel: "Besoin de modifier ta localisation ou tes réponses ? Envie d'ajouter une autre langue ?",
      changeText: "Écris à admin@lost-time.org et nous mettrons ton portrait à jour.",
      deleteLabel: "Tu souhaites supprimer ton compte ?",
      deleteText: `Supprimer ton compte</a> — cela supprimera définitivement ton portrait, tes réponses, tes messages et toutes les données associées.`,
      outro: "Bonne recherche.",
      signoff: "Amitiés,",
      brand: "— lost time",
    },
    it: {
      subject: `Alla ricerca di — socio #${memberNum}`,
      greeting: "Ciao,",
      approved: `La tua candidatura è stata approvata. Sei ora <strong style="color: #800000;">membro #${memberNum}</strong> di lost time.`,
      login: `Puoi accedere su <a href="https://lost-time.org/login" style="color: #800000; text-decoration: underline;">lost-time.org</a> per sfogliare i ritratti dei membri e iniziare corrispondenze.`,
      manifestoTitle: "Manifesto",
      manifestoJuggling: "Niente giocoleria: ogni socio può mantenere una sola corrispondenza attiva alla volta.",
      manifestoHeyYou: `Niente « ciao »: il tuo primo messaggio ad un altro socio deve contenere almeno 34 caratteri.`,
      manifestoGhosting: "Niente ghosting: puoi terminare una corrispondenza solo dopo aver risposto, o se il tuo corrispondente non ha risposto per più di 34 ore.",
      manifestoBenching: "Niente boomerang: se termini una corrispondenza, devi aspettare 34 giorni prima di poterla riprendere.",
      manifestoPenPals: "Niente pen friends (qui): avete 10 messaggi ciascuno prima che la corrispondenza finisca automaticamente. Sposta la conversazione altrove se c'è feeling.",
      changeLabel: "Hai bisogno di modificare la tua località o le tue risposte? Vuoi aggiungere un'altra lingua?",
      changeText: "Scrivi ad admin@lost-time.org aggiorneremo il tuo ritratto.",
      deleteLabel: "Vuoi eliminare il tuo account?",
      deleteText: `Elimina il tuo account</a> — questo rimuoverà permanentemente il tuo ritratto, le tue risposte, i messaggi e tutti i dati associati.`,
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
        from: "lost time <noreply@lost-time.org>",
        to: [userData.user.email],
        subject: t.subject,
        html: `
          <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
            <p>${t.greeting}</p>
            <p>${t.approved}</p>
            <p>${t.login}</p>
            <p style="margin-top: 1.5em; font-weight: bold;">${t.manifestoTitle}</p>
            <ul style="padding-left: 1.2em; margin: 0.5em 0; color: #333;">
              <li style="margin-bottom: 0.5em;">${t.manifestoJuggling}</li>
              <li style="margin-bottom: 0.5em;">${t.manifestoHeyYou}</li>
              <li style="margin-bottom: 0.5em;">${t.manifestoGhosting}</li>
              <li style="margin-bottom: 0.5em;">${t.manifestoBenching}</li>
              <li>${t.manifestoPenPals}</li>
            </ul>
            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 2em 0;" />
            <p style="color: #444; font-size: 0.95em;">
              <strong>${t.changeLabel}</strong><br>
              ${t.changeText}
            </p>
            <p style="color: #444; font-size: 0.95em;">
              <strong>${t.deleteLabel}</strong><br>
              <a href="${deleteUrl}" style="color: #800000; text-decoration: underline;">${t.deleteText}
            </p>
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
}

serve(handler);
