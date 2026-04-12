const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const API_BASE = "https://api.worldota.net/api/b2b/v3";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { hotelId, hid, checkin, checkout, guests, currency } = await req.json();
    if (!hotelId && !hid) throw new Error("Missing hotelId or hid");

    const userId = (Deno.env.get("RATEHAWK_USER_ID") || "").trim();
    const apiKey = (Deno.env.get("RATEHAWK_API_KEY") || "").trim();
    const auth = btoa(`${userId}:${apiKey}`);

    const lang = Deno.env.get("RATEHAWK_LANGUAGE") || "hu";
    const residency = Deno.env.get("RATEHAWK_RESIDENCY") || "HU";

    // ✅ 1) hotel/info body
    const infoBody = hotelId
      ? { id: hotelId, language: lang }
      : { hid, language: lang };

    const infoRes = await fetch(`${API_BASE}/hotel/info/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify(infoBody),
    });

    const info = await infoRes.json();

// ✅ Normalize: mindig a hotel objektumot adjuk vissza
const infoHotel =
  (info as any)?.hotel ??
  (info as any)?.data?.hotel ??
  (info as any)?.data ??
  info;

// ✅ "Places nearby" kinyerése dump nélkül (hotel/info → description_struct → Location)
function extractNearbyPlaces(infoHotel: any): string[] {
  const ds = infoHotel?.description_struct;
  if (!Array.isArray(ds)) return [];

  const locBlock = ds.find((b: any) => {
    const t = String(b?.title || "").toLowerCase();
    return t === "location" || t === "elhelyezkedés" || t === "helyszín";
  });

  const paragraphs: string[] = Array.isArray(locBlock?.paragraphs) ? locBlock.paragraphs : [];
  const fullText = paragraphs.join(" ");

  // több nyelvi / variáns prefixet próbálunk
  const prefixes = [
    "Places nearby:",
    "Places nearby :",
    "Nearby places:",
    "Helyek a közelben:",
    "A közelben:",
  ];

  let tail = "";
  for (const p of prefixes) {
    const idx = fullText.indexOf(p);
    if (idx !== -1) {
      tail = fullText.slice(idx + p.length).trim();
      break;
    }
  }
  if (!tail) return [];

  // tipikusan vesszőkkel van felsorolva, a végén ponttal
  tail = tail.replace(/\.$/, "").trim();
  const items = tail
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  return items;
}

const nearby_places = extractNearbyPlaces(infoHotel);

    // ✅ 2) search/hp body
let hp: any = null;
let hp_error: string | null = null;

// Ha nincs dátum, HP-t nem érdemes hívni (nem lesz rates/price)
if (!checkin || !checkout) {
  hp_error = "missing_checkin_or_checkout";
} else {
  const hpBody: any = {
    checkin,
    checkout,
    guests: guests && Array.isArray(guests) ? guests : [{ adults: 2, children: [] }],
    language: lang,
    currency: currency || "EUR", // egyeztetjük a kereséssel
    residency,
  };

  if (hid) hpBody.hid = hid;
  else if (hotelId) hpBody.id = hotelId;

  const hpRes = await fetch(`${API_BASE}/search/hp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`,
    },
    body: JSON.stringify(hpBody),
  });

  if (!hpRes.ok) {
    const t = await hpRes.text();
    hp_error = `hp_not_ok_${hpRes.status}:${t.slice(0, 300)}`;
    hp = null;
  } else {
    hp = await hpRes.json();
  }
}

// ✅ EZ HIÁNYZOTT
return new Response(
  JSON.stringify({
    success: true,
    info: { ...infoHotel, nearby_places },
    hp,
    hp_error,
  }),
  {
    headers: { "Content-Type": "application/json", ...corsHeaders },
  }
);

  } catch (e) {
    // ✅ EZ IS HIÁNYZOTT
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

