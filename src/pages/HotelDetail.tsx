import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, Star, MapPin, Building2, Coffee, Check, ArrowLeft, 
  Wifi, Car, Dumbbell, Waves, X, Users, Calendar, ChevronDown, ChevronUp,
  Clock, Info, BedDouble, Utensils, Ban, CreditCard, Image as ImageIcon
} from 'lucide-react';
import { getHotelDetails, HotelDetailsParams, HotelDetailsResult } from '../lib/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HotelHero from '../components/HotelHero';

import HotelBadges from '../components/HotelBadges';
import HotelDescription from '../components/HotelDescription';
import AmenitiesGrid from '../components/AmenitiesGrid';
import RoomList from '../components/RoomList';
import HotelLocation from '../components/HotelLocation';
import HotelPolicies from '../components/HotelPolicies';
import BookingModal from '../components/BookingModal';







const HotelDetail: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [hotelDetails, setHotelDetails] = useState<HotelDetailsResult['hotel'] | null>(null);
  const [hotelHp, setHotelHp] = useState<any>(null);
  const [hpError, setHpError] = useState<string | null>(null); // ✅ új
  const [error, setError] = useState<string | null>(null);
  const [expandedRoom, setExpandedRoom] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'amenities' | 'rules'>('description');

  // ✅ G3: dátumsáv state (kell a JSX-hez)
  const [dateBarOpen, setDateBarOpen] = useState(true);
  const [editCheckin, setEditCheckin] = useState('');
  const [editCheckout, setEditCheckout] = useState('');
  const [editAdults, setEditAdults] = useState(2);

  // Extract params from URL - use hotelId as per API documentation
  const hotelId = searchParams.get('hotelId') || '';        // string
  const hotelHid = parseInt(searchParams.get('hotelHid') || '0', 10); // number
  const checkin = searchParams.get('checkin') || '';
  const checkout = searchParams.get('checkout') || '';
  // ✅ Éjszakák száma (ár/éj számításhoz)
const nights = React.useMemo(() => {
  if (!checkin || !checkout) return 0;

  // timezone-biztos (különben elcsúszhat 1 napot)
  const inD = new Date(`${checkin}T00:00:00Z`);
  const outD = new Date(`${checkout}T00:00:00Z`);

  const diffMs = outD.getTime() - inD.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}, [checkin, checkout]);
  const adults = parseInt(searchParams.get('adults') || '2', 10);

    // ✅ G3 - statikus (cache-ből jövő) adatok biztonságos előkészítése
  // Fontos: EZT a komponens törzsében kell definiálni, nem a fetch-ben, különben renderben "not defined".
  const popularAmenities: string[] = (() => {
    const a: any = (hotelDetails as any)?.amenities;
    if (!a || typeof a !== 'object') return [];

    const merged = [
      ...(Array.isArray(a.general) ? a.general : []),
      ...(Array.isArray(a.room) ? a.room : []),
      ...(Array.isArray(a.services) ? a.services : []),
    ];

    return merged.filter(Boolean).slice(0, 6);
  })();

    // Közeli nevezetességek – elsődleges forrás: edge által visszaadott info.nearby_places
  const nearbyAttractions: string[] = (() => {
    const h: any = hotelDetails as any;

    // 1) ÚJ mező: hotel edge bővítés (info.nearby_places)
    const fromInfo = h?.nearby_places ?? h?.info?.nearby_places;
    if (Array.isArray(fromInfo) && fromInfo.length > 0) {
      return fromInfo.filter(Boolean).slice(0, 6);
    }

    // 2) Fallbackok (ha később máshonnan jönne)
    const candidates = [
      h?.nearby,
      h?.landmarks,
      h?.points_of_interest,
      h?.pois,
      h?.attractions,
    ];

    const arr = candidates.find((x) => Array.isArray(x));
    if (!arr) return [];

    return (arr as any[])
      .map((it) => (typeof it === "string" ? it : it?.name || it?.title))
      .filter(Boolean)
      .slice(0, 6);
  })();

    // Ha URL param változik (pl. vissza/előre), szinkronizáljuk az edit mezőket
  useEffect(() => {
    setEditCheckin(checkin);
    setEditCheckout(checkout);
    setEditAdults(adults || 2);
  }, [checkin, checkout, adults]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<any | null>(null);

  useEffect(() => {
  console.log('HOTEL PARAMS NOW:', { hotelId, hotelHid, checkin, checkout, adults });

  if (hotelId && hotelHid && checkin && checkout) {
    fetchHotelDetails();
  } else {
    setError('Hiányzó paraméterek. Kérjük, válasszon szállást a találati listából.');
    setLoading(false);
  }
}, [hotelId, hotelHid, checkin, checkout, adults]);

  const fetchHotelDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('Fetching hotel details:', { hotelHid, checkin, checkout, adults });

const apiParams: any = {
  hotelId,            // string (pl. "hotel_president_budapest")
  hid: hotelHid,      // ✅ a backend ezt várja: "hid"
  checkin,
  checkout,
  guests: [{ adults }],
  currency: 'EUR',
  language: 'en',
  residency: 'HU',
};

      const response: any = await getHotelDetails(apiParams);

console.log(
  'HOTELDETAIL ->',
  'success=', response?.success,
  'error=', response?.error,
  'keys=', Object.keys(response || {})
);

// Edge function contract: { success, info, hp, error? }
if (response?.success) {
  const info = response?.info ?? null;

  // ✅ A valós hotel objektum tipikusan itt van:
  const hotelObj =
    info?.hotel ??
    info; // fallback: ha valamiért maga az info a hotel

    // ✅ Contract bővítés kezelése: info.nearby_places kerüljön be a hotelDetails-be is
  const hotelObjWithNearby = {
    ...(hotelObj || {}),
    nearby_places: info?.nearby_places ?? (hotelObj as any)?.nearby_places ?? [],
  };

  setHotelDetails(hotelObjWithNearby as any);
  setHotelHp(response?.hp ?? null);
  setHpError(response?.hp_error ?? null); // ✅ új
} else {
  setHotelDetails(null);
  setHotelHp(null);
  setHpError(null); // ✅ új
  setError(response?.error || 'Nem sikerült betölteni a szállás adatait');
}

    } catch (err: any) {
      console.error('Hotel details error:', err);
      setError(err.message || 'Hiba történt az adatok lekérésekor');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (rate: any) => {
    console.log('Foglalás:', {
      hotelHid: hotelHid,
      rate: rate,
      checkin,
      checkout,
      adults
    });
    alert('A foglalási funkció hamarosan elérhető lesz!');
  };

    const handleChangeDate = () => {
    setDateBarOpen((v) => !v);
  };

    const applyDateChange = () => {
    // Minimális védelem
    if (!editCheckin || !editCheckout) return;

    // URL param frissítés → a meglévő useEffect újra lefut és fetchHotelDetails() meghívódik
    const next = new URLSearchParams(searchParams);
    next.set('checkin', editCheckin);
    next.set('checkout', editCheckout);
    next.set('adults', String(editAdults));

    setSearchParams(next);
    setDateBarOpen(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', { 
      month: 'short', 
      day: 'numeric',
      weekday: 'short'
    });
  };

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase();
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi className="w-5 h-5" />;
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('car')) return <Car className="w-5 h-5" />;
    if (lowerAmenity.includes('gym') || lowerAmenity.includes('fitness')) return <Dumbbell className="w-5 h-5" />;
    if (lowerAmenity.includes('pool') || lowerAmenity.includes('swim')) return <Waves className="w-5 h-5" />;
    return <Check className="w-5 h-5" />;
  };

// Leírás kinyerése a valós API válaszból (Zenhotels-szerű: description_struct)
const hotelInfo: any = hotelDetails as any;

// A "Zenhotels" leírás valójában a description_struct részek egymás után
const descriptionFromApi: string | null = (() => {
  const ds = hotelInfo?.description_struct;
  if (!Array.isArray(ds) || ds.length === 0) return null;

  // A példában ezek vannak: Location / At the boutique hotel / Room amenities
  // Összefűzzük: Title + bekezdések, üres sorokkal tagolva
  const parts = ds
    .filter((s: any) => Array.isArray(s?.paragraphs) && s.paragraphs.length > 0)
    .map((s: any) => {
      const title = String(s?.title || "").trim();
      const body = (s.paragraphs as string[]).join("\n\n").trim();
      return title ? `${title}\n\n${body}` : body;
    })
    .filter(Boolean);

  return parts.length ? parts.join("\n\n") : null;
})();

  return (
    <div className="min-h-screen bg-gray-50">

      <Header />

      {/* Back Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a találatokhoz
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-16 h-16 text-purple-600 animate-spin mb-6" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Szállás betöltése...</h2>
          <p className="text-gray-500">Kérjük, várjon</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Hiba történt</h2>
          <p className="text-gray-500 mb-6 text-center max-w-md">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={fetchHotelDetails}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              Újrapróbálás
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
            >
              Vissza a főoldalra
            </button>
          </div>
        </div>
      )}

      {/* Hotel Details - Zenhotels Layout */}
      {!loading && !error && hotelDetails && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Hotel Hero Section - közvetlenül a hotel objektumot adjuk át */}
          <HotelHero hotel={hotelDetails} />

          {/* ✅ G3 – Gyorsinfó (statikus hotel adatokból, cache-first) */}
<div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
  <div className="p-4 sm:p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 1) Értékelések (Tripadvisor később, most placeholder) */}
<div>
  <div className="text-sm font-semibold text-gray-900 mb-2">Értékelések</div>

  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
    <div className="text-sm text-gray-700 font-medium">Tripadvisor értékelések</div>
    <div className="text-sm text-gray-500 mt-1">
      Hamarosan elérhető
    </div>

    {/* kis “skeleton” jelleg, hogy ne legyen üres */}
    <div className="mt-3 space-y-2">
      <div className="h-2 bg-gray-200 rounded w-2/3" />
      <div className="h-2 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
</div>

      {/* 2) Népszerű szolgáltatások */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-2">Népszerű szolgáltatások</div>
        {popularAmenities.length > 0 ? (
          <ul className="space-y-1">
            {popularAmenities.map((a, idx) => (
              <li key={idx} className="text-sm text-gray-700">• {a}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">Nincs elérhető adat</div>
        )}
      </div>

      {/* 3) Közeli nevezetességek */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-2">Közeli nevezetességek</div>
        {nearbyAttractions.length > 0 ? (
          <ul className="space-y-1">
            {nearbyAttractions.map((n, idx) => (
              <li key={idx} className="text-sm text-gray-700">• {n}</li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">Nincs elérhető adat</div>
        )}
      </div>
    </div>
  </div>
</div>

          {/* ✅ G3 – Dátumsáv (design egységesítve) */}
<div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
  <div className="px-4 sm:px-6 py-4">
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
        <div className="text-sm font-semibold text-gray-900">
          {formatShortDate(checkin)} → {formatShortDate(checkout)}
        </div>
        <div className="text-sm text-gray-600">
          {adults} felnőtt · {nights} éj
        </div>
      </div>

      <button
        onClick={() => setDateBarOpen((v) => !v)}
        className="h-10 px-4 rounded-lg border border-purple-600 text-purple-700 text-sm font-medium hover:bg-purple-50 transition-colors"
      >
        Módosítás
      </button>
    </div>

    {dateBarOpen && (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Érkezés</label>
            <input
              type="date"
              value={editCheckin}
              onChange={(e) => setEditCheckin(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Távozás</label>
            <input
              type="date"
              value={editCheckout}
              onChange={(e) => setEditCheckout(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-xs text-gray-600 mb-1">Felnőttek</label>
            <select
              value={editAdults}
              onChange={(e) => setEditAdults(parseInt(e.target.value, 10))}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm"
            >
              {[1,2,3,4,5,6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex items-end gap-2">
            <button
              onClick={() => setDateBarOpen(false)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100"
            >
              Mégse
            </button>
            <button
              onClick={applyDateChange}
              className="w-full h-10 px-3 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
            >
              Mentés
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
</div>

          {/* Hotel Description - About the Hotel (valós adat + fallback) */}
          <div className="mb-6">
          <HotelDescription
           hotel={hotelDetails as any}
           description={descriptionFromApi ?? undefined}
         />
        </div>

          {/* Amenities Grid - Hotel Services */}
          <div className="mb-6">
            <AmenitiesGrid amenities={[
              { key: 'wifi', label: 'Ingyenes WiFi', icon: 'wifi' },
              { key: 'parking', label: 'Parkoló', icon: 'parking' },
              { key: 'pool', label: 'Úszómedence', icon: 'pool' },
              { key: 'gym', label: 'Fitneszterem', icon: 'gym' },
              { key: 'spa', label: 'Spa & Wellness', icon: 'spa' },
              { key: 'restaurant', label: 'Étterem', icon: 'restaurant' },
              { key: 'breakfast', label: 'Reggeli', icon: 'breakfast' },
              { key: 'ac', label: 'Légkondicionálás', icon: 'ac' },
              { key: 'tv', label: 'Síkképernyős TV', icon: 'tv' },
              { key: 'safe', label: 'Széf', icon: 'safe' },
              { key: 'reception', label: '24 órás recepció', icon: '24h' },
              { key: 'shuttle', label: 'Reptéri transzfer', icon: 'shuttle' }
            ]} />
          </div>

          {/* Room List - Rooms/Offers from hp.rates (grouped by room type) */}
<div className="mb-6">
  {(() => {
    // ⚠️ hp válaszban a rates néha nem közvetlenül hotelHp.rates alatt van
const ratesCandidate =
  // 1) Ha már eleve egy "hotel" objektumot tárolunk hp-ből
  (hotelHp as any)?.rates ??
  // 2) Ha hp = { data: { hotels: [ { rates: [...] } ] } }
  (hotelHp as any)?.data?.hotels?.[0]?.rates ??
  // 3) Ha valamiért hp = { hotels: [ { rates: [...] } ] }
  (hotelHp as any)?.hotels?.[0]?.rates ??
  // 4) Régebbi / alternatív becsomagolások (fallback)
  (hotelHp as any)?.data?.rates ??
  (hotelHp as any)?.result?.rates ??
  (hotelHp as any)?.hp?.data?.hotels?.[0]?.rates ??
  (hotelHp as any)?.hp?.hotels?.[0]?.rates ??
  (hotelHp as any)?.hp?.rates ??
  (hotelHp as any)?.hotelpage?.rates;

const rates: any[] = Array.isArray(ratesCandidate) ? ratesCandidate : [];

if (rates.length === 0) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Elérhető szobák</h2>
        <p className="text-sm text-gray-500 mt-1">
          Most nincs elérhető ajánlat / ár ebben a válaszban.
        </p>
      </div>
      <div className="p-4 sm:p-5 text-sm text-gray-600">
        Ez általában azt jelenti, hogy a HP (hotelpage) válasz nem tartalmaz rate/price részt ehhez a dátumhoz.
      </div>
    </div>
  );
}


    // 1) Rate -> (roomName + offer) normalizálás
    const normalized = rates
      .map((rate: any) => {
        const pt = rate?.payment_options?.payment_types?.[0];

        const bookHash = rate?.book_hash ?? rate?.bookHash ?? "";
        if (!bookHash) return null;

        const roomName =
          rate?.room_data_trans?.main_room_type ??
          rate?.room_data_trans?.main_name ??
          rate?.room_name ??
          rate?.roomName ??
          "Szoba";

        // Ár: elsődlegesen payment_types[0].show_amount (ha van), különben esés
        const price =
          pt?.show_amount ??
          pt?.amount ??
          rate?.daily_prices?.[0]?.price ??
          rate?.payment_options?.show_amount ??
          0;

        const currency =
          pt?.show_currency_code ??
          pt?.currency_code ??
          rate?.payment_options?.show_currency_code ??
          rate?.currency ??
          "EUR";

        const hasBreakfast = Boolean(rate?.meal_data?.has_breakfast);

        const freeCancellationBefore =
          pt?.cancellation_penalties?.free_cancellation_before ?? null;

        const paymentType = pt?.type ?? null;

// Helyben fizetendő (on-site) adók/díjak – összeggel, a tax saját devizanemével
const taxes =
  pt?.tax_data?.taxes ??
  rate?.tax_data?.taxes ??
  [];

let onSiteFeesAmount: number | null = null;
let onSiteFeesCurrency: string | null = null;

if (Array.isArray(taxes)) {
  const onSiteTaxes = taxes.filter(
    (t: any) => t && t.included_by_supplier === false
  );

  if (onSiteTaxes.length > 0) {
    // 1) Devizanem: próbáljuk a tax tételekből kivenni (ez a legpontosabb)
    onSiteFeesCurrency =
      onSiteTaxes.find((t: any) => t?.currency)?.currency ||
      onSiteTaxes.find((t: any) => t?.tax_currency)?.tax_currency ||
      null;

    // 2) Összeg: összeadjuk a tax amountokat
    const sum = onSiteTaxes.reduce((acc: number, t: any) => {
      const value =
        Number(t.amount) ||
        Number(t.show_amount) ||
        0;
      return acc + (Number.isFinite(value) ? value : 0);
    }, 0);

    if (sum > 0) onSiteFeesAmount = sum;
  }
}

// ✅ Mindig összeggel kommunikálunk, a legjobb ismert devizanemmel
const onSiteFeesText =
  onSiteFeesAmount !== null
    ? `+ ${Math.round(onSiteFeesAmount)} ${onSiteFeesCurrency || "HUF"} helyben fizetendő`
    : null;

        return {
          roomName,
          offer: {
  bookHash,
  price: Number(price) || 0,
  currency: String(currency),
  hasBreakfast,
  freeCancellationBefore,
  paymentType,
  onSiteFeesAmount,
  onSiteFeesText,

  // ✅ Hivatalos ETG/RH mezők továbbadása a filterhez
  meal_data: rate?.meal_data ?? null,
  meal: rate?.meal ?? null, // deprecated fallback, de hasznos
},
        };
      })
      .filter(Boolean) as Array<{ roomName: string; offer: any }>;

    if (normalized.length === 0) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Elérhető szobák</h2>
        <p className="text-sm text-gray-500 mt-1">
          Vannak szoba elemek, de nincs foglalható ajánlat.
        </p>
      </div>
      <div className="p-4 sm:p-5 text-sm text-gray-600">
        A foglalható ajánlathoz szükséges a book_hash (később ebből lesz prebook).
      </div>
    </div>
  );
}


    // 2) Csoportosítás roomName szerint
    const groupsMap = new Map<string, any[]>();
    for (const item of normalized) {
      const list = groupsMap.get(item.roomName) ?? [];
      list.push(item.offer);
      groupsMap.set(item.roomName, list);
    }

    // 3) RoomGroup lista + determinisztikus ajánlat-sorrend
const roomGroups = Array.from(groupsMap.entries()).map(([roomName, offers]) => {
  const sortedOffers = [...offers].sort((a, b) => {
    // 1) Ár (olcsóbb előre)
    const pa = Number(a?.price) || 0;
    const pb = Number(b?.price) || 0;
    if (pa !== pb) return pa - pb;

    // 2) Azonos árnál: refundable előre (van freeCancellationBefore)
    const ra = a?.freeCancellationBefore ? 1 : 0;
    const rb = b?.freeCancellationBefore ? 1 : 0;
    if (ra !== rb) return rb - ra;

    // 3) Azonosnál: reggeli előre
    const ba = a?.hasBreakfast ? 1 : 0;
    const bb = b?.hasBreakfast ? 1 : 0;
    if (ba !== bb) return bb - ba;

    // 4) Végső stabilizáló: bookHash (ne ugráljon)
    const ha = String(a?.bookHash || "");
    const hb = String(b?.bookHash || "");
    return ha.localeCompare(hb);
  });

  return {
    roomName,
    offers: sortedOffers,
    isBestDeal: false,
  };
});

if (roomGroups.length === 0) return null;

    // 4) Best deal kijelölés: amelyik csoport első ajánlata a legolcsóbb
    let bestIdx = 0;
    let bestPrice = roomGroups[0]?.offers?.[0]?.price ?? Infinity;

    roomGroups.forEach((g, idx) => {
      const p = g?.offers?.[0]?.price ?? Infinity;
      if (p < bestPrice) {
        bestPrice = p;
        bestIdx = idx;
      }
    });

    const finalGroups = roomGroups.map((g, idx) => ({
      ...g,
      isBestDeal: idx === bestIdx,
    }));

    return (
  <>
    <RoomList
      roomGroups={finalGroups}
      loading={loading}      // ✅ új
      hpError={hpError}      // ✅ új
      nights={nights}
      adults={adults}
      onBook={({ roomName, offer }) => {
  console.log("[HotelDetail] onBook -> open BookingModal", { roomName, offer });

  setBookingItem({
    // a bookinghoz kell
    bookHash: offer.bookHash,

    // Step2 kiíráshoz kell
    roomName,
    price: offer.price,
    currency: offer.currency,
    hasBreakfast: offer.hasBreakfast,
    freeCancellationBefore: offer.freeCancellationBefore ?? null,
    paymentType: offer.paymentType ?? null,

        // ✅ helyben fizetendő adó/díj szöveg a Modalhoz
    onSiteFeesText: offer.onSiteFeesText ?? null,

    // keresési kontextus
    checkIn: checkin,
    checkOut: checkout,
    adults,
    hotelId,
    hotelHid,
  });

  setBookingModalOpen(true);
}}
    />

    <BookingModal
      isOpen={bookingModalOpen}
      onClose={() => setBookingModalOpen(false)}
      item={bookingItem}
      type="hotel"
      onConfirm={() => {}}
    />
  </>
);
  })()}
          </div>

          {/* Hotel Location - Real data (hide if missing) */}
{(() => {
  const hotelData: any = hotelDetails; // ✅ contract szerint ez már maga a hotel objektum

  const address =
    hotelData?.address ??
    hotelData?.location?.address ??
    hotelData?.hotel?.address ??
    '';

  const city =
    hotelData?.city ??
    hotelData?.location?.city ??
    hotelData?.hotel?.city ??
    undefined;

  const lat =
    hotelData?.latitude ??
    hotelData?.lat ??
    hotelData?.location?.lat ??
    hotelData?.geo?.lat ??
    undefined;

  const lng =
    hotelData?.longitude ??
    hotelData?.lng ??
    hotelData?.location?.lng ??
    hotelData?.geo?.lng ??
    undefined;

  // Ha nincs még cím sem, inkább ne mutassunk “fake” blokkot
  if (!address) return null;

  return (
    <div className="mb-6">
      <HotelLocation address={address} city={city} lat={lat} lng={lng} />
    </div>
  );
})()}

          {/* Hotel Policies - Mock Policies (UI-only) */}
          <div className="mb-6">
            <HotelPolicies 
              checkIn="14:00-tól"
              checkOut="11:00-ig"
              cancellationPolicy="Ingyenes lemondás 48 órával érkezés előtt"
            />
          </div>


          {/* Main Content Grid - Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Rooms & Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tabs Section - Description / Amenities / Rules */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'description' 
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Leírás
                  </button>
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'amenities' 
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Szolgáltatások
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'rules' 
                        ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    Szabályok
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-5">
                  {activeTab === 'description' && (
                    <div>
                      {hotelDetails.description ? (
                        <p className="text-gray-600 leading-relaxed">{hotelDetails.description}</p>
                      ) : (
                        <p className="text-gray-400 italic">Nincs elérhető leírás ehhez a szálláshoz.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'amenities' && (
                    <div>
                      {hotelDetails.amenities && hotelDetails.amenities.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {hotelDetails.amenities.map((amenity, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-gray-700">
                              <span className="text-purple-500">{getAmenityIcon(amenity)}</span>
                              <span className="text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Nincs elérhető szolgáltatás lista.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'rules' && (
                    <div className="space-y-4">
                      {/* Check-in/Check-out Times */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Bejelentkezés</p>
                            <p className="text-sm text-gray-600">
                              {hotelDetails.checkInTime ? `${hotelDetails.checkInTime}-tól` : '14:00-tól'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Kijelentkezés</p>
                            <p className="text-sm text-gray-600">
                              {hotelDetails.checkOutTime ? `${hotelDetails.checkOutTime}-ig` : '11:00-ig'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* General Rules */}
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Általános szabályok</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Érvényes személyi igazolvány vagy útlevél szükséges a bejelentkezéshez</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>A szobák nem dohányzók, dohányzás csak a kijelölt helyeken</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>Háziállatok befogadása a szállás szabályzatától függ</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sticky Booking Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-4">
                {/* Booking Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-4">
                    <h3 className="text-white font-semibold">Foglalás összefoglaló</h3>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Érkezés</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatShortDate(checkin)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">Távozás</p>
                        <p className="font-semibold text-gray-900 text-sm">{formatShortDate(checkout)}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-3 py-3 border-y border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          Időtartam
                        </span>
                        <span className="font-medium text-gray-900">{nights} éjszaka</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          Vendégek
                        </span>
                        <span className="font-medium text-gray-900">{adults} felnőtt</span>
                      </div>
                    </div>

                    {/* Change Date Button */}
                    <button
                      onClick={handleChangeDate}
                      className="w-full py-2.5 border-2 border-purple-600 text-purple-600 font-medium rounded-lg hover:bg-purple-50 transition-colors text-sm"
                    >
                      Dátum módosítása
                    </button>
                  </div>
                </div>

                {/* Quick Info Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-amber-900 text-sm mb-1">Tudta?</p>
                      <p className="text-xs text-amber-700">
                        Az ingyenes lemondással jelölt szobák esetén a megadott dátumig díjmentesen módosíthatja vagy lemondhatja foglalását.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <h4 className="font-medium text-gray-900 mb-2 text-sm">Segítségre van szüksége?</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Ügyfélszolgálatunk készséggel áll rendelkezésére.
                  </p>
                  <button className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
                    Kapcsolatfelvétel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default HotelDetail;
