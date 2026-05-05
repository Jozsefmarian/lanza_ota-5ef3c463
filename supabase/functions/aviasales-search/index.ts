const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

interface AviasalesSearchRequest {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  tripClass?: 'Y' | 'C' | 'F';
  currency?: string;
  locale?: string;
  market?: string;
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
  const adults = body.adults || 0;
  if (adults < 1 || adults > 9) return 'Adults must be between 1 and 9';
  const children = body.children || 0;
  if (children < 0 || children > 6) return 'Children must be between 0 and 6';
  const infants = body.infants || 0;
  if (infants < 0 || infants > 6) return 'Infants must be between 0 and 6';
  if (infants > adults) return 'Number of infants cannot exceed number of adults';
  if (body.tripClass && !['Y', 'C', 'F'].includes(body.tripClass)) {
    return 'Invalid trip class (Y, C, F)';
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: AviasalesSearchRequest = await req.json();

    const validationError = validateRequest(body);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const marker = Deno.env.get('TRAVELPAYOUTS_MARKER_ID');
    const token = Deno.env.get('TRAVELPAYOUTS_API_TOKEN');

    if (!marker) {
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error: missing TRAVELPAYOUTS_MARKER_ID' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Extract user IP
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || '1.1.1.1';

    // Application host
    const appHost = req.headers.get('origin')?.replace(/^https?:\/\//, '').split('/')[0]
      || req.headers.get('referer')?.replace(/^https?:\/\//, '').split('/')[0]
      || 'lanza.app';

    const origin = body.origin.toUpperCase();
    const destination = body.destination.toUpperCase();

    const directions: Array<{ origin: string; destination: string; date: string }> = [
      { origin, destination, date: body.departureDate }
    ];
    if (body.returnDate) {
      directions.push({ origin: destination, destination: origin, date: body.returnDate });
    }

    // Normalize locale to xx_XX format
    let locale = body.locale || 'en_US';
    if (!/^[a-z]{2}_[A-Z]{2}$/.test(locale)) {
      const lc = locale.toLowerCase().slice(0, 2);
      const localeMap: Record<string, string> = {
        hu: 'hu_HU', en: 'en_US', de: 'de_DE', fr: 'fr_FR',
        es: 'es_ES', it: 'it_IT', ru: 'ru_RU', pl: 'pl_PL',
        pt: 'pt_PT', nl: 'nl_NL'
      };
      locale = localeMap[lc] || 'en_US';
    }

    const currency_code = body.currency || 'EUR';
    const market_code = (body.market || 'HU').toUpperCase();
    const trip_class = body.tripClass || 'Y';

    const searchBody = {
      currency_code,
      marker,
      locale,
      market_code,
      search_params: {
        directions,
        passengers: {
          adults: body.adults,
          children: body.children || 0,
          infants: body.infants || 0
        },
        trip_class
      }
    };

    console.log('[aviasales-search] Starting search:', JSON.stringify({
      origin, destination, departureDate: body.departureDate,
      returnDate: body.returnDate, adults: body.adults, trip_class, currency_code, locale, market_code
    }));

    const startUrl = 'https://tickets-api.travelpayouts.com/search/affiliate/start';

    const startResponse = await fetch(startUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-application-host': appHost,
        'x-user-ip': userIp,
        'x-signature': ''
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
    const search_id = startData.search_id;
    const results_url = startData.results_url;

    if (!search_id || !results_url) {
      console.error('[aviasales-search] Missing search_id or results_url:', startData);
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid response from search API: missing search_id or results_url'
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    console.log('[aviasales-search] Search started:', { search_id, results_url });

    // Poll results_url up to 5 times with 2s intervals
    let flights: any[] = [];
    let status: 'complete' | 'pending' = 'pending';

    for (let attempt = 1; attempt <= 5; attempt++) {
      await sleep(2000);

      try {
        const pollHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
          'x-application-host': appHost,
          'x-user-ip': userIp
        };
        if (token) {
          pollHeaders['Authorization'] = `Bearer ${token}`;
        }

        const pollResponse = await fetch(results_url, {
          method: 'GET',
          headers: pollHeaders
        });

        if (!pollResponse.ok) {
          console.warn(`[aviasales-search] Poll attempt ${attempt} failed:`, pollResponse.status);
          continue;
        }

        const pollData = await pollResponse.json();

        // results_url may return either an array or an object containing results
        let resultsArray: any[] = [];
        if (Array.isArray(pollData)) {
          resultsArray = pollData;
        } else if (Array.isArray(pollData?.proposals)) {
          resultsArray = pollData.proposals;
        } else if (Array.isArray(pollData?.tickets)) {
          resultsArray = pollData.tickets;
        } else if (Array.isArray(pollData?.results)) {
          resultsArray = pollData.results;
        }

        console.log(`[aviasales-search] Poll attempt ${attempt}: ${resultsArray.length} results`);

        if (resultsArray.length > 0) {
          flights = resultsArray;
          status = 'complete';
          break;
        }
      } catch (pollErr) {
        console.error(`[aviasales-search] Poll attempt ${attempt} error:`, pollErr);
        continue;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      search_id,
      results_url,
      flights,
      status
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
