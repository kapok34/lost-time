import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@example.com";

serve(async (req) => {
  const { id, display_name, location, language, created_at } = await req.json();

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return new Response("RESEND_API_KEY not configured", { status: 500 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lost Time <noreply@losttime.app>",
        to: [ADMIN_EMAIL],
        subject: "New membership application",
        html: `
          <p>A new application has been submitted:</p>
          <ul>
            <li><strong>Display name:</strong> ${display_name}</li>
            <li><strong>Location:</strong> ${location}</li>
            <li><strong>Language:</strong> ${language}</li>
            <li><strong>Applied at:</strong> ${new Date(created_at).toLocaleString()}</li>
          </ul>
          <p><a href="https://losttime.app/admin">Review in Admin</a></p>
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
