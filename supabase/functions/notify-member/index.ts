import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const { message_id, conversation_id, sender_id, body } = await req.json();

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
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

  // Get recipient's auth email
  const { data: userData, error: userError } = await supabase.auth.admin.getUserById(recipientId);

  if (userError || !userData?.user?.email) {
    console.error("Recipient email not found:", userError);
    return new Response("Recipient email not found", { status: 404 });
  }

  const senderNum = senderProf?.member_number ?? "—";
  const preview = body.length > 120 ? body.slice(0, 120) + "…" : body;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lost Time <noreply@losttime.app>",
        to: [userData.user.email],
        subject: `New message from member #${senderNum}`,
        html: `
          <div style="max-width: 480px; margin: 0 auto; font-family: 'Cormorant Garamond', Georgia, serif; line-height: 1.65; color: #1a1a1a;">
            <p>Hello,</p>
            <p>You have received a new message from <strong style="color: #800000;">member #${senderNum}</strong>:</p>
            <blockquote style="border-left: 3px solid #ccc; padding-left: 1em; color: #555; margin: 1em 0;">
              ${preview.replace(/\n/g, "<br>")}
            </blockquote>
            <p><a href="https://lost-time.org/messages/${conversation_id}" style="color: #800000; text-decoration: underline;">Open correspondence</a></p>
            <p style="color: #666; font-size: 0.9em;">If you do not respond within 34 hours, member #${senderNum} may end this correspondence.</p>
            <p style="color: #666; font-size: 0.9em;">You may end this correspondence only after you have responded.</p>
            <p style="color: #888; font-size: 0.9em; margin-top: 2em;">— lost time</p>
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
