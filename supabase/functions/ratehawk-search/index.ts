const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_BASE = "https://api.worldota.net/api/b2b/v3";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
  return new Response("ok", {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

  const start = Date.now();

  try {
    const {
      regionId,
      hotelIds,
      latitude,
      longitude,
      checkin,
      checkout,
      guests,
      currency,
      language,
      residency,
      page,
      pageSize,
    } = await req.json();

    // Minimál validálás
    if (!checkin || !checkout) {
      return jsonResponse({ success: false, error: "Missing checkin/checkout" }, 400);
    }

    const userId = (Deno.env.get("RATEHAWK_USER_ID") || "").trim();
    const apiKey = (Deno.env.get("RATEHAWK_API_KEY") || "").trim();

    if (!userId || !apiKey) {
      return jsonResponse({ success: false, error: "Missing RATEHAWK credentials in env" }, 500);
    }

    const auth = btoa(`${userId}:${apiKey}`);

    // Pagination – régi, bevált logika (Famous-safe)
const pageNum = Number.isFinite(Number(page)) ? Math.max(1, Number(page)) : 1;
const pageSizeNum = Number.isFinite(Number(pageSize)) ? Math.max(1, Number(pageSize)) : 20;

// Progresszíven növekvő limit, MAX 100
// pl. page 1 → 30, page 2 → 50, page 3 → 70, stb.
const hotelsLimit = Math.min(pageNum * pageSizeNum + 10, 100);

// 🔑 Cache signature (későbbi cache get/set alapja) – currency-vel!
// Fontos: fix sorrend, hogy determinisztikus legyen a kulcs.
const cur = (currency || Deno.env.get("RATEHAWK_CURRENCY") || "HUF");
const langSig = (language || Deno.env.get("RATEHAWK_LANGUAGE") || "hu");
const resSig = (residency || Deno.env.get("RATEHAWK_RESIDENCY") || "HU");

const guestsSig = Array.isArray(guests) && guests.length > 0 ? JSON.stringify(guests) : JSON.stringify([{ adults: 2 }]);

const request_signature =
  `ratehawk|` +
  `region=${regionId ?? ""}|` +
  `in=${checkin}|out=${checkout}|` +
  `guests=${guestsSig}|` +
  `cur=${cur}|` +                // ✅ EZ A LÉNYEG MOST
  `lang=${langSig}|res=${resSig}|` +
  `page=${pageNum}|limit=${pageSizeNum}`;

// Ha később tárolnánk, ez lenne a cache key:
const cache_key = `search:${request_signature}`;

console.log("ratehawk-search: signature", { cache_key });

const body: any = {
  checkin,
  checkout,
  guests: Array.isArray(guests) && guests.length > 0 ? guests : [{ adults: 2 }],
  language: (language || Deno.env.get("RATEHAWK_LANGUAGE") || "hu"),
  currency: cur,
  residency: (residency || Deno.env.get("RATEHAWK_RESIDENCY") || "HU"),
  timeout: 15,

  // 🔑 EZ A LÉNYEG
  hotels_limit: hotelsLimit,
};

    let endpoint = "";
    if (regionId) {
      endpoint = "/search/serp/region/";
      body.region_id = regionId;
    } else if (Array.isArray(hotelIds) && hotelIds.length > 0) {
      endpoint = "/search/serp/hotels/";
      body.ids = hotelIds;
    } else if (latitude && longitude) {
      endpoint = "/search/serp/geo/";
      body.latitude = latitude;
      body.longitude = longitude;
      body.radius = 10000;
    } else {
      return jsonResponse({ success: false, error: "Missing required search parameters" }, 400);
    }

    console.log("ratehawk-search: calling", endpoint, {
      regionId: regionId ?? null,
      page: pageNum,
      pageSize: pageSizeNum,
    });

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.json();

    if (!res.ok) {
      // Ratehawk hibát “szépen” adjuk vissza, ne dobjuk el a runtime-ot
      return jsonResponse(
        {
          success: false,
          error: raw?.error || "ratehawk_error",
          ratehawk_status: res.status,
          ratehawk_body: raw,
        },
        500,
      );
    }

    // Normalizálás: csak a minimális mezők menjenek a frontendnek
    const sourceHotels =
      raw?.hotels ??
      raw?.data?.hotels ??
      raw?.result?.hotels ??
      raw?.items ??
      [];

    const hotels = Array.isArray(sourceHotels)
      ? sourceHotels.map((h: any) => {
          const rates = Array.isArray(h?.rates) ? h.rates : [];
// ✅ KANONIKUS NÉV ÉS KÉP – enrichment nélkül is stabil
const canonicalName = h?.name ?? h?.hotel?.name ?? null;
const canonicalImages = h?.images ?? h?.hotel?.images ?? null;
          const topRates = rates.slice(0, 2).map((r: any) => ({
            price: r?.price ?? r?.payment_options?.payment_types?.[0]?.show_amount ?? null,
            currency: r?.currency ?? r?.payment_options?.payment_types?.[0]?.show_currency_code ?? null,
            daily_prices: r?.daily_prices ?? null,
            meal: r?.meal ?? null,
            // a frontend később tudja szépen feldolgozni
            freeCancellation: r?.cancellation_penalties ? true : null,
            hasBreakfast: r?.meal_data?.has_breakfast ?? null,
            match_hash: r?.match_hash ?? null,
          }));

          return {
            id: h?.id ?? null,
            hid: h?.hid ?? null,
            hotel: h?.hotel ?? null, // ha van nested hotel blokk (név/kép/cím)
            name: canonicalName,
            address: h?.address ?? null,
            city: h?.city ?? null,
            images: canonicalImages,
            starRating: h?.stars ?? h?.star_rating ?? null,
            rates: topRates,
            score: h?.score ?? null,
          };
        })
      : [];
        // ✅ Pagination slice (csak az aktuális oldal hoteljeit küldjük vissza)
    const startIndex = (pageNum - 1) * pageSizeNum;
    const endIndex = startIndex + pageSizeNum;

    const pageHotels = hotels.slice(startIndex, endIndex);

    // ✅ Enrichment: ha hiányzik név/kép, akkor ráhívunk hotel/info-ra CSAK a page elemeire
    const lang = (language || Deno.env.get("RATEHAWK_LANGUAGE") || "hu");

    const needsEnrichment = (h: any) => {
      const hasName = Boolean(h?.name || h?.hotel?.name);
      const imgs = h?.images || h?.hotel?.images;
      const hasImage = Array.isArray(imgs) ? imgs.length > 0 : Boolean(imgs);
      return !hasName || !hasImage;
    };

    let fetched_static_count = 0;

    const ENABLE_ENRICHMENT = true;
    for (let i = 0; i < pageHotels.length; i++) {
      const h = pageHotels[i];
      if (!needsEnrichment(h)) continue;

            // ✅ ID választás: először a string "id", utána "hid"
      const preferredId =
        (typeof h?.id === "string" && h.id.trim().length > 0) ? h.id.trim() : null;

      const fallbackHid =
        (h?.hid != null && String(h.hid).trim().length > 0) ? h.hid : null;

            // ✅ hotel/info-hoz a SERP string "id" kell (nem a hid)
      const infoId =
        (typeof h?.id === "string" && h.id.trim().length > 0) ? h.id.trim() : null;

      if (!infoId) continue;

      try {
        const infoRes = await fetch(`${API_BASE}/hotel/info/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Basic ${auth}`,
          },
          body: JSON.stringify({ id: infoId, language: lang }),
        });

                if (!infoRes.ok) {
          const errBody = await infoRes.text();
          console.log("ratehawk-search: hotel/info FAILED", {
            status: infoRes.status,
            infoId,
            errBody: errBody?.slice?.(0, 300) ?? errBody,
          });
          continue;
        }

        const infoRaw = await infoRes.json();

        // Debug: egyszer, hogy lássuk a szerkezetet (ne logoljunk vég nélkül)
        if (fetched_static_count === 0) {
          console.log("ratehawk-search: hotel/info OK sample keys", {
            infoId,
            topKeys: Object.keys(infoRaw || {}),
            hotelKeys: Object.keys((infoRaw?.hotel ?? infoRaw?.data?.hotel ?? infoRaw?.data ?? {}) || {}),
          });
        }

        const infoHotel =
          infoRaw?.hotel ??
          infoRaw?.data?.hotel ??
          infoRaw?.data ??
          infoRaw;

        // képek normalizálása (string[] vagy {url}[])
                const rawImages =
          infoHotel?.images ??
          infoHotel?.photos ??
          infoHotel?.image_urls ??
          [];

        const infoImages = Array.isArray(rawImages)
          ? rawImages
              .map((x: any) => (typeof x === "string" ? x : x?.url))
              .filter(Boolean)
          : [];

        pageHotels[i] = {
          ...h,
          // a top-level mezők menjenek is ki, hogy a HotelCard könnyen használja
          name: h?.name ?? infoHotel?.name ?? null,
          address: h?.address ?? infoHotel?.address ?? null,
          starRating: h?.starRating ?? infoHotel?.stars ?? infoHotel?.star_rating ?? null,
          images: Array.isArray(h?.images) && h.images?.length ? h.images : infoImages,

          // opcionálisan tartsuk meg "hotel" blokkban is (ha a UI ezt is használja)
          hotel: h?.hotel ?? infoHotel ?? null,
        };

        fetched_static_count++;
      } catch (_e) {
        // ha enrichment fail, marad a meglévő adat (frontend fallback-ol)
      }
    }

    const enrichment_partial = pageHotels.some(needsEnrichment);

    const totalHotels =
      Number(raw?.total) ||
      Number(raw?.total_hotels) ||
      Number(raw?.count) ||
      hotels.length;

    const totalPages = Math.max(1, Math.ceil(totalHotels / pageSizeNum));

    console.log("ratehawk-search: ok", {
      hotels: hotels.length,
      totalHotels,
      ms: Date.now() - start,
    });

    return jsonResponse({
      success: true,
      hotels: pageHotels,
      totalHotels,
      totalPages,
      page: pageNum,
      pageSize: pageSizeNum,
      fetched_static_count,
      enrichment_partial,
      // debug mezők (ha a frontend logolja)
      debug_version: "search_v2_min_payload",
      request_signature,
      cache_key,
    });
  } catch (e) {
    console.log("ratehawk-search: exception", String(e));
    return jsonResponse(
      { success: false, error: (e as Error)?.message || "unknown_error" },
      500,
    );
  }
});
