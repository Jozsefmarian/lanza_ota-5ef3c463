const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};
const API_BASE = "https://api.worldota.net/api/b2b/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { prebookHash, partnerOrderId, guests, contact } = await req.json();
    if (!prebookHash) throw new Error("Missing prebookHash");

    const userId = (Deno.env.get("RATEHAWK_USER_ID") || "").trim();
    const apiKey = (Deno.env.get("RATEHAWK_API_KEY") || "").trim();
    const auth = btoa(`${userId}:${apiKey}`);

    const partnerId = partnerOrderId || `ORD-${Date.now()}`;

    const form = await fetch(`${API_BASE}/hotel/order/booking/form/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify({
        prebook_hash: prebookHash,
        partner_order_id: partnerId,
        guests,
        user_email: contact?.email,
        user_phone: contact?.phone,
        language: "hu",
      }),
    }).then(r => r.json());

    const finish = await fetch(`${API_BASE}/hotel/order/booking/finish/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Basic ${auth}` },
      body: JSON.stringify({ partner_order_id: partnerId }),
    }).then(r => r.json());

    return new Response(JSON.stringify({ success: true, booking: finish }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
