const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const API_BASE = "https://api.worldota.net/api/b2b/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { orderId, partnerOrderId } = await req.json();
    if (!orderId && !partnerOrderId) throw new Error("Missing orderId or partnerOrderId");

    const userId = (Deno.env.get("RATEHAWK_USER_ID") || "").trim();
    const apiKey = (Deno.env.get("RATEHAWK_API_KEY") || "").trim();
    const auth = btoa(`${userId}:${apiKey}`);

    const res = await fetch(`${API_BASE}/hotel/order/info/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify(orderId ? { order_id: orderId } : { partner_order_id: partnerOrderId }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, booking: data }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
