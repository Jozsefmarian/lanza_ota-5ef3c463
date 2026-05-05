const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let query: string | null = null;

if (req.method === "POST") {
  const body = await req.json();
  query = body?.query ?? null;
} else {
  const url = new URL(req.url);
  query = url.searchParams.get("query");
}

    // 1️⃣ Ha nincs query vagy túl rövid → üres lista
    if (!query || query.length < 2) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2️⃣ RateHawk multicomplete hívás
    const ratehawkResponse = await fetch(
      "https://api.worldota.net/api/b2b/v3/search/multicomplete/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Basic " +
            btoa(
              `${Deno.env.get("RATEHAWK_USER_ID")}:${Deno.env.get("RATEHAWK_API_KEY")}`
            ),
        },
        body: JSON.stringify({
          query,
          language: "en",
        }),
      }
    );

    if (!ratehawkResponse.ok) {
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await ratehawkResponse.json();

    // 3️⃣ Csak REGION típusú találatok
    const regions =
      data?.regions
        ?.filter((item: any) => item.type === "region")
        ?.slice(0, 10)
        ?.map((item: any) => ({
          label: `${item.name}, ${item.country_code}`,
          region_id: item.id,
        })) || [];

    // 4️⃣ Frontend-barát válasz
    return new Response(JSON.stringify(regions), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json" },
    });
  }
});
