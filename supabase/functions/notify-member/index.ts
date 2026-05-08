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

  const { message_id, conversation_id, sender_id, body } = await req.json();

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEYS['default'], {
    auth: { persistSession: false },
  });

  // Get conversation to find recipient
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("member_a, member_b, status")
    .eq("id", conversation_id)
    .maybeSingle();

  if (convError || !conv) {
    console.error("Conversation not found:", convError);
    return new Response("Conversation not found", { status: 404 });
  }

  if (conv.status !== "active") {
    return new Response("Conversation not active", { status: 200 });
  }

  const recipientId = conv.member_a === sender_id ? conv.member_b : conv.member_a;

  // Don't notify if recipient is the sender (shouldn't happen, but safety check)
  if (recipientId === sender_id) {
    return new Response(JSON.stringify({ skipped: true, reason: "self-message" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get sender profile for member number
  const { data: senderProf } = await supabase
    .from("profiles")
    .select("member_number")
    .eq("id", sender_id)
    .maybeSingle();

  // Get recipient's profile for language preference
  const { data: recipientProf } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", recipientId)
    .maybeSingle();

  // Get recipient's auth email
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipientId);

  if (userError || !userData?.user?.email) {
    console.error("Recipient email not found:", userError);
    return new Response("Recipient email not found", { status: 404 });
  }

  const senderNum = senderProf?.member_number ?? "—";
  const preview = body.length > 120 ? body.slice(0, 120) + "…" : body;
  const lang = (recipientProf?.language === "fr" || recipientProf?.language === "it") ? recipientProf.language : "en";

  const t = {
    en: {
      subject: `New message from member #${senderNum}`,
      greeting: "Hello,",
      received: `You have received a new message from <strong style="color: #800000;">member #${senderNum}</strong>:`,
      openLink: "Open correspondence",
      respondWarning: `Member #${senderNum} may end this correspondence if you do not reply within 34 hours.`,
      endRule: "You may end this correspondence only after you have replied.",
      brand: "— lost time",
    },
    fr: {
      subject: `Nouveau message du membre #${senderNum}`,
      greeting: "Bonjour,",
      received: `Tu as reçu un nouveau message de la part de <strong style="color: #800000;">membre #${senderNum}</strong> :`,
      openLink: "Ouvrir la correspondance",
      respondWarning: `Sans réponse de ta part sous 34 heures, membre #${senderNum} pourra mettre fin à cette correspondance.`,
      endRule: "Tu ne peux mettre fin à cette correspondance qu'après avoir répondu.",
      brand: "— lost time",
    },
    it: {
      subject: `Nuovo messaggio dal socio #${senderNum}`,
      greeting: "Ciao,",
      received: `Hai ricevuto un nuovo messaggio da <strong style="color: #800000;">socio #${senderNum}</strong>:` ,
      openLink: "Apri la corrispondenza",
      respondWarning: `Se non rispondi entro 34 ore, socio #${senderNum} potrà terminare questa corrispondenza.`,
      endRule: "Puoi terminare questa corrispondenza solo dopo aver risposto.",
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
            <p>${t.received}</p>
            <blockquote style="border-left: 3px solid #ccc; padding-left: 1em; color: #555; margin: 1em 0;">
              ${preview.replace(/\n/g, "<br>")}
            </blockquote>
            <p><a href="https://lost-time.org/messages/${conversation_id}" style="color: #800000; text-decoration: underline;">${t.openLink}</a></p>
            <p style="color: #666; font-size: 0.9em;">${t.respondWarning}</p>
            <p style="color: #666; font-size: 0.9em;">${t.endRule}</p>
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
