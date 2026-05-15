const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const token = Deno.env.get("TRAVELPAYOUTS_API_TOKEN") ?? "";
    const marker = Deno.env.get("TRAVELPAYOUTS_MARKER_ID") ?? "545241";

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: "Missing API token" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const body = await req.json();
    const origin = String(body.origin || "").toUpperCase();
    const destination = String(body.destination || "").toUpperCase();
    const currency = String(body.currency || "eur").toLowerCase();
    const departureDate = String(body.departureDate || "");
    const returnDate = body.returnDate ? String(body.returnDate) : null;
    const adults = Number(body.adults || 1);

    if (!origin || !destination) {
      return new Response(JSON.stringify({ success: false, error: "Missing origin or destination" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Affiliate link builder (Aviasales)
    const buildAffiliateUrl = (depDate: string, retDate: string | null) => {
      const dep = depDate.replace(/-/g, "");
      const dd = dep.slice(6, 8);
      const mm = dep.slice(4, 6);
      let url = `https://www.aviasales.com/search/${origin}${dd}${mm}${destination}`;
      if (retDate) {
        const ret = retDate.replace(/-/g, "");
        url += ret.slice(6, 8) + ret.slice(4, 6);
      }
      url += `${adults}?marker=${marker}&shmarker=${marker}`;
      return url;
    };

    const mainAffiliateUrl = buildAffiliateUrl(departureDate, returnDate);
    const searchId = `v1_${origin}_${destination}_${departureDate}`;

    // v1/prices/cheap - works from Supabase IP, returns real ticket data
    const cheapUrl = new URL("https://api.travelpayouts.com/v1/prices/cheap");
    cheapUrl.searchParams.set("origin", origin);
    cheapUrl.searchParams.set("destination", destination);
    cheapUrl.searchParams.set("currency", currency.toUpperCase());
    cheapUrl.searchParams.set("token", token);
    if (departureDate) {
      // API accepts depart_date as YYYY-MM format
      cheapUrl.searchParams.set("depart_date", departureDate.slice(0, 7));
    }
    if (returnDate) {
      cheapUrl.searchParams.set("return_date", returnDate.slice(0, 7));
    }

    const cheapRes = await fetch(cheapUrl.toString(), { signal: AbortSignal.timeout(10000) });
    if (!cheapRes.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Travelpayouts API error: ${cheapRes.status}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const cheapJson = await cheapRes.json();
    // Response: { data: { DEST: { "1": { airline, departure_at, return_at, price, flight_number, duration, duration_to, duration_back }, "2": {...} } }, currency, success }

    if (!cheapJson.success || !cheapJson.data) {
      return new Response(
        JSON.stringify({ success: true, flights: [], totalResults: 0, resultsUrl: mainAffiliateUrl }),
        {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    // Flatten: data[DEST]["1"], data[DEST]["2"] ... are different price tiers
    const destData = cheapJson.data[destination] ?? {};
    const tickets: any[] = Object.values(destData);

    // If no tickets for this specific destination key, try all keys
    const allTickets: any[] =
      tickets.length > 0 ? tickets : Object.values(cheapJson.data).flatMap((d: any) => Object.values(d));

    if (allTickets.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          flights: [],
          totalResults: 0,
          resultsUrl: mainAffiliateUrl,
          message: "Erre az útvonalra most nincs cached adat. Próbálj más dátumot.",
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    // Sort by price
    allTickets.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

    // Map to AviasalesFlightOption shape
    const flights = allTickets.slice(0, 30).map((t: any, idx: number) => {
      const price = t.price ?? 0;
      const airline = t.airline ?? "";
      const departAt = t.departure_at ?? departureDate + "T00:00:00";
      const returnAt = t.return_at ?? null;
      const durationMinutes = t.duration_to ?? t.duration ?? 0;
      const returnDurationMinutes = t.duration_back ?? 0;

      const ticketUrl = buildAffiliateUrl(
        departAt.slice(0, 10) || departureDate,
        returnAt ? returnAt.slice(0, 10) : returnDate,
      );

      const logoUrl = airline ? `https://pics.avs.io/50/50/${airline}.png` : "";

      return {
        id: `v1_${origin}_${destination}_${idx}_${price}`,
        proposalId: `${origin}${destination}${idx}`,
        searchId,
        resultsUrl: ticketUrl,
        ticketSignature: "",
        from: origin,
        to: destination,
        departureLocal: departAt,
        arrivalLocal: departAt, // nem ismert pontosan, placeholder
        durationMinutes,
        stops: 0,
        stopAirports: [],
        segments: [
          {
            from: origin,
            to: destination,
            departureLocal: departAt,
            arrivalLocal: departAt,
            durationMinutes,
            airlineCode: airline,
            flightNumber: String(t.flight_number ?? ""),
            aircraft: "",
          },
        ],
        airlineCodes: airline ? [airline] : [],
        airlineNames: airline ? [airline] : [],
        airlineLogos: airline ? [logoUrl] : [],
        price,
        pricePerPerson: price,
        currency: (cheapJson.currency ?? currency).toUpperCase(),
        agentId: 0,
        agentName: "Aviasales",
        baggageIncluded: false,
        baggageWeight: null,
        handbagsIncluded: true,
        handbagsWeight: null,
        tripClass: body.tripClass || "Y",
        seatsAvailable: null,
        isLowcost: false,
        isReturn: Boolean(returnDate),
        returnDepartureLocal: returnAt ?? undefined,
        returnArrivalLocal: undefined,
        returnDurationMinutes: returnDurationMinutes || undefined,
        returnStops: 0,
        returnStopAirports: [],
        returnSegments: returnAt
          ? [
              {
                from: destination,
                to: origin,
                departureLocal: returnAt,
                arrivalLocal: returnAt,
                durationMinutes: returnDurationMinutes,
                airlineCode: airline,
                flightNumber: "",
                aircraft: "",
              },
            ]
          : [],
      };
    });

    return new Response(
      JSON.stringify({
        success: true,
        searchId,
        resultsUrl: mainAffiliateUrl,
        flights,
        totalResults: flights.length,
        isComplete: true,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
