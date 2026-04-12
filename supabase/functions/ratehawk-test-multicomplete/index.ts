export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const RATEHAWK_API_BASE = "https://api.worldota.net/api/b2b/v3";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function base64Encode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const base64abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i;
  for (i = 0; i + 2 < bytes.length; i += 3) {
    result += base64abc[bytes[i] >> 2];
    result += base64abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += base64abc[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += base64abc[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    result += base64abc[bytes[i] >> 2];
    if (i === bytes.length - 1) {
      result += base64abc[(bytes[i] & 3) << 4];
      result += "==";
    } else {
      result += base64abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      result += base64abc[(bytes[i + 1] & 15) << 2];
      result += "=";
    }
  }
  return result;
}

function toBasicAuth(keyId: string, apiKey: string): string {
  return base64Encode(`${keyId}:${apiKey}`);
}

async function ratehawkPost(endpoint: string, body: any): Promise<any> {
  const apiKeyFull = getEnv("RATEHAWK_API_KEY");
  let keyId: string, secret: string;
  if (apiKeyFull.includes(":")) {
    const colonIndex = apiKeyFull.indexOf(":");
    keyId = apiKeyFull.substring(0, colonIndex);
    secret = apiKeyFull.substring(colonIndex + 1);
  } else {
    keyId = apiKeyFull;
    secret = apiKeyFull;
  }
  const authHeader = `Basic ${toBasicAuth(keyId, secret)}`;
  const res = await fetch(`${RATEHAWK_API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { data = { raw: text.substring(0, 2000) }; }
  return { status: res.status, ok: res.ok, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const params = await req.json();
    const query = params.query || "Budapest";
    const language = params.language || "en";

    const mc = await ratehawkPost("/search/multicomplete/", {
      query,
      language,
    });

    // Return full response for debugging
    return new Response(JSON.stringify({
      success: true,
      query,
      language,
      raw_response: mc,
      regions_array: mc?.data?.regions || [],
      regions_types: (mc?.data?.regions || []).map((r: any) => ({ id: r?.id, name: r?.name, type: r?.type, country: r?.country })),
    }), { headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: String(error?.message || error),
    }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
