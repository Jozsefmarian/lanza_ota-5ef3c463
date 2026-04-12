
import { createHash } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ============================================
// Types
// ============================================

interface AviasalesSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  currency?: string;
  locale?: string;
  marketCode?: string;
  tripClass?: 'Y' | 'C' | 'F' | 'W';
}

interface AviasalesFlightOption {
  id: string;
  proposalId: string;
  searchId: string;
  resultsUrl: string;
  ticketSignature: string;
  from: string;
  to: string;
  departureLocal: string;
  arrivalLocal: string;
  durationMinutes: number;
  stops: number;
  stopAirports: string[];
  segments: AviasalesSegment[];
  airlineCodes: string[];
  airlineNames: string[];
  airlineLogos: string[];
  price: number;
  pricePerPerson: number;
  currency: string;
  agentId: number;
  agentName: string;
  baggageIncluded: boolean;
  baggageWeight: number | null;
  handbagsIncluded: boolean;
  handbagsWeight: number | null;
  tripClass: string;
  seatsAvailable: number | null;
  isLowcost: boolean;
  isReturn: boolean;
  returnDepartureLocal?: string;
  returnArrivalLocal?: string;
  returnDurationMinutes?: number;
  returnStops?: number;
  returnStopAirports?: string[];
  returnSegments?: AviasalesSegment[];
}

interface AviasalesSegment {
  from: string;
  to: string;
  departureLocal: string;
  arrivalLocal: string;
  durationMinutes: number;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
}

// ============================================
// Helpers
// ============================================

function collectValues(obj: any): string[] {
  const values: string[] = [];
  if (obj === null || obj === undefined) return values;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      values.push(...collectValues(item));
    }
  } else if (typeof obj === 'object') {
    // Sort keys alphabetically
    const sortedKeys = Object.keys(obj).sort();
    for (const key of sortedKeys) {
      if (key === 'signature') continue; // skip the signature field itself
      values.push(...collectValues(obj[key]));
    }
  } else {
    values.push(String(obj));
  }
  return values;
}

function buildSignature(token: string, bodyWithoutSignature: Record<string, any>): string {
  const values = collectValues(bodyWithoutSignature);
  const signatureString = token + ':' + values.join(':');
  return createHash('md5').update(signatureString).digest('hex');
}

function validateRequest(body: AviasalesSearchRequest): string | null {
  if (!body.origin || typeof body.origin !== 'string' || body.origin.length < 2 || body.origin.length > 4) {
    return 'Invalid origin IATA code';
  }
  if (!body.destination || typeof body.destination !== 'string' || body.destination.length < 2 || body.destination.length > 4) {
    return 'Invalid destination IATA code';
  }
  if (body.origin.toUpperCase() === body.destination.toUpperCase()) {
    return 'Origin and destination cannot be the same';
  }
  if (!body.departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.departureDate)) {
    return 'Invalid departure date format (YYYY-MM-DD required)';
  }
  if (body.returnDate && !/^\d{4}-\d{2}-\d{2}$/.test(body.returnDate)) {
    return 'Invalid return date format (YYYY-MM-DD required)';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const depDate = new Date(body.departureDate);
  if (depDate < today) {
    return 'Departure date cannot be in the past';
  }

  if (body.returnDate) {
    const retDate = new Date(body.returnDate);
    if (retDate < depDate) {
      return 'Return date cannot be before departure date';
    }
  }

  // Check date is within 1 year
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  const lastDate = body.returnDate ? new Date(body.returnDate) : depDate;
  if (lastDate > oneYearFromNow) {
    return 'Dates must be within one year from now';
  }

  const adults = body.adults || 0;
  if (adults < 1 || adults > 9) {
    return 'Adults must be between 1 and 9';
  }
  const children = body.children || 0;
  if (children < 0 || children > 6) {
    return 'Children must be between 0 and 6';
  }
  const infants = body.infants || 0;
  if (infants < 0 || infants > 6) {
    return 'Infants must be between 0 and 6';
  }
  if (infants > adults) {
    return 'Number of infants cannot exceed number of adults';
  }

  const validClasses = ['Y', 'C', 'F', 'W'];
  if (body.tripClass && !validClasses.includes(body.tripClass)) {
    return 'Invalid trip class (Y, C, F, W)';
  }

  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// Main handler
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: AviasalesSearchRequest = await req.json();

    // Validate
    const validationError = validateRequest(body);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ENV
    const token = Deno.env.get('TRAVELPAYOUTS_API_TOKEN');
    const marker = Deno.env.get('TRAVELPAYOUTS_MARKER_ID');

    if (!token || !marker) {
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error: missing API credentials' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Extract user IP from request headers
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || req.headers.get('cf-connecting-ip')
      || '';

    // Extract host
    const realHost = req.headers.get('origin')?.replace(/^https?:\/\//, '')
      || req.headers.get('referer')?.replace(/^https?:\/\//, '').split('/')[0]
      || 'lanzaventura.com';

    // Build directions
    const origin = body.origin.toUpperCase();
    const destination = body.destination.toUpperCase();
    const directions: any[] = [
      { origin, destination, date: body.departureDate }
    ];
    if (body.returnDate) {
      directions.push({ origin: destination, destination: origin, date: body.returnDate });
    }

    const currency = body.currency || 'EUR';
    const locale = body.locale || 'hu';
    const marketCode = body.marketCode || 'HU';
    const tripClass = body.tripClass || 'Y';

    // Build the request body (without signature first)
    const searchBody: Record<string, any> = {
      currency_code: currency,
      locale: locale,
      marker: marker,
      market_code: marketCode,
      search_params: {
        directions: directions,
        passengers: {
          adults: body.adults,
          children: body.children || 0,
          infants: body.infants || 0
        },
        trip_class: tripClass
      }
    };

    // Generate signature
    const signature = buildSignature(token, searchBody);
    searchBody.signature = signature;

    console.log('[aviasales-search] Starting search:', JSON.stringify({
      origin, destination,
      departureDate: body.departureDate,
      returnDate: body.returnDate,
      adults: body.adults,
      tripClass,
      currency
    }));

    // ============================================
    // Step 1: Start Search
    // ============================================
    const startUrl = 'https://tickets-api.travelpayouts.com/search/affiliate/start';

    const startResponse = await fetch(startUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-affiliate-user-id': token,
        'x-signature': signature,
        'x-user-ip': userIp,
        'x-real-host': realHost
      },
      body: JSON.stringify(searchBody)
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('[aviasales-search] Start search failed:', startResponse.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Search start failed (${startResponse.status}): ${errorText}`
      }), {
        status: startResponse.status === 429 ? 429 : 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const startData = await startResponse.json();
    const searchId = startData.search_id;
    const resultsUrl = startData.results_url;

    if (!searchId || !resultsUrl) {
      console.error('[aviasales-search] Missing search_id or results_url:', startData);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from search API: missing search_id or results_url'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('[aviasales-search] Search started:', { searchId, resultsUrl });

    // ============================================
    // Step 2: Poll for results
    // ============================================
    const resultsEndpoint = `${resultsUrl}/search/affiliate/results`;
    let lastUpdateTimestamp = 0;
    let allTickets: any[] = [];
    let allFlightLegs: any[] = [];
    let allAgents: Record<string, any> = {};
    let allAirlines: Record<string, any> = {};
    let isOver = false;
    const maxWaitMs = 30000;
    const pollIntervalMs = 1500;
    const startTime = Date.now();

    while (!isOver && (Date.now() - startTime) < maxWaitMs) {
      await sleep(pollIntervalMs);

      try {
        const resultsResponse = await fetch(resultsEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-affiliate-user-id': token,
            'x-signature': signature,
            'x-user-ip': userIp,
            'x-real-host': realHost
          },
          body: JSON.stringify({
            search_id: searchId,
            last_update_timestamp: lastUpdateTimestamp
          })
        });

        if (resultsResponse.status === 304) {
          // No new results yet
          continue;
        }

        if (resultsResponse.status === 429) {
          console.warn('[aviasales-search] Rate limited during polling');
          break;
        }

        if (!resultsResponse.ok) {
          const errText = await resultsResponse.text();
          console.error('[aviasales-search] Results poll error:', resultsResponse.status, errText);
          continue;
        }

        const resultsData = await resultsResponse.json();

        // Merge data
        if (resultsData.tickets && Array.isArray(resultsData.tickets)) {
          allTickets = [...allTickets, ...resultsData.tickets];
        }
        if (resultsData.flight_legs && Array.isArray(resultsData.flight_legs)) {
          // Flight legs are indexed globally, so we need to handle this carefully
          // On each poll, we get the FULL array of flight legs (not just new ones)
          allFlightLegs = resultsData.flight_legs;
        }
        if (resultsData.agents) {
          allAgents = { ...allAgents, ...resultsData.agents };
        }
        if (resultsData.airlines) {
          allAirlines = { ...allAirlines, ...resultsData.airlines };
        }

        if (resultsData.last_update_timestamp) {
          lastUpdateTimestamp = resultsData.last_update_timestamp;
        }

        isOver = resultsData.is_over === true;

        console.log(`[aviasales-search] Poll: tickets=${allTickets.length}, legs=${allFlightLegs.length}, isOver=${isOver}`);

      } catch (pollErr) {
        console.error('[aviasales-search] Poll error:', pollErr);
        continue;
      }
    }

    if (allTickets.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        searchId,
        resultsUrl,
        flights: [],
        totalResults: 0,
        isComplete: isOver,
        message: 'No flights found for the given search criteria'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // ============================================
    // Step 3: Normalize results
    // ============================================
    const isRoundTrip = directions.length === 2;
    const normalizedFlights: AviasalesFlightOption[] = [];

    for (const ticket of allTickets) {
      if (!ticket.segments || !ticket.proposals) continue;

      // Get the best (cheapest) proposal for this ticket
      const sortedProposals = [...ticket.proposals].sort((a: any, b: any) => {
        const priceA = a.price?.value ?? Infinity;
        const priceB = b.price?.value ?? Infinity;
        return priceA - priceB;
      });

      for (const proposal of sortedProposals) {
        try {
          const proposalId = proposal.id;
          const agentId = proposal.agent_id;
          const agent = allAgents[String(agentId)];
          const agentName = agent?.label || agent?.gate_name || `Agency ${agentId}`;

          const price = proposal.price?.value ?? 0;
          const priceCurrency = proposal.price?.currency_code || currency;
          const pricePerPerson = proposal.price_per_person?.value ?? price;

          // Process outbound segment (first segment)
          const outboundSegment = ticket.segments[0];
          if (!outboundSegment || !outboundSegment.flights || outboundSegment.flights.length === 0) continue;

          const outboundLegs = outboundSegment.flights.map((idx: number) => allFlightLegs[idx]).filter(Boolean);
          if (outboundLegs.length === 0) continue;

          const firstLeg = outboundLegs[0];
          const lastLeg = outboundLegs[outboundLegs.length - 1];

          const fromIata = firstLeg.origin;
          const toIata = lastLeg.destination;
          const departureLocal = firstLeg.local_departure_date_time;
          const arrivalLocal = lastLeg.local_arrival_date_time;

          // Duration
          const depUnix = firstLeg.departure_unix_timestamp;
          const arrUnix = lastLeg.arrival_unix_timestamp;
          const durationMinutes = Math.round((arrUnix - depUnix) / 60);

          // Stops
          const stops = outboundLegs.length - 1;
          const stopAirports: string[] = [];
          for (let i = 0; i < outboundLegs.length - 1; i++) {
            stopAirports.push(outboundLegs[i].destination);
          }

          // Segments detail
          const segments: AviasalesSegment[] = outboundLegs.map((leg: any) => {
            const legDuration = Math.round((leg.arrival_unix_timestamp - leg.departure_unix_timestamp) / 60);
            const designator = leg.operating_carrier_designator || {};
            return {
              from: leg.origin,
              to: leg.destination,
              departureLocal: leg.local_departure_date_time,
              arrivalLocal: leg.local_arrival_date_time,
              durationMinutes: legDuration,
              airlineCode: designator.carrier || '',
              flightNumber: designator.number || '',
              aircraft: leg.equipment?.name || leg.equipment?.code || ''
            };
          });

          // Airlines
          const airlineCodes = [...new Set(segments.map((s: AviasalesSegment) => s.airlineCode).filter(Boolean))];
          const airlineNames = airlineCodes.map(code => allAirlines[code]?.name || code);
          const airlineLogos = airlineCodes.map(code => `http://img.wway.io/pics/root/${code}@png?exar=1&rs=fit:200:200`);

          // Baggage from minimum_fare or first flight_term
          const minFare = proposal.minimum_fare;
          const baggageInfo = minFare?.baggage;
          const handbagsInfo = minFare?.handbags;
          const baggageIncluded = baggageInfo ? (baggageInfo.count > 0) : false;
          const baggageWeight = baggageInfo?.weight || baggageInfo?.total_weight || null;
          const handbagsIncluded = handbagsInfo ? (handbagsInfo.count > 0) : true;
          const handbagsWeight = handbagsInfo?.weight || handbagsInfo?.total_weight || null;

          // Trip class & seats
          const firstFlightTerm = proposal.flight_terms ? Object.values(proposal.flight_terms)[0] as any : null;
          const flightTripClass = firstFlightTerm?.trip_class || tripClass;
          const seatsAvailable = firstFlightTerm?.seats_available || null;

          // Is lowcost
          const isLowcost = airlineCodes.some(code => allAirlines[code]?.is_lowcost === true);

          // Return segment (if round trip)
          let returnDepartureLocal: string | undefined;
          let returnArrivalLocal: string | undefined;
          let returnDurationMinutes: number | undefined;
          let returnStops: number | undefined;
          let returnStopAirports: string[] | undefined;
          let returnSegments: AviasalesSegment[] | undefined;

          if (isRoundTrip && ticket.segments.length >= 2) {
            const returnSeg = ticket.segments[1];
            if (returnSeg && returnSeg.flights && returnSeg.flights.length > 0) {
              const returnLegs = returnSeg.flights.map((idx: number) => allFlightLegs[idx]).filter(Boolean);
              if (returnLegs.length > 0) {
                const retFirst = returnLegs[0];
                const retLast = returnLegs[returnLegs.length - 1];
                returnDepartureLocal = retFirst.local_departure_date_time;
                returnArrivalLocal = retLast.local_arrival_date_time;
                returnDurationMinutes = Math.round((retLast.arrival_unix_timestamp - retFirst.departure_unix_timestamp) / 60);
                returnStops = returnLegs.length - 1;
                returnStopAirports = [];
                for (let i = 0; i < returnLegs.length - 1; i++) {
                  returnStopAirports.push(returnLegs[i].destination);
                }
                returnSegments = returnLegs.map((leg: any) => {
                  const legDuration = Math.round((leg.arrival_unix_timestamp - leg.departure_unix_timestamp) / 60);
                  const designator = leg.operating_carrier_designator || {};
                  return {
                    from: leg.origin,
                    to: leg.destination,
                    departureLocal: leg.local_departure_date_time,
                    arrivalLocal: leg.local_arrival_date_time,
                    durationMinutes: legDuration,
                    airlineCode: designator.carrier || '',
                    flightNumber: designator.number || '',
                    aircraft: leg.equipment?.name || leg.equipment?.code || ''
                  };
                });
              }
            }
          }

          const flightOption: AviasalesFlightOption = {
            id: `${searchId}_${proposalId}`,
            proposalId,
            searchId,
            resultsUrl,
            ticketSignature: ticket.signature || '',
            from: fromIata,
            to: toIata,
            departureLocal,
            arrivalLocal,
            durationMinutes,
            stops,
            stopAirports,
            segments,
            airlineCodes,
            airlineNames,
            airlineLogos,
            price,
            pricePerPerson,
            currency: priceCurrency,
            agentId,
            agentName,
            baggageIncluded,
            baggageWeight,
            handbagsIncluded,
            handbagsWeight,
            tripClass: flightTripClass,
            seatsAvailable,
            isLowcost,
            isReturn: isRoundTrip,
            returnDepartureLocal,
            returnArrivalLocal,
            returnDurationMinutes,
            returnStops,
            returnStopAirports,
            returnSegments
          };

          normalizedFlights.push(flightOption);
        } catch (normErr) {
          console.error('[aviasales-search] Normalization error for proposal:', normErr);
          continue;
        }
      }
    }

    // Sort by price
    normalizedFlights.sort((a, b) => a.price - b.price);

    console.log(`[aviasales-search] Returning ${normalizedFlights.length} flight options`);

    return new Response(JSON.stringify({
      success: true,
      searchId,
      resultsUrl,
      flights: normalizedFlights,
      totalResults: normalizedFlights.length,
      isComplete: isOver,
      airlines: allAirlines,
      agents: allAgents
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err: any) {
    console.error('[aviasales-search] Unhandled error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
