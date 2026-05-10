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

  const { id, member_number, questionnaire_languages, new_languages } = await req.json();

  if (!id || (!questionnaire_languages && !new_languages)) {
    return new Response("Missing member id and either questionnaire_languages or new_languages", { status: 400 });
  }

  const targetLanguages = new_languages ?? questionnaire_languages;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEYS['default'], {
    auth: { persistSession: false },
  });

  // Find existing approved members with matching language preference who opted in
  const { data: matchedProfiles, error: matchError } = await supabase
    .from("profiles")
    .select("id, language")
    .eq("status", "approved")
    .eq("notify_new_members", true)
    .overlaps("questionnaire_languages", targetLanguages)
    .neq("id", id);

  if (matchError) {
    console.error("Match query error:", matchError);
    return new Response(`Match query failed: ${matchError.message}`, { status: 500 });
  }

  if (!matchedProfiles || matchedProfiles.length === 0) {
    return new Response(JSON.stringify({ sent: 0, matched: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const failures: { recipient: string; error: string }[] = [];
  const senderNum = member_number ?? "—";

  // Fetch all auth users in one call
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("Auth admin error:", usersError);
    return new Response(`Auth admin failed: ${usersError.message}`, { status: 500 });
  }

  const emailMap = new Map<string, string>();
  (usersData?.users ?? []).forEach((u: any) => {
    if (u.email) emailMap.set(u.id, u.email);
  });

  const isNewLanguageNotification = !!new_languages;

  const translations: Record<string, { subject: string; body: string; linkText: string; unsubscribe: string; outro: string; signoff: string; brand: string }> = {
    en: {
      subject: isNewLanguageNotification
        ? `new language added by member no.${senderNum}`
        : `new member at lost time — no.${senderNum}`,
      body: isNewLanguageNotification
        ? `Member no.${senderNum} has filled out the questionnaire in a new language that matches yours.`
        : `A new member has joined lost time - <strong style="color: #800000;">member no.${senderNum}</strong> - and has filled out the questionnaire in the same language as you.`,
      linkText: "peruse portraits",
      unsubscribe: "You can turn off these notifications from your portrait.",
      outro: "Happy searching.",
      signoff: "Yours truly,",
      brand: "— lost time",
    },
    fr: {
      subject: isNewLanguageNotification
        ? `nouvelle langue ajoutée par membre n°${senderNum}`
        : `nouveau membre de lost time — n°${senderNum}`,
      body: isNewLanguageNotification
        ? `Le membre n°${senderNum} a rempli le questionnaire dans une nouvelle langue qui correspond à la tienne.`
        : `Un nouveau membre a rejoint lost time - le <strong style="color: #800000;">membre n°${senderNum}</strong> - et a répondu au questionnaire dans la même langue que toi.`,
      linkText: "parcourir les portraits",
      unsubscribe: "Tu peux désactiver ces notifications depuis ton portrait.",
      outro: "Bonne recherche.",
      signoff: "Amitiés,",
      brand: "— lost time",
    },
    it: {
      subject: isNewLanguageNotification
        ? `nuova lingua aggiunta dal socio n°${senderNum}`
        : `nuovo socio di lost time n°${senderNum}`,
      body: isNewLanguageNotification
        ? `Il socio n°${senderNum} ha compilato il questionario in una nuova lingua che corrisponde alla tua.`
        : `Un nuovo socio ha raggiunto lost time - <strong style="color: #800000;">socio n°${senderNum}</strong> - e ha compilato il questionario nella stessa lingue di te.`,
      linkText: "sfoglia i ritratti",
      unsubscribe: "Puoi disattivare queste notifiche dal tuo ritratto.",
      outro: "Buona ricerca.",
      signoff: "Saluti,",
      brand: "— lost time",
    },
  };

  for (const recipient of matchedProfiles) {
    const email = emailMap.get(recipient.id);
    if (!email) {
      console.warn("No email for recipient:", recipient.id);
      continue;
    }

    const lang = (recipient.language === "fr" || recipient.language === "it") ? recipient.language : "en";
    const t = translations[lang];

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "lost time <noreply@lost-time.org>",
          to: [email],
          subject: t.subject,
          html: `
            <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
              <p>${t.body}</p>
              <p><a href="https://lost-time.org/members" style="color: #800000; text-decoration: underline;">${t.linkText}</a></p>
              <p style="margin-top: 1.5em; font-size: 0.95em; color: #555;">${t.unsubscribe}</p>
              <p style="margin-top: 1.5em;">${t.outro}</p>
              <p>${t.signoff}</p>
              <p style="color: #888; font-size: 0.9em; margin-top: 2em;">${t.brand}</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`Failed to notify ${email}:`, err);
        failures.push({ recipient: email, error: err });
      }
    } catch (err: any) {
      console.error(`Exception notifying ${email}:`, err);
      failures.push({ recipient: email, error: err.message });
    }
  }

  return new Response(JSON.stringify({
    sent: matchedProfiles.length - failures.length,
    matched: matchedProfiles.length,
    failures,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

serve(handler);
