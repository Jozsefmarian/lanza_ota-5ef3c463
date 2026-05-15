import { supabase, callEdgeFunction } from "./supabase";

// ============================================
// RateHawk Search Page API (paged + enrichment)
// ============================================

export interface SearchPageParams {
  // Ratehawk edge function ezt várja (region-alapú keresés)
  regionId?: number;

  // UI-hoz maradhat, de a backendnek nem kötelező
  destination?: string;

  checkin: string;
  checkout: string;
  guests: { adults: number; children?: number[] }[];
  currency?: string;
  language?: string;
  residency?: string;
  page?: number;
  pageSize?: number;
  debug?: boolean;
}

export interface SearchPageResult {
  success: boolean;
  page?: number;
  pageSize?: number;
  totalHotels?: number;
  totalPages?: number;
  hotels?: any[];
  error?: string;
  debug_version?: string;
  enrichment_partial?: boolean;
  fetched_static_count?: number;
  cache_hit_count?: number;
  missing_static_count?: number;
  [key: string]: any;
}

export async function searchHotelsPage(params: SearchPageParams): Promise<SearchPageResult> {
  try {
    const { data, error } = await callEdgeFunction("ratehawk-search", params);

    if (error) throw error;

    return data || { success: false, error: "No data returned" };
  } catch (error: any) {
    console.error("Search page error:", error);
    return { success: false, error: error.message || "Error occurred during search page" };
  }
}

// ============================================
// RateHawk Hotel Details API
// ============================================

export interface HotelDetailsParams {
  // ETG doksi: id (string, deprecated) vagy hid (number) — egyik kötelező
  id?: string; // legacy string id (deprecated, de még használható)
  hid?: number; // numeric hotel id

  checkin: string;
  checkout: string;
  guests: { adults: number; children?: number[] }[];

  currency?: string;
  language?: string;
  residency?: string;

  // opcionális: edge oldalon hasznos lehet timeout/debug
  timeout?: number;
  debug?: boolean;
}

// Edge function contract (source of truth):
// ratehawk-hotel -> { success, info, hp, error? }
export interface HotelDetailsResult {
  success: boolean;
  info?: any;
  hp?: any;
  hotel?: any;
  error?: string;
  [key: string]: any;
}

export async function getHotelDetails(params: any) {
  try {
    const { data, error } = await callEdgeFunction("ratehawk-hotel", params);
    if (error) throw error;

    // ✅ A ratehawk-hotel edge válasza: { success, info, hp }
    // Ne csomagoljuk át, adjuk tovább "source of truth"-ként.
    return data;
  } catch (err: any) {
    console.error("Hotel details error:", err);
    return { success: false, error: err?.message || "Hotel details request failed" };
  }
}

// ============================================
// RateHawk Prebook API
// ============================================

export interface PrebookParams {
  bookHash?: string;
  searchHash?: string;
}

export interface PrebookResult {
  success: boolean;
  prebook?: {
    available: boolean;
    prebookHash: string;
    hotelId: number;
    hotelName: string;
    roomName: string;
    checkin: string;
    checkout: string;
    guests: any;
    price: {
      amount: string;
      currency: string;
      originalAmount: string;
      originalCurrency: string;
    };
    cancellationPolicy: {
      freeCancellationBefore: string | null;
      policies: any[];
    };
    meal: any;
    amenities: string[];
    taxes: any;
    vat: any;
    depositRequired: any;
    noShow: any;
    requiredFields: string[];
    paymentTypes: string[];
    priceMismatch?: { search: { amount: string; currency: string }; prebook: { amount: string; currency: string } };
    [key: string]: any;
  };
  available?: boolean;
  error?: string;
}

export async function prebookRate(params: PrebookParams): Promise<PrebookResult> {
  try {
    const { data, error } = await callEdgeFunction<PrebookResult>("ratehawk-prebook", params);

    if (error) {
      throw error;
    }

    return data || { success: false, error: "No data returned" };
  } catch (error: any) {
    console.error("Prebook error:", error);
    return {
      success: false,
      error: error.message || "Error occurred during prebooking",
    };
  }
}

// ============================================
// RateHawk Booking API
// ============================================

export interface BookingParams {
  prebookHash: string;
  partnerOrderId?: string;
  guests: {
    firstName: string;
    lastName: string;
    isAdult: boolean;
  }[];
  contactInfo: {
    email: string;
    phone: string;
  };
  specialRequests?: string;
  language?: string;
}

export interface BookingResult {
  success: boolean;
  booking?: {
    orderId: string;
    partnerOrderId: string;
    status: string;
    hotelName: string;
    roomName: string;
    checkin: string;
    checkout: string;
    guests: any[];
    contactInfo: {
      email: string;
      phone: string;
    };
    price: {
      amount: string;
      currency: string;
    };
    confirmationNumber: string;
    createdAt: string;
  };
  error?: string;
}

export async function createBooking(params: BookingParams): Promise<BookingResult> {
  try {
    const { data, error } = await callEdgeFunction<BookingResult>("ratehawk-book", params);

    if (error) {
      throw error;
    }

    return data || { success: false, error: "No data returned" };
  } catch (error: any) {
    console.error("Booking error:", error);
    return {
      success: false,
      error: error.message || "Error occurred during booking",
    };
  }
}

// ============================================
// RateHawk Check Booking API
// ============================================

export interface CheckBookingParams {
  orderId?: string;
  partnerOrderId?: string;
}

export interface CheckBookingResult {
  success: boolean;
  booking?: {
    orderId: string;
    partnerOrderId: string;
    status: string;
    statusText: string;
    hotelId: number;
    hotelName: string;
    hotelAddress: string;
    roomName: string;
    checkin: string;
    checkout: string;
    guests: {
      firstName: string;
      lastName: string;
      isAdult: boolean;
    }[];
    contactInfo: {
      email: string;
      phone: string;
    };
    price: {
      amount: string;
      currency: string;
      isPaid: boolean;
    };
    confirmationNumber: string;
    cancellation: {
      isCancellable: boolean;
      freeCancellationBefore: string | null;
      penaltyAmount: string | null;
    };
    createdAt: string;
    modifiedAt: string;
  };
  error?: string;
}

export async function checkBooking(params: CheckBookingParams): Promise<CheckBookingResult> {
  try {
    const { data, error } = await callEdgeFunction<CheckBookingResult>("ratehawk-check-booking", params);

    if (error) {
      throw error;
    }

    return data || { success: false, error: "No data returned" };
  } catch (error: any) {
    console.error("Check booking error:", error);
    return {
      success: false,
      error: error.message || "Error occurred while checking booking",
    };
  }
}

// ============================================
// Local Storage APIs (Wishlist, Bookings, Search History)
// ============================================

export async function addToWishlist(userId: string, itemType: string, itemId: number, itemData: any) {
  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      user_id: userId,
      item_type: itemType,
      item_id: itemId,
      item_data: itemData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWishlist(userId: string, itemType: string, itemId: number) {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", itemType)
    .eq("item_id", itemId);

  if (error) throw error;
}

export async function getWishlist(userId: string) {
  const { data, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUserBookings(userId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function saveBookingToDatabase(userId: string, booking: any) {
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      booking_type: booking.type,
      booking_reference: booking.orderId || booking.reference,
      item_name: booking.hotelName || booking.itemName,
      item_details: booking,
      check_in: booking.checkin,
      check_out: booking.checkout,
      total_price: booking.price?.amount,
      currency: booking.price?.currency,
      status: booking.status,
      guest_details: booking.guests,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveSearchHistory(userId: string, searchType: string, searchParams: any) {
  const { error } = await supabase.from("search_history").insert({
    user_id: userId,
    search_type: searchType,
    search_params: searchParams,
  });

  if (error) console.error("Search history save error:", error);
}

// ============================================
// RateHawk Autocomplete API
// ============================================

export interface AutocompleteResult {
  label: string;
  region_id: number;
}

export async function autocompleteSearch(query: string): Promise<AutocompleteResult[]> {
  try {
    const { data, error } = await callEdgeFunction<{ regions: AutocompleteResult[] }>("ratehawk-autocomplete", {
      query,
    });

    if (error) {
      throw error;
    }

    // Az edge function válasza tartalmazhat egy "regions" tömböt vagy közvetlenül a tömböt
    if (Array.isArray(data)) {
      return data;
    }

    if (data?.regions && Array.isArray(data.regions)) {
      return data.regions;
    }

    return [];
  } catch (error: any) {
    console.error("Autocomplete error:", error);
    return [];
  }
}

// Backward-compatible exports (SearchResultsModal miatt)
export { searchHotelsPage as searchHotels };
export type { SearchPageParams as HotelSearchParams, SearchPageResult as HotelSearchResult };

// ============================================
// Aviasales Flights Search API
// ============================================

export interface AviasalesSearchParams {
  origin: string; // IATA, e.g. "BUD"
  destination: string; // IATA, e.g. "ACE"
  departureDate: string; // "YYYY-MM-DD"
  returnDate?: string; // optional, "YYYY-MM-DD"
  adults: number; // 1–9
  children?: number; // 0–6
  infants?: number; // 0–6, max infants <= adults
  currency?: string; // e.g. "EUR", "HUF" – default: "EUR"
  locale?: string; // e.g. "hu" or "en-us" – default: "hu"
  marketCode?: string; // e.g. "HU" – default: "HU"
  tripClass?: "Y" | "C" | "F" | "W"; // economy / business / first / comfort – default: 'Y'
}

export interface AviasalesSegment {
  from: string;
  to: string;
  departureLocal: string;
  arrivalLocal: string;
  durationMinutes: number;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
}

export interface AviasalesFlightOption {
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
  affiliateUrl?: string;
  returnDepartureLocal?: string;
  returnArrivalLocal?: string;
  returnDurationMinutes?: number;
  returnStops?: number;
  returnStopAirports?: string[];
  returnSegments?: AviasalesSegment[];
}

export interface AviasalesSearchResult {
  success: boolean;
  searchId?: string;
  resultsUrl?: string;
  flights?: AviasalesFlightOption[];
  totalResults?: number;
  isComplete?: boolean;
  airlines?: Record<string, any>;
  agents?: Record<string, any>;
  error?: string;
  message?: string;
}

export async function searchFlights(params: AviasalesSearchParams): Promise<AviasalesSearchResult> {
  try {
    const origin = String(params.origin || "").toUpperCase();
    const destination = String(params.destination || "").toUpperCase();
    const currency = (params.currency || "EUR").toLowerCase();
    const adults = params.adults || 1;
    const departureDate = params.departureDate || "";
    const returnDate = params.returnDate || null;
    const monthParam = departureDate.slice(0, 7); // YYYY-MM

    // Affiliate token (public, read-only Data API)
    const TOKEN = "dd61f5f97c97ebdff62de75f37e4900a";
    const MARKER = "545241";

    // Build affiliate redirect URL (Aviasales booking link)
    const buildAffiliateUrl = (depDate: string, retDate: string | null) => {
      const dep = depDate.replace(/-/g, "");
      const dd = dep.slice(6, 8);
      const mm = dep.slice(4, 6);
      let url = `https://www.aviasales.com/search/${origin}${dd}${mm}${destination}`;
      if (retDate) {
        const ret = retDate.replace(/-/g, "");
        url += ret.slice(6, 8) + ret.slice(4, 6);
      }
      url += `${adults}?marker=${MARKER}&shmarker=${MARKER}`;
      return url;
    };

    const mainAffiliateUrl = buildAffiliateUrl(departureDate, returnDate);

    // Call 1: Latest prices for this route
    const latestUrl = new URL("https://api.travelpayouts.com/v2/prices/latest");
    latestUrl.searchParams.set("origin", origin);
    latestUrl.searchParams.set("destination", destination);
    latestUrl.searchParams.set("currency", currency);
    latestUrl.searchParams.set("period_type", "year");
    latestUrl.searchParams.set("one_way", returnDate ? "false" : "true");
    latestUrl.searchParams.set("show_to_affiliates", "true");
    latestUrl.searchParams.set("sorting", "price");
    latestUrl.searchParams.set("limit", "30");
    latestUrl.searchParams.set("token", TOKEN);

    // Call 2: Month calendar
    const monthUrl = new URL("https://api.travelpayouts.com/v2/prices/month-matrix");
    monthUrl.searchParams.set("origin", origin);
    monthUrl.searchParams.set("destination", destination);
    monthUrl.searchParams.set("currency", currency);
    monthUrl.searchParams.set("month", monthParam + "-01");
    monthUrl.searchParams.set("show_to_affiliates", "true");
    monthUrl.searchParams.set("token", TOKEN);

    const [latestRes, monthRes] = await Promise.allSettled([fetch(latestUrl.toString()), fetch(monthUrl.toString())]);

    let rawTickets: any[] = [];
    if (latestRes.status === "fulfilled" && latestRes.value.ok) {
      const json = await latestRes.value.json();
      rawTickets = json?.data ?? [];
    }

    let monthCalendar: any[] = [];
    if (monthRes.status === "fulfilled" && monthRes.value.ok) {
      const json = await monthRes.value.json();
      monthCalendar = (json?.data ?? [])
        .map((d: any) => ({
          date: d.depart_date ?? null,
          price: d.value ?? 0,
          stops: d.number_of_changes ?? 0,
        }))
        .filter((d: any) => d.date && d.price > 0);
    }

    // Filter to requested month, fallback to all
    const filtered = rawTickets
      .filter((t: any) => !t.departure_at || t.departure_at.startsWith(monthParam))
      .sort((a: any, b: any) => (a.value ?? 0) - (b.value ?? 0));

    const tickets =
      filtered.length > 0 ? filtered : rawTickets.sort((a: any, b: any) => (a.value ?? 0) - (b.value ?? 0));

    const searchId = `data_${origin}_${destination}_${monthParam}`;

    const flights: AviasalesFlightOption[] = tickets.slice(0, 30).map((t: any, idx: number) => {
      const price = t.value ?? 0;
      const airline = t.airline ?? "";
      const departAt = t.departure_at ?? departureDate + "T00:00:00Z";
      const returnAt = t.return_at ?? null;
      const ticketUrl = buildAffiliateUrl(
        departAt.slice(0, 10) || departureDate,
        returnAt ? returnAt.slice(0, 10) : returnDate,
      );

      return {
        id: `data_${origin}_${destination}_${idx}_${price}`,
        proposalId: `${origin}${destination}${idx}`,
        searchId,
        resultsUrl: ticketUrl,
        ticketSignature: "",
        from: origin,
        to: destination,
        departureLocal: departAt,
        arrivalLocal: departAt,
        durationMinutes: t.duration ?? 0,
        stops: t.number_of_changes ?? 0,
        stopAirports: [],
        segments: [
          {
            from: origin,
            to: destination,
            departureLocal: departAt,
            arrivalLocal: departAt,
            durationMinutes: t.duration ?? 0,
            airlineCode: airline,
            flightNumber: String(t.flight_number ?? ""),
            aircraft: "",
          },
        ],
        airlineCodes: airline ? [airline] : [],
        airlineNames: airline ? [airline] : [],
        airlineLogos: airline ? [`https://www.gstatic.com/flights/airline_logos/70px/${airline}.png`] : [],
        price,
        pricePerPerson: price,
        currency: currency.toUpperCase(),
        agentId: 0,
        agentName: "Aviasales",
        baggageIncluded: false,
        baggageWeight: null,
        handbagsIncluded: true,
        handbagsWeight: null,
        tripClass: params.tripClass || "Y",
        seatsAvailable: null,
        isLowcost: false,
        isReturn: Boolean(returnDate),
      } as AviasalesFlightOption;
    });

    if (flights.length === 0 && monthCalendar.length === 0) {
      return {
        success: true,
        flights: [],
        totalResults: 0,
        isComplete: true,
        searchId,
        resultsUrl: mainAffiliateUrl,
        message: "Erre az útvonalra most nincs elérhető cached adat. Keress közvetlenül az Aviasales oldalán.",
      };
    }

    return {
      success: true,
      searchId,
      resultsUrl: mainAffiliateUrl,
      flights,
      totalResults: flights.length,
      isComplete: true,
    };
  } catch (error: any) {
    console.error("Flight search error:", error);
    return { success: false, error: error.message || "Hiba történt a járatkeresés során" };
  }
}

// ============================================
// Aviasales Click/Buy API
// ============================================

export interface AviasalesClickParams {
  proposalId: string;
  searchId: string;
  resultsUrl: string;
}

export interface AviasalesClickResult {
  success: boolean;
  url?: string | null;
  rawResponse?: any;
  error?: string;
  message?: string;
}

export async function getFlightBookingLink(params: AviasalesClickParams): Promise<AviasalesClickResult> {
  try {
    const { data, error } = await callEdgeFunction<AviasalesClickResult>("aviasales-click", params);

    if (error) throw error;

    return data || { success: false, error: "No data returned" };
  } catch (error: any) {
    console.error("Flight click error:", error);
    return { success: false, error: error.message || "Error occurred while generating booking link" };
  }
}

// ============================================
// Simplified Flight Type Aliases (for SearchWidget / SearchResultsModal)
// ============================================

export type FlightSearchParams = AviasalesSearchParams;
export type FlightOption = AviasalesFlightOption;
export type FlightSearchResult = AviasalesSearchResult;
export type FlightClickResult = AviasalesClickResult;
