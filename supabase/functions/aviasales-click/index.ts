
import { createHash } from "node:crypto";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// ============================================
// Types
// ============================================

interface AviasalesClickRequest {
  proposalId: string;
  searchId: string;
  resultsUrl: string;
}

// ============================================
// Main handler
// ============================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: AviasalesClickRequest = await req.json();

    // Validate
    if (!body.proposalId || typeof body.proposalId !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Missing or invalid proposalId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (!body.searchId || typeof body.searchId !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Missing or invalid searchId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (!body.resultsUrl || typeof body.resultsUrl !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Missing or invalid resultsUrl' }), {
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

    // Extract user IP
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || req.headers.get('cf-connecting-ip')
      || '';

    // Extract host
    const realHost = req.headers.get('origin')?.replace(/^https?:\/\//, '')
      || req.headers.get('referer')?.replace(/^https?:\/\//, '').split('/')[0]
      || 'lanzaventura.com';

    // Build clicks URL
    // Pattern: {results_url}/search/affiliate/clicks/{proposal_id}
    const clicksUrl = `${body.resultsUrl}/search/affiliate/clicks/${encodeURIComponent(body.proposalId)}`;

    const clickBody = {
      search_id: body.searchId
    };

    // Generate signature for click request
    const signatureValues = [token, body.searchId].join(':');
    const signature = createHash('md5').update(signatureValues).digest('hex');

    console.log('[aviasales-click] Generating click link:', {
      proposalId: body.proposalId,
      searchId: body.searchId,
      clicksUrl
    });

    const clickResponse = await fetch(clicksUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-affiliate-user-id': token,
        'x-signature': signature,
        'x-user-ip': userIp,
        'x-real-host': realHost
      },
      body: JSON.stringify(clickBody)
    });

    if (!clickResponse.ok) {
      const errorText = await clickResponse.text();
      console.error('[aviasales-click] Click request failed:', clickResponse.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Click request failed (${clickResponse.status}): ${errorText}`
      }), {
        status: clickResponse.status === 429 ? 429 : 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const clickData = await clickResponse.json();

    console.log('[aviasales-click] Click response:', JSON.stringify(clickData));

    // The response should contain a URL to redirect the user to
    const bookingUrl = clickData.url || clickData.link || clickData.redirect_url || null;

    if (!bookingUrl) {
      // Return the full response for debugging
      return new Response(JSON.stringify({
        success: true,
        url: null,
        rawResponse: clickData,
        message: 'Click registered but no redirect URL returned'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      url: bookingUrl
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (err: any) {
    console.error('[aviasales-click] Unhandled error:', err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message || 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
