const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: any) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ✅ Authorization header kiolvasás (Famous kompatibilis)
    let authHeader = "";
    const h = req?.headers;

    if (h) {
      if (typeof h.get === "function") {
        authHeader = h.get("Authorization") || h.get("authorization") || "";
      } else {
        authHeader = h.authorization || h.Authorization || h.AUTHORIZATION || "";
      }
    }

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "Missing bearer token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // ✅ User lekérése közvetlen auth endpointtal (ugyanaz a minta, mint signupnál)
    const resp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: authHeader, // Bearer <user_jwt>
      },
    });

    const json = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return new Response(JSON.stringify({ ok: false, error: json?.msg || json?.error || "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Többféle lehetséges Supabase válaszstruktúra kezelése
const emailRaw =
  json?.email ??
  json?.user?.email ??
  json?.data?.user?.email ??
  json?.data?.email;

const email = String(emailRaw || "").trim().toLowerCase();

if (!email) {
  return new Response(
    JSON.stringify({ ok: false, error: "Not authenticated" }),
    {
      status: 401,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    }
  );
}

    const allowed = (Deno.env.get("ALLOWED_ADMIN_EMAILS") || "")
      .split(/[,\n;\t]+/g)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (!allowed.includes(email)) {
      return new Response(JSON.stringify({ ok: false, error: "Not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
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
