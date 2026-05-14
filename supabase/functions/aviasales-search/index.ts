const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function md5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  const str = unescape(encodeURIComponent(input));
  const x: number[] = [];
  for (let i = 0; i < str.length; i++) {
    x[i >> 2] = (x[i >> 2] ?? 0) | (str.charCodeAt(i) << ((i % 4) * 8));
  }
  x[str.length >> 2] = (x[str.length >> 2] ?? 0) | (0x80 << ((str.length % 4) * 8));
  x[(((str.length + 8) >> 6) + 1) * 16 + 14] = str.length * 8;
  for (let i = x.length; i < (((str.length + 8) >> 6) + 1) * 16 + 16; i++) x.push(0);
  let a = 1732584193,
    b = -271733879,
    c = -1732584194,
    d = 271733878;
  for (let i = 0; i < x.length; i += 16) {
    const olda = a,
      oldb = b,
      oldc = c,
      oldd = d;
    a = md5ff(a, b, c, d, x[i], 7, -680876936);
    d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
    a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5gg(b, c, d, a, x[i], 20, -373897302);
    a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
    a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5hh(d, a, b, c, x[i], 11, -358537222);
    c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
    a = md5ii(a, b, c, d, x[i], 6, -198630844);
    d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }
  return [a, b, c, d]
    .map((n) => {
      let s = "";
      for (let i = 0; i < 4; i++) s += ("0" + ((n >> (i * 8)) & 0xff).toString(16)).slice(-2);
      return s;
    })
    .join("");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeProposal(
  proposal: any,
  searchId: string,
  resultsUrl: string,
  airlines: Record<string, any>,
  agents: Record<string, any>,
  currency: string,
  tripClass: string,
  isReturn: boolean,
): any | null {
  try {
    const rawSegments: any[] = proposal.segment ?? [];
    if (rawSegments.length === 0) return null;

    const outboundLeg = rawSegments[0];
    const returnLeg = rawSegments.length > 1 ? rawSegments[1] : null;
    if (!outboundLeg?.flight?.length) return null;

    const outFlights: any[] = outboundLeg.flight;
    const firstFlight = outFlights[0];
    const lastFlight = outFlights[outFlights.length - 1];

    const from = firstFlight.departure ?? "";
    const to = lastFlight.arrival ?? "";
    const departureLocal = firstFlight.local_departure_timestamp
      ? new Date(firstFlight.local_departure_timestamp * 1000).toISOString()
      : (firstFlight.departure_date ?? "") + "T" + (firstFlight.departure_time ?? "00:00");
    const arrivalLocal = lastFlight.local_arrival_timestamp
      ? new Date(lastFlight.local_arrival_timestamp * 1000).toISOString()
      : (lastFlight.arrival_date ?? "") + "T" + (lastFlight.arrival_time ?? "00:00");

    const durationMinutes =
      outboundLeg.duration ?? outFlights.reduce((acc: number, f: any) => acc + (f.duration ?? 0), 0);
    const stops = outFlights.length - 1;
    const stopAirports = outFlights
      .slice(0, -1)
      .map((f: any) => f.arrival ?? "")
      .filter(Boolean);

    const segments = outFlights.map((f: any) => ({
      from: f.departure ?? "",
      to: f.arrival ?? "",
      departureLocal: f.local_departure_timestamp
        ? new Date(f.local_departure_timestamp * 1000).toISOString()
        : (f.departure_date ?? "") + "T" + (f.departure_time ?? "00:00"),
      arrivalLocal: f.local_arrival_timestamp
        ? new Date(f.local_arrival_timestamp * 1000).toISOString()
        : (f.arrival_date ?? "") + "T" + (f.arrival_time ?? "00:00"),
      durationMinutes: f.duration ?? 0,
      airlineCode: f.operating_carrier ?? f.marketing_carrier ?? "",
      flightNumber: String(f.number ?? ""),
      aircraft: f.aircraft_code ?? "",
    }));

    const airlineCodes = [
      ...new Set(outFlights.map((f: any) => f.marketing_carrier ?? f.operating_carrier ?? "").filter(Boolean)),
    ] as string[];
    const airlineNames = airlineCodes.map((code) => airlines[code]?.name ?? code);
    const airlineLogos = airlineCodes.map((code) => `https://www.gstatic.com/flights/airline_logos/70px/${code}.png`);

    const termsEntries = Object.entries(proposal.terms ?? {});
    if (termsEntries.length === 0) return null;

    const [agentIdStr, termData]: [string, any] = termsEntries[0] as any;
    const agentId = parseInt(agentIdStr, 10) || 0;
    const agentInfo = agents[agentIdStr] ?? agents[agentId] ?? {};
    const agentName = agentInfo.name ?? agentInfo.agency ?? "Unknown";
    const isLowcost = agentInfo.is_lowcost === true;

    const totalPrice = termData.unified_price ?? termData.price ?? 0;
    const totalPax =
      (proposal.passengers?.adults ?? 1) + (proposal.passengers?.children ?? 0) + (proposal.passengers?.infants ?? 0);
    const pricePerPerson = totalPax > 0 ? Math.round(totalPrice / totalPax) : totalPrice;

    const baggageData = termData.baggage ?? null;
    let baggageIncluded = false;
    let baggageWeight: number | null = null;
    if (baggageData) {
      const firstBag =
        typeof baggageData === "object" && !Array.isArray(baggageData)
          ? (baggageData["0"] ?? baggageData["1"] ?? null)
          : baggageData;
      if (firstBag !== null && firstBag !== false && firstBag !== 0) {
        baggageIncluded = true;
        if (typeof firstBag === "number") baggageWeight = firstBag;
        else if (typeof firstBag?.weight === "number") baggageWeight = firstBag.weight;
      }
    }

    const handData = termData.handbags ?? null;
    let handbagsIncluded = true;
    let handbagsWeight: number | null = null;
    if (handData !== null && handData !== undefined) {
      if (typeof handData === "number" && handData > 0) handbagsWeight = handData;
    }

    const seatsAvailable = termData.seats_available ?? null;

    let returnDepartureLocal: string | undefined;
    let returnArrivalLocal: string | undefined;
    let returnDurationMinutes: number | undefined;
    let returnStops: number | undefined;
    let returnStopAirports: string[] | undefined;
    let returnSegments: any[] | undefined;

    if (returnLeg?.flight?.length) {
      const retFlights: any[] = returnLeg.flight;
      const firstRet = retFlights[0];
      const lastRet = retFlights[retFlights.length - 1];
      returnDepartureLocal = firstRet.local_departure_timestamp
        ? new Date(firstRet.local_departure_timestamp * 1000).toISOString()
        : (firstRet.departure_date ?? "") + "T" + (firstRet.departure_time ?? "00:00");
      returnArrivalLocal = lastRet.local_arrival_timestamp
        ? new Date(lastRet.local_arrival_timestamp * 1000).toISOString()
        : (lastRet.arrival_date ?? "") + "T" + (lastRet.arrival_time ?? "00:00");
      returnDurationMinutes =
        returnLeg.duration ?? retFlights.reduce((acc: number, f: any) => acc + (f.duration ?? 0), 0);
      returnStops = retFlights.length - 1;
      returnStopAirports = retFlights
        .slice(0, -1)
        .map((f: any) => f.arrival ?? "")
        .filter(Boolean);
      returnSegments = retFlights.map((f: any) => ({
        from: f.departure ?? "",
        to: f.arrival ?? "",
        departureLocal: f.local_departure_timestamp
          ? new Date(f.local_departure_timestamp * 1000).toISOString()
          : (f.departure_date ?? "") + "T" + (f.departure_time ?? "00:00"),
        arrivalLocal: f.local_arrival_timestamp
          ? new Date(f.local_arrival_timestamp * 1000).toISOString()
          : (f.arrival_date ?? "") + "T" + (f.arrival_time ?? "00:00"),
        durationMinutes: f.duration ?? 0,
        airlineCode: f.operating_carrier ?? f.marketing_carrier ?? "",
        flightNumber: String(f.number ?? ""),
        aircraft: f.aircraft_code ?? "",
      }));
    }

    const proposalId = proposal.sign ?? proposal.proposal_id ?? from + to + departureLocal;

    return {
      id: `${searchId}_${proposalId}_${agentIdStr}`,
      proposalId,
      searchId,
      resultsUrl,
      ticketSignature: proposal.sign ?? "",
      from,
      to,
      departureLocal,
      arrivalLocal,
      durationMinutes,
      stops,
      stopAirports,
      segments,
      airlineCodes,
      airlineNames,
      airlineLogos,
      price: Math.round(totalPrice),
      pricePerPerson: Math.round(pricePerPerson),
      currency,
      agentId,
      agentName,
      baggageIncluded,
      baggageWeight,
      handbagsIncluded,
      handbagsWeight,
      tripClass,
      seatsAvailable,
      isLowcost,
      isReturn,
      ...(returnLeg
        ? {
            returnDepartureLocal,
            returnArrivalLocal,
            returnDurationMinutes,
            returnStops,
            returnStopAirports,
            returnSegments,
          }
        : {}),
    };
  } catch (e) {
    console.warn("[normalizeProposal] error:", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    if (!body.origin || !body.destination || !body.departureDate) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: origin, destination, departureDate" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const marker = Deno.env.get("TRAVELPAYOUTS_MARKER_ID");
    const token = Deno.env.get("TRAVELPAYOUTS_API_TOKEN");

    if (!marker || !token) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error: missing API credentials" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const origin = String(body.origin).toUpperCase();
    const destination = String(body.destination).toUpperCase();
    const currency = body.currency || "EUR";
    const market_code = (body.marketCode || body.market || body.market_code || "HU").toUpperCase();
    const trip_class = body.tripClass || body.trip_class || "Y";
    const isReturn = Boolean(body.returnDate);

    let locale = body.locale || "en_US";
    if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) {
      const lc = locale.toLowerCase().slice(0, 2);
      const localeMap: Record<string, string> = {
        hu: "hu_HU",
        en: "en_US",
        de: "de_DE",
        fr: "fr_FR",
        es: "es_ES",
        it: "it_IT",
        ru: "ru_RU",
        pl: "pl_PL",
      };
      locale = localeMap[lc] || "en_US";
    }

    const directions = [{ origin, destination, date: body.departureDate }];
    if (body.returnDate) {
      directions.push({ origin: destination, destination: origin, date: body.returnDate });
    }

    const searchBody = {
      currency_code: currency,
      marker,
      locale,
      market_code,
      search_params: {
        directions,
        passengers: {
          adults: body.adults || 1,
          children: body.children || 0,
          infants: body.infants || 0,
        },
        trip_class,
      },
    };

    // Signature: MD5(token:marker)
    const signature = md5(`${token}:${marker}`);

    const userIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "1.1.1.1";
    const appHost =
      req.headers
        .get("origin")
        ?.replace(/^https?:\/\//, "")
        .split("/")[0] || "lanzaventura.com";

    console.log("[aviasales-search] Starting:", {
      origin,
      destination,
      departureDate: body.departureDate,
      market_code,
      currency,
    });

    const startResponse = await fetch("https://tickets-api.travelpayouts.com/search/affiliate/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-application-host": appHost,
        "x-user-ip": userIp,
        "x-signature": signature,
      },
      body: JSON.stringify(searchBody),
    });

    if (!startResponse.ok) {
      const errText = await startResponse.text();
      console.error("[aviasales-search] Start failed:", startResponse.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: `Search start failed (${startResponse.status}): ${errText}` }),
        {
          status: startResponse.status === 429 ? 429 : 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const startData = await startResponse.json();
    const search_id: string = startData.search_id;
    const results_url: string = startData.results_url;

    if (!search_id || !results_url) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid API response: missing search_id or results_url" }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    console.log("[aviasales-search] Search started:", { search_id, results_url });

    let proposals: any[] = [];
    let airlines: Record<string, any> = {};
    let agents: Record<string, any> = {};
    let isComplete = false;

    for (let attempt = 1; attempt <= 8; attempt++) {
      await sleep(2000);
      try {
        const pollRes = await fetch(results_url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-application-host": appHost,
            "x-user-ip": userIp,
            Authorization: `Bearer ${token}`,
          },
        });

        if (!pollRes.ok) {
          console.warn(`[aviasales-search] Poll ${attempt} HTTP ${pollRes.status}`);
          continue;
        }

        const pollData = await pollRes.json();
        const pollProposals: any[] = pollData.proposals ?? pollData.flights ?? pollData.results ?? [];
        Object.assign(airlines, pollData.airlines ?? {});
        Object.assign(agents, pollData.agents ?? {});
        const searchCompleted: boolean = pollData.search_completed ?? false;

        console.log(
          `[aviasales-search] Poll ${attempt}: ${pollProposals.length} proposals, complete=${searchCompleted}`,
        );

        if (pollProposals.length > 0) {
          proposals = [...proposals, ...pollProposals];
          const seen = new Set<string>();
          proposals = proposals.filter((p) => {
            const key = p.sign ?? p.proposal_id ?? JSON.stringify(p).slice(0, 50);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }

        if (searchCompleted) {
          isComplete = true;
          break;
        }
        if (proposals.length >= 20 && attempt >= 4) break;
      } catch (pollErr) {
        console.error(`[aviasales-search] Poll ${attempt} error:`, pollErr);
      }
    }

    console.log(`[aviasales-search] Done. ${proposals.length} raw proposals`);

    const flights = proposals
      .map((p) => normalizeProposal(p, search_id, results_url, airlines, agents, currency, trip_class, isReturn))
      .filter(Boolean)
      .sort((a: any, b: any) => a.price - b.price)
      .slice(0, 50);

    console.log(`[aviasales-search] Normalized: ${flights.length} flights`);

    return new Response(
      JSON.stringify({
        success: true,
        searchId: search_id,
        resultsUrl: results_url,
        flights,
        totalResults: flights.length,
        isComplete,
      }),
      {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (err: any) {
    console.error("[aviasales-search] Error:", err);
    return new Response(JSON.stringify({ success: false, error: err.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
