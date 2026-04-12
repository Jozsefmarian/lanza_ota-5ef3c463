import { useState, useEffect, useRef } from 'react';
import { searchHotelsPage } from "@/lib/api";
import HotelCard from '@/components/HotelCard';

import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Loader2, AlertCircle, Star, Check, Utensils, Calendar, ChevronRight, ChevronLeft, Heart, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface HotelRate {
  roomName?: string;
  meal?: string;
  hasBreakfast?: boolean;
  price?: string;

  currency?: string;
  freeCancellation?: string | null;
  amenities?: string[];
  allotment?: number;
}

interface Hotel {
  id: string;
  hid: number;
  name?: string;
  address?: string | null;
  city?: string | null;
  images?: string[];
  starRating?: number;
  rates?: HotelRate[];
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const readCurrency = () => {
  // BrowserRouter query
  const p1 = new URLSearchParams(location.search);
  const c1 = p1.get("currency");

  // HashRouter query a hash-ben: "#/path?currency=HUF"
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  const hashQuery = qIndex >= 0 ? hash.slice(qIndex + 1) : "";
  const p2 = new URLSearchParams(hashQuery);
  const c2 = p2.get("currency");

  const c = (c1 || c2);
  const fromUrl =
  (c === "EUR" || c === "USD" || c === "HUF" || c === "GBP") ? c : null;
if (fromUrl) return fromUrl;

const fromLs = localStorage.getItem("lanza_currency");
return (fromLs === "EUR" || fromLs === "USD" || fromLs === "HUF" || fromLs === "GBP")
  ? fromLs
  : "EUR";
  };

const [currency, setCurrency] = useState<"EUR" | "USD" | "HUF" | "GBP">(readCurrency());
useEffect(() => {
  const onCur = (e: any) => {
  const next = e?.detail?.currency;
  if (next === "EUR" || next === "USD" || next === "HUF" || next === "GBP") {
    localStorage.setItem("lanza_currency", next);
    setCurrency(next);
  } else {
    setCurrency(readCurrency());
  }
};

  window.addEventListener("lanza:currencyChanged", onCur);
  window.addEventListener("popstate", onCur);
  window.addEventListener("hashchange", onCur);
  return () => {
    window.removeEventListener("lanza:currencyChanged", onCur);
    window.removeEventListener("popstate", onCur);
    window.removeEventListener("hashchange", onCur);
  };
}, []);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [totalHotels, setTotalHotels] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Track if we've already done the auto-refetch for this page
  const [hasAutoRefetched, setHasAutoRefetched] = useState(false);
  
  const lastSearchKeyRef = useRef<string>('');
  const debugVersionLoggedRef = useRef<boolean>(false);

  const destination = searchParams.get('destination') || '';
  const REGION_MAP: Record<string, number> = {
  budapest: 715,
  vienna: 1023,
  prague: 1151,
  berlin: 1001,
  paris: 2734,
  rome: 1043,
  barcelona: 1045,
  london: 1005,
};

const regionId = destination
  ? REGION_MAP[destination.toLowerCase()]
  : null;

  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  const adults = parseInt(searchParams.get('adults') || '2', 10);

  const pageSize = 20;

  const fetchHotels = async (pageNum: number, isSilentRefetch: boolean = false) => {
    if (!destination || !checkin || !checkout) {
  setError('Hiányzó keresési paraméterek. Kérjük, adja meg az úticélt, az érkezés és távozás dátumát.');
  setLoading(false);
  return;
}

    try {
      if (!regionId) {
  throw new Error(`Ismeretlen destination: "${destination}". Nincs REGION_MAP bejegyzés, ezért nincs regionId.`);
}
      // Only show full-page loader for initial fetch, not silent refetches
      if (!isSilentRefetch) {
        setLoading(true);
        setError(null);
      }

console.log("[SERP currency param]", currency);
      const data = await searchHotelsPage({
  regionId,
  checkin,
  checkout,
  guests: [{ adults, children: [] }],
  currency,
  language: 'hu',
});

if (!data?.success) throw new Error(data?.error || 'Hiba történt a keresés során');

      // Log debug_version once
      if (data?.debug_version && !debugVersionLoggedRef.current) {
        console.log('ratehawk-search-page debug_version:', data.debug_version);
        debugVersionLoggedRef.current = true;
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Hiba történt a keresés során');
      }

      // Log enrichment stats for debugging
      if (data) {
        console.log('Enrichment stats:', {
          enrichment_partial: data.enrichment_partial,
          fetched_static_count: data.fetched_static_count,
          cache_hit_count: data.cache_hit_count,
          missing_static_count: data.missing_static_count,
          isSilentRefetch,
        });
      }

const h0Img: any = data?.hotels?.[0];
console.warn("### HOTEL[0] IMAGE RAW ###", {
  id: h0Img?.id,
  hid: h0Img?.hid,
  name: h0Img?.name,
  starRating: h0Img?.starRating,
  stars: h0Img?.stars,
  images: h0Img?.images,
  hotelImages: h0Img?.hotel?.images,
  image: h0Img?.image,
  photos: h0Img?.photos,
  cover_image: h0Img?.cover_image,
});
// TEMP DEBUG: statikus adat hiány mérés
const hotelsRaw = (data?.hotels ?? []) as any[];
const missingStatic = hotelsRaw.filter((h) => {
  const hasName = Boolean(h?.hotel?.name ?? h?.name);
  const hasImg = Boolean(h?.images?.length || h?.hotel?.images?.length);
  return !hasName && !hasImg;
});
console.log("[SERP hotels]", {
  total: hotelsRaw.length,
  missingStatic: missingStatic.length,
  sample: missingStatic.slice(0, 3),
});

      const cleanedHotels = (data?.hotels ?? []).filter((h: any) => {
  const name =
    h?.hotel?.name ??
    h?.name ??
    h?.hotel_name ??
    h?.hotelName;

  const image =
    h?.hotel?.images?.[0]?.url ??
    h?.hotel?.images?.[0] ??
    h?.images?.[0]?.url ??
    h?.images?.[0] ??
    h?.thumbnail ??
    h?.image ??
    h?.photos?.[0];

  // UX rule:
  // ha se név, se kép → ne jelenjen meg
  return Boolean(name || image);
});

      setHotels(cleanedHotels);
      setTotalHotels(data.totalHotels || 0);
      setTotalPages(data.totalPages || 0);
      setPage(pageNum);

      // TEMP: auto-refetch kikapcsolva, mert Famous alatt könnyen 504/Failed to fetch spirált okoz
// if (data.enrichment_partial === true && !isSilentRefetch && !hasAutoRefetched) {
//   console.log('Enrichment partial detected, triggering silent refetch to get cached hotel data.');
//   setHasAutoRefetched(true);
//   setTimeout(() => {
//     fetchHotels(pageNum, true);
//   }, 500);
// }

    } catch (err: any) {
      console.error('Search error:', err);
      // Only show error for initial fetch, not silent refetches
      if (!isSilentRefetch) {
        setError(err.message || 'Hiba történt');
      }
    } finally {
      // Only clear loading for initial fetch
      if (!isSilentRefetch) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
  // Search csak akkor fusson le, ha TÉNYLEG a keresési oldalon vagyunk
  if (!location.pathname.startsWith('/search')) return;

  const searchKey = `${regionId}|${checkin}|${checkout}|${adults}|${currency}`;
  if (lastSearchKeyRef.current === searchKey) return;

  lastSearchKeyRef.current = searchKey;
  debugVersionLoggedRef.current = false;
  setHasAutoRefetched(false);

  fetchHotels(1);
}, [regionId, checkin, checkout, adults, currency, location.pathname]);

  const handleViewHotel = (hotel: Hotel) => {
    navigate(`/hotel?hotelId=${encodeURIComponent(hotel.id)}&hotelHid=${hotel.hid}&checkin=${checkin}&checkout=${checkout}&adults=${adults}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setHasAutoRefetched(false); // Reset auto-refetch flag for new page
      fetchHotels(newPage);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const calculateNights = () => {
    if (!checkin || !checkout) return 1;
    const start = new Date(checkin);
    const end = new Date(checkout);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const nights = calculateNights();
  const searchMeta = {
  nights,
  adultsTotal: adults,
  childrenTotal: 0,
  roomsCount: 1,
};

  // Get hotel location from city or address
  const getHotelLocation = (hotel: Hotel): string => {
    if (hotel.city) return hotel.city;
    if (hotel.address) return hotel.address;
    return destination;
  };

  // Get hotel image or null
  const getHotelImage = (hotel: Hotel): string | null => {
    if (hotel.images && hotel.images.length > 0 && hotel.images[0]) {
      return hotel.images[0];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={null} onAuthClick={() => {}} onDashboardClick={() => {}} cartCount={0} wishlistCount={0} />
        {/* DEBUG PANEL (csak ha ?debug=1 van a URL-ben) */}
{new URLSearchParams(window.location.search).get("debug") === "1" && hotels?.[0] ? (
  <div className="container mx-auto px-4 mt-4">
    <div className="p-3 rounded-lg border border-yellow-300 bg-yellow-50 text-xs overflow-auto">
      <div className="font-semibold mb-2">DEBUG: hotels[0] image/star fields</div>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(
          {
            id: (hotels[0] as any)?.id,
            hid: (hotels[0] as any)?.hid,
            name: (hotels[0] as any)?.name,
            starRating: (hotels[0] as any)?.starRating,
            stars: (hotels[0] as any)?.stars,
            hotelStars: (hotels[0] as any)?.hotel?.stars,
            cover_image: (hotels[0] as any)?.cover_image,
            image: (hotels[0] as any)?.image,
            imagesTop0: Array.isArray((hotels[0] as any)?.images) ? (hotels[0] as any).images[0] : (hotels[0] as any)?.images,
            imagesHotel0: Array.isArray((hotels[0] as any)?.hotel?.images) ? (hotels[0] as any).hotel.images[0] : (hotels[0] as any)?.hotel?.images,
            photosTop0: Array.isArray((hotels[0] as any)?.photos) ? (hotels[0] as any).photos[0] : (hotels[0] as any)?.photos,
            photosHotel0: Array.isArray((hotels[0] as any)?.hotel?.photos) ? (hotels[0] as any).hotel.photos[0] : (hotels[0] as any)?.hotel?.photos,
          },
          null,
          2
        )}
      </pre>
    </div>
  </div>
) : null}
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-16 h-16 animate-spin text-purple-600 mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Szállások keresése...</h2>
          <p className="text-gray-500">{destination || 'Keresés folyamatban'}</p>
          {page > 1 && (
            <p className="text-sm text-gray-400 mt-2">Oldal: {page}</p>
          )}
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={null} onAuthClick={() => {}} onDashboardClick={() => {}} cartCount={0} wishlistCount={0} />
        <div className="flex flex-col items-center justify-center py-32 px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hiba történt</h2>
          <p className="text-gray-500 text-center max-w-md mb-6">{error}</p>
          <Button onClick={() => navigate('/')}>Vissza a főoldalra</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={null} onAuthClick={() => {}} onDashboardClick={() => {}} cartCount={0} wishlistCount={0} />

      <div className="bg-white border-b shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{destination || 'Keresési eredmények'}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(checkin)} - {formatDate(checkout)}</span>
                <span className="text-gray-300">|</span>
                <span>{nights} éjszaka</span>
                <span className="text-gray-300">|</span>
                <span>{adults} vendég</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="py-1.5 px-3">{totalHotels} szállás</Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>Új keresés</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {hotels.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="py-12 text-center">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nem találtunk szállást</h3>
              <Button onClick={() => navigate('/')}>Új keresés</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
            {hotels.map((hotel, index) => (
  <HotelCard
  key={`${(hotel as any).id || index}-${index}`}
  hotel={hotel as any}
  isWishlisted={false}
  onWishlistToggle={() => {}}
  onBook={() => handleViewHotel(hotel as any)}
  searchMeta={searchMeta}
/>
))}
      </div>      

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(page - 1)} 
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Előző
                </Button>
                <span className="text-sm text-gray-600 font-medium">
                  Oldal {page} / {totalPages}
                </span>

                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(page + 1)} 
                  disabled={page >= totalPages}
                >
                  Következő <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
