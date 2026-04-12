const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const API_BASE = "https://api.worldota.net/api/b2b/v3";

Deno.serve(async (req) => {
  const requestId =
  (globalThis.crypto as any)?.randomUUID?.() ??
  `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  console.log("[prebook] START", { requestId, method: req.method, url: req.url });

  if (req.method === "OPTIONS") {
    console.log("[prebook] OPTIONS", { requestId });
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { book_hash, price_increase_percent } = await req.json();

    if (!book_hash) throw new Error("Missing book_hash (expected h-...)");

    const userId = (Deno.env.get("RATEHAWK_USER_ID") || "").trim();
    const apiKey = (Deno.env.get("RATEHAWK_API_KEY") || "").trim();
    const auth = btoa(`${userId}:${apiKey}`);

    // DOKSI szerinti endpoint: /hotel/prebook/
    const res = await fetch(`${API_BASE}/hotel/prebook/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify({
  hash: book_hash, // ✅ Ratehawk prebook ezt várja (különben "empty hash")
  ...(typeof price_increase_percent === "number"
    ? { price_increase_percent }
    : {}),
}),
    });

    const data = await res.json();

    // Ha a provider nem 200-at ad, azt ne success=true-vel csomagoljuk vissza
    if (!res.ok) {
      return new Response(
        JSON.stringify({ success: false, prebook: data }),
        { status: res.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, prebook: data }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

