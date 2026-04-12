const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// supabase/functions/admin-signup/index.ts
Deno.serve(async (req) => {
  // ✅ CORS preflight mindig a legelején
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { email, password, fullName } = await req.json().catch(() => ({}));

    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const allowed = (Deno.env.get("ALLOWED_ADMIN_EMAILS") || "")
      .split(/[,\n;\t]+/g) // ✅ stabilabb, mint csak ","
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!allowed.includes(normalizedEmail)) {
      return new Response(JSON.stringify({ ok: false, error: "Email is not allowed to register" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const resp = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        data: { full_name: fullName || "" },
      }),
    });

    const json = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: json?.msg || json?.error_description || json?.error || "Signup failed",
          auth_status: resp.status, // ✅ későbbi hibakereséshez arany
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
