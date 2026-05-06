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
        subject: `Welcome to lost time — member #${memberNum}`,
        html: `
          <p>Hello ${profile.display_name},</p>
          <p>Your application has been approved. You are now <strong>member #${memberNum}</strong> of lost time.</p>
          <p>You can log in at <a href="https://lost-time.org/login">lost-time.org</a> to browse members and begin correspondences.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 1.5em 0;" />
          <p style="color: #555; font-size: 0.95em;">
            <strong>Need to change your answers?</strong><br>
            Reply to this email or write to the admin and we will update them for you.
          </p>
          <p style="color: #555; font-size: 0.95em;">
            <strong>Want to delete your account?</strong><br>
            <a href="${deleteUrl}">Delete your account</a> — this will permanently remove your profile, answers, messages and all associated data.
          </p>
          <p style="color: #999; font-size: 0.9em; margin-top: 2em;">— lost time</p>
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
