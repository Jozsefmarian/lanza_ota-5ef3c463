const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const RATEHAWK_API_BASE = "https://api.worldota.net/api/b2b/v3";

// Base64 encoder (Deno-safe)
function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const base64abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "", i;
  for (i = 0; i + 2 < bytes.length; i += 3) {
    result += base64abc[bytes[i] >> 2];
    result += base64abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += base64abc[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += base64abc[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    result += base64abc[bytes[i] >> 2];
    if (i === bytes.length - 1) {
      result += base64abc[(bytes[i] & 3) << 4] + "==";
    } else {
      result += base64abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)] + base64abc[(bytes[i + 1] & 15) << 2] + "=";
    }
  }
  return result;
}

// Core Ratehawk client helper
async function ratehawkPost(endpoint: string, body: any) {
  const apiKeyFull = Deno.env.get("RATEHAWK_API_KEY");
  if (!apiKeyFull) throw new Error("RATEHAWK_API_KEY not configured");

  let keyId, secret;
  if (apiKeyFull.includes(":")) [keyId, secret] = apiKeyFull.split(":");
  else keyId = secret = apiKeyFull;

  const auth = base64Encode(`${keyId}:${secret}`);

  const res = await fetch(`${RATEHAWK_API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  if (!res.ok) throw new Error(`RateHawk error ${res.status}: ${text.substring(0, 150)}`);
  return data;
}

// 👇 Famous expects exactly this structure:
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { endpoint, body } = await req.json();
    const data = await ratehawkPost(endpoint, body);
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
});
