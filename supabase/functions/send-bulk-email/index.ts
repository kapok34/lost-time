import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SECRET_KEYS = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEYS['default'], {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id);

  const isAdmin = (roles ?? []).some((r: any) => r.role === "admin");
  if (!isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { subject, body } = await req.json();

  if (!subject || !body) {
    return new Response(JSON.stringify({ error: "Missing subject or body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, member_number")
    .eq("status", "approved");

  if (profilesError) {
    console.error("Database error:", profilesError);
    return new Response(
      JSON.stringify({ error: profilesError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();

  if (usersError) {
    console.error("Auth admin error:", usersError);
    return new Response(
      JSON.stringify({ error: usersError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const approvedIds = new Set((profiles ?? []).map((p: any) => p.id));
  const recipients = (usersData?.users ?? []).filter((u: any) => approvedIds.has(u.id) && u.email);
  const failures: { email: string; error: string }[] = [];

  await Promise.all(
    recipients.map(async (u: any) => {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "lost time <noreply@lost-time.org>",
            to: [u.email],
            subject,
            text: body,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          console.error(`Failed to send to ${u.email}:`, err);
          failures.push({ email: u.email, error: err });
        }
      } catch (err: any) {
        console.error(`Exception sending to ${u.email}:`, err);
        failures.push({ email: u.email, error: err.message });
      }
    })
  );

  return new Response(
    JSON.stringify({
      sent: recipients.length - failures.length,
      total: recipients.length,
      failures,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
