import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const caller = userData.user.id;

  const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
    _user_id: caller,
    _role: "admin",
  });

  if (roleError || !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const memberId = body?.member_id as string | undefined;
  if (!memberId) {
    return new Response(
      JSON.stringify({ error: "Missing member_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(memberId);
  if (deleteError) {
    console.error("Delete member error:", deleteError);
    return new Response(
      JSON.stringify({ error: deleteError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
