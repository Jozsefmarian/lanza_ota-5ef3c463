import React from 'react';
import { Star, MapPin, Coffee, RotateCcw, CreditCard, Building2, UtensilsCrossed, Salad, Soup, Sparkles, XCircle, Wifi, Car, Dumbbell, Waves, Train, Navigation } from 'lucide-react';

/**
 * ÁTMENETI megoldás (dump nélkül, Famous környezet):
 * A városközpont / metró távolságot a "Location" leírás szövegéből (description_struct) parszoljuk.
 * Később (saját szerver + POI/dump) ezt strukturált POI adatokra cseréljük.
 * Ha a provider szövegformátuma változik, a távolság egyszerűen eltűnik (de a UI nem törik).
 */
// --- Fallback: távolságok kinyerése a "Location" szövegből (best effort) ---
const getLocationParagraphText = (h: any): string => {
  const candidates = [
  // amit eddig kerestünk
  h?.description_sections,
  h?.descriptionSections,
  h?.hotel?.description_sections,
  h?.hotel?.descriptionSections,
  h?.details?.description_sections,
  h?.details?.descriptionSections,
  h?.static?.description_sections,
  h?.static?.descriptionSections,

  // ✅ EZ HIÁNYZOTT: a te valós válaszodban itt van
  h?.description_struct,
  h?.hotel?.description_struct,
  h?.details?.description_struct,
  h?.static?.description_struct,
];

  for (const sections of candidates) {
    if (Array.isArray(sections)) {
      const loc = sections.find(
        (s: any) => String(s?.title || "").toLowerCase() === "location"
      );
      const p = loc?.paragraphs;
      if (Array.isArray(p) && p.length) {
        return p.join(" ").replace(/\s+/g, " ").trim();
      }
    }
  }

  return "";
};

const extractDistancesFromLocationText = (textRaw: string) => {
  const text = (textRaw || "").replace(/\s+/g, " ").trim();
  if (!text) return { centerKm: null as number | null, metroM: null as number | null, metroName: null as string | null };

  const parseNum = (s: string) => {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  };

  // City center: "3 km from the city center" / "800 m from the city center"
  const centerMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometers?|m|meters?)\s+from\s+the\s+city\s+center/i);
  let centerKm: number | null = null;
  if (centerMatch) {
    const val = parseNum(centerMatch[1]);
    const unit = centerMatch[2].toLowerCase();
    if (val !== null) centerKm = unit.startsWith("m") ? val / 1000 : val;
  }

  // Metro: "184 m from the Blaha Lujza tér metro" / "... from the ... subway"
  // Megpróbáljuk a név részt is kivenni (ha benne van)
  const metroMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometers?|m|meters?)\s+from\s+the\s+(.+?)\s+(metro|subway)/i);
  let metroM: number | null = null;
  let metroName: string | null = null;

  if (metroMatch) {
    const val = parseNum(metroMatch[1]);
    const unit = metroMatch[2].toLowerCase();
    if (val !== null) metroM = unit.startsWith("m") ? Math.round(val) : Math.round(val * 1000);

    const name = (metroMatch[3] || "").trim();
    metroName = name ? name : null;
  } else {
    // Ha nincs név, csak "from the metro"
    const metroSimple = text.match(/(\d+(?:[.,]\d+)?)\s*(km|kilometers?|m|meters?)\s+from\s+(the\s+)?(nearest\s+)?(metro|subway)/i);
    if (metroSimple) {
      const val = parseNum(metroSimple[1]);
      const unit = metroSimple[2].toLowerCase();
      if (val !== null) metroM = unit.startsWith("m") ? Math.round(val) : Math.round(val * 1000);
    }
  }

  return { centerKm, metroM, metroName };
};

interface Hotel {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  location: string;
  stars: number;
  amenities: string[];
  hotel?: {
    name?: string;
    images?: { url: string }[];
    stars?: number;
    address?: string;
  };
  rates?: {
    daily_prices?: number[];
    price?: number;
    currency?: string;
  }[];
  score?: {
    is_best_deal?: boolean;
  };
}

interface HotelCardProps {
  hotel: Hotel;
  isWishlisted: boolean;
  onWishlistToggle: (id: number) => void;
  onBook: (hotel: Hotel) => void;
  searchMeta?: {
    roomsCount: number;
    adultsTotal: number;
    childrenTotal: number;
    nights: number;
  };
}

// ========== SEGÉD FÜGGVÉNYEK ==========

/**
 * Ellátás típus meghatározása a bestRate alapján
 */
function getMealInfo(bestRate: any): { label: string; isNoMeal: boolean } {
  if (!bestRate) return { label: 'Ellátás nélkül', isNoMeal: true };

  const raw = (bestRate?.meal_data?.value ?? bestRate?.meal ?? '').toString();
  const norm = raw.toLowerCase().replace(/[\s_-]/g, '');

  // no meal / room only
  if (norm === 'nomeal' || norm === 'roomonly') {
    return { label: 'Ellátás nélkül', isNoMeal: true };
  }

  // ✅ Fontos sorrend: AI/FB/HB előbb, mert ezekben benne lehet a "breakfast" szó is
  if (norm.includes('allinclusive') || norm === 'ai') {
    return { label: 'All inclusive', isNoMeal: false };
  }

  if (norm.includes('fullboard') || norm === 'fb') {
    return { label: 'Teljes ellátás', isNoMeal: false };
  }

  if (norm.includes('halfboard') || norm === 'hb') {
    return { label: 'Félpanzió', isNoMeal: false };
  }

  // breakfast (value vagy has_breakfast alapján)
  const hasBreakfast = Boolean(bestRate?.meal_data?.has_breakfast);
  if (norm.includes('breakfast') || hasBreakfast) {
    return { label: 'Reggelivel', isNoMeal: false };
  }

  if (norm.length > 0) {
    return { label: 'Ellátással', isNoMeal: false };
  }

  return { label: 'Ellátás nélkül', isNoMeal: true };
}

/**
 * Fizetési mód meghatározása
 */
function getPaymentLabel(bestRate: any): string | null {
  if (!bestRate) return null;

  const paymentType = bestRate?.payment_options?.payment_types?.[0]?.type;

  if (!paymentType) return null;

  const type = paymentType.toString().toLowerCase();

  if (type === 'hotel') {
    return 'Fizetés a szálláshelyen';
  }

  if (type === 'deposit' || type === 'now' || type === 'prepay' || type === 'prepaid') {
    return 'Online fizetés';
  }

  return null;
}

/**
 * Ellátás ikon kiválasztása
 */
function getMealIcon(mealLabel: string): React.ReactNode {
  switch (mealLabel) {
    case 'Reggelivel':
      return <Coffee className="w-4 h-4 flex-shrink-0" />;
    case 'Félpanzió':
      return <Salad className="w-4 h-4 flex-shrink-0" />;
    case 'Teljes ellátás':
      return <Soup className="w-4 h-4 flex-shrink-0" />;
    case 'All inclusive':
      return <Sparkles className="w-4 h-4 flex-shrink-0" />;
    case 'Ellátással':
      return <UtensilsCrossed className="w-4 h-4 flex-shrink-0" />;
    default:
      return <XCircle className="w-4 h-4 flex-shrink-0" />;
  }
}

/**
 * Amenity ikon kiválasztása
 */
function getAmenityIcon(amenity: string): React.ReactNode | null {
  const a = amenity.toLowerCase();
  if (a.includes('wifi') || a.includes('internet')) {
    return <Wifi className="w-5 h-5" />;
  }
  if (a.includes('parking') || a.includes('parkoló')) {
    return <Car className="w-5 h-5" />;
  }
  if (a.includes('gym') || a.includes('fitness') || a.includes('edzőterem')) {
    return <Dumbbell className="w-5 h-5" />;
  }
  if (a.includes('pool') || a.includes('medence') || a.includes('úszó')) {
    return <Waves className="w-5 h-5" />;
  }
  return null;
}

/**
 * Rating szöveg meghatározása
 */
function getRatingText(score: number): string {
  if (score >= 9) return 'Kiváló';
  if (score >= 8) return 'Nagyon jó';
  if (score >= 7) return 'Jó';
  if (score >= 6) return 'Megfelelő';
  return 'Értékelt';
}

// ========== KOMPONENS ==========

const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  isWishlisted,
  onWishlistToggle,
  onBook,
  searchMeta,
}) => {
  // --- Normalizálás (rugalmas mezőnevek + fallback) ---
  const rawId: any =
    (hotel as any).hid ??
    (hotel as any).hotel_id ??
    (hotel as any).id ??
    (hotel as any).hotel?.id;

  const hotelId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;

  const rawName =
    (hotel as any).hotel?.name ??
    (hotel as any).name ??
    (hotel as any).hotel_name ??
    (hotel as any).hotelName;

  const hotelName = rawName || (hotelId ? `Hotel #${hotelId}` : 'Ismeretlen szállás');

  // Kép mezők
  const imgFromNested =
    (hotel as any).hotel?.images?.[0]?.url ??
    (hotel as any).hotel?.images?.[0] ??
    (hotel as any).hotel?.image;

  const imgFromTop =
    (hotel as any).image ??
    (hotel as any).images?.[0]?.url ??
    (hotel as any).images?.[0] ??
    (hotel as any).images_ext?.[0]?.url ??
    (hotel as any).thumbnail ??
    (hotel as any).photo ??
    (hotel as any).photos?.[0]?.url ??
    (hotel as any).photos?.[0];

  const hotelImage =
    imgFromNested ||
    imgFromTop ||
    'data:image/svg+xml;utf8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
          <rect width="100%" height="100%" fill="#e5e7eb"/>
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
            font-family="Arial" font-size="28" fill="#6b7280">
            No image
          </text>
        </svg>`
      );

  // CDN URL-ekben gyakori a "{size}" placeholder
  const hotelImageSized =
    typeof hotelImage === 'string'
      ? hotelImage.replace('{size}', '1024x768')
      : hotelImage;

  // http -> https normalizálás
  const normalizedHotelImage =
    typeof hotelImageSized === 'string' && hotelImageSized.startsWith('http://')
      ? hotelImageSized.replace('http://', 'https://')
      : hotelImageSized;

  // Stars
  const rawStars =
    (hotel as any)?.hotel?.stars ??
    (hotel as any)?.stars ??
    (hotel as any)?.starRating ??
    0;

  const hotelStars = Math.max(0, Math.min(5, Number(rawStars) || 0));

  // Location
  const hotelLocation =
    (hotel as any).hotel?.address ??
    (hotel as any).location ??
    (hotel as any).address ??
    '';

  // Távolság adatok (ha vannak) + fallback a Location szövegből
const distanceToCenter = (hotel as any)?.distance_to_center ?? (hotel as any)?.distanceToCenter ?? null;
const distanceToMetro = (hotel as any)?.distance_to_metro ?? (hotel as any)?.distanceToMetro ?? null;
const metroName = (hotel as any)?.nearest_metro ?? (hotel as any)?.nearestMetro ?? null;

// Fallback: Location szöveg
const locationText = getLocationParagraphText(hotel as any);
const textDistances = extractDistancesFromLocationText(locationText);

// Effektív értékek (ha nincs struktúrált mező, jön a szöveg)
const effectiveCenterKm =
  distanceToCenter !== null && distanceToCenter !== undefined
    ? Number(String(distanceToCenter).replace(",", "."))
    : textDistances.centerKm;

const effectiveMetroM =
  distanceToMetro !== null && distanceToMetro !== undefined
    ? Math.round(Number(String(distanceToMetro).replace(",", ".")))
    : textDistances.metroM;

const effectiveMetroName = metroName ?? textDistances.metroName;

  // Rating score (ha van)
  const reviewScore =
    (hotel as any)?.review_score ??
    (hotel as any)?.score?.review_score ??
    (hotel as any)?.guest_rating ??
    null;

  const reviewCount =
    (hotel as any)?.reviews_count ??
    (hotel as any)?.review_count ??
    (hotel as any)?.score?.reviews_count ??
    null;

  // Amenities
  const amenities: string[] =
    (hotel as any)?.amenities ??
    (hotel as any)?.hotel?.amenities ??
    (hotel as any)?.facilities ??
    [];

  // Legolcsóbb ajánlat kiválasztása
  const ratesArr = Array.isArray((hotel as any).rates) ? (hotel as any).rates : [];

  const bestRate = ratesArr.reduce((best: any, r: any) => {
    const bestPrice = Number(best?.price ?? Infinity);
    const rPrice = Number(r?.price ?? Infinity);
    return rPrice < bestPrice ? r : best;
  }, null);

    // Szobanév
  const roomTypeName =
    (bestRate as any)?.room_name ??
    (bestRate as any)?.room ??
    (bestRate as any)?.name ??
    null;

  // Ágytípus (ha van)
  const bedType = (bestRate as any)?.bed_type ?? (bestRate as any)?.bedType ?? null;

  // Fallbackok: ha a szobatípus/ágytípus nem jött át a mostani mezőből
  // (Search SERP-ben mezőeltérés gyakori)
  const roomTypeNameSafe =
    roomTypeName ??
    (bestRate as any)?.room_data?.name ??
    (bestRate as any)?.rg_ext?.room_name ??
    (bestRate as any)?.rate_name ??
    null;

  const bedTypeSafe =
    bedType ??
    (bestRate as any)?.room_data?.bed_type ??
    (bestRate as any)?.bed_type ??
    null;

  // Ha tényleg semmi nincs, legalább ne legyen üres a bal oszlop
  const roomTypeLabel = roomTypeNameSafe || 'Standard szoba';

  // Árak
  const totalPrice = bestRate?.price ?? (hotel as any).rates?.[0]?.price ?? null;
  
  // Eredeti ár (ha van kedvezmény)
  const originalPrice = (bestRate as any)?.original_price ?? (bestRate as any)?.price_before_discount ?? null;

  // Adók és díjak
  const taxesAndFees = (bestRate as any)?.taxes_and_fees ?? (bestRate as any)?.taxesAndFees ?? null;

  const hotelCurrency =
    bestRate?.currency ??
    (hotel as any).currency ??
    (hotel as any).rates_currency ??
    'EUR';

  // Free cancellation
  const freeCancellation = Array.isArray((bestRate as any)?.cancellation_penalties?.policies)
    ? (bestRate as any).cancellation_penalties.policies.some((p: any) => {
        const a = Number(p?.amount_show ?? p?.amount_charge ?? '999999');
        return Number.isFinite(a) && a === 0;
      })
    : false;

  // Ellátás és fizetés info
  const mealInfo = getMealInfo(bestRate);
  const paymentLabel = getPaymentLabel(bestRate);

  // Amenity ikonok (max 6)
  const amenitiesRaw: string[] =
  (hotel as any)?.amenities ??
  (hotel as any)?.hotel?.amenities ??
  (hotel as any)?.hotel?.amenity ??
  (hotel as any)?.hotel?.facility ??
  (hotel as any)?.hotel?.facilities ??
  (hotel as any)?.hotel?.serp_filters ??
  [];

const amenityIcons = (Array.isArray(amenitiesRaw) ? amenitiesRaw : [])
  .map((name: any) => {
    const n = typeof name === "string" ? name : name?.name;
    if (!n) return null;
    const icon = getAmenityIcon(n);
    if (!icon) return null;
    return { name: n, icon };
  })
  .filter(Boolean) as { name: string; icon: React.ReactNode }[];

  // Ár formázó
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('hu-HU', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      EUR: '€',
      USD: '$',
      HUF: 'Ft',
      GBP: '£',
    };
    return symbols[currency] || currency;
  };

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200">
      {/* 
        =====================
        SZINT 1 – TELJES KÁRTYA
        =====================
        MOBIL: flex-col (egymás alatt)
        DESKTOP (lg+): flex-row (BAL kép | JOBB tartalom)
      */}
      <div className="flex flex-col lg:flex-row">
        
        {/* ========== BAL: Fő kép (kb. 1/3) ========== */}
        <div className="relative w-full lg:w-[35%] lg:flex-shrink-0 h-56 lg:h-auto lg:min-h-[280px] overflow-hidden bg-gray-100">
          <img
            src={normalizedHotelImage as string}
            alt={hotelName}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          
          {/* Wishlist gomb a képen */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWishlistToggle(hotelId);
            }}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
          >
            <svg
              className={`w-5 h-5 ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-600'}`}
              fill={isWishlisted ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>

        {/* ========== JOBB: Tartalom (kb. 2/3) ========== */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* 
            =====================
            SZINT 2 – JOBB OLDALI TARTALOM
            =====================
          */}

          {/* --------------------- A) FELSŐ INFO RÉSZ (fehér háttér, 2 oszlopos) --------------------- */}
          <div className="p-4 lg:p-5 flex flex-col lg:flex-row lg:items-stretch gap-4">
            
            {/* A) BAL oszlop: hotel info */}
            <div className="flex-1 min-w-0">
              {/* Hotel név - mindig felülről indul */}
              <h3 className="text-lg lg:text-xl font-bold text-gray-900 leading-tight line-clamp-2 mb-1">
                {hotelName}
              </h3>

              {/* Csillagok */}
              {hotelStars > 0 && (
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(hotelStars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              )}

              {/* Cím */}
              {hotelLocation && (
                <div className="flex items-start gap-1.5 text-gray-600 mb-1">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="text-sm line-clamp-1">{hotelLocation}</span>
                </div>
              )}

              {/* Városközponttól távolság */}
              {effectiveCenterKm !== null && Number.isFinite(effectiveCenterKm) && (
  <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
    <Navigation className="w-4 h-4 flex-shrink-0" />
    <span>{effectiveCenterKm.toFixed(1).replace('.', ',')} km távolságra a városközponttól</span>
  </div>
)}

              {/* Metró távolság */}
              {effectiveMetroM !== null && Number.isFinite(effectiveMetroM) && (
  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
    <Train className="w-4 h-4 flex-shrink-0" />
    <span>
      {effectiveMetroM} m távolságra
      {effectiveMetroName ? ` a(z) ${effectiveMetroName} metróállomástól` : " a metróállomástól"}
    </span>
  </div>
)}
            </div>

            {/* A) JOBB oszlop: rating + amenity ikonok */}
            <div className="flex flex-col items-end gap-3 lg:flex-shrink-0">
              {/* Rating blokk */}
              {reviewScore && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-800">
                      {getRatingText(Number(reviewScore))}
                    </div>
                    {reviewCount && (
                      <div className="text-xs text-gray-500">
                        {reviewCount} értékelés
                      </div>
                    )}
                  </div>
                  <div className="bg-green-500 text-white text-lg font-bold px-2.5 py-1.5 rounded-md rounded-bl-none min-w-[44px] text-center">
                    {Number(reviewScore).toFixed(1).replace('.', ',')}
                  </div>
                </div>
              )}

              {/* Amenity ikonok */}
          {amenityIcons.length > 0 && (
            <div className="mt-auto flex items-center gap-2 text-gray-400">
              {amenityIcons.map((item, idx) => (
              <div
                  key={idx}
                  title={item.name}
                  className="hover:text-gray-600 transition-colors"
                >
                  {item.icon}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

          {/* --------------------- B) KÖZÉPSŐ KIEMELT AJÁNLAT PANEL (szürke háttér, 3 oszlopos) --------------------- */}
          <div className="px-4 lg:px-5 pb-4 lg:pb-5">
  <div className="bg-gray-100 rounded-2xl p-4 lg:p-5">
            
            {/* Jelentkezzen be és takarítson meg - ha van kedvezmény */}
            {originalPrice && originalPrice > totalPrice && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <span className="text-cyan-600 font-medium">Jelentkezzen be</span>
                <span className="text-gray-600">és takarítson meg:</span>
                <span className="bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                  {formatPrice(originalPrice - totalPrice)} {getCurrencySymbol(hotelCurrency)}
                </span>
              </div>
            )}

            {/* 3 oszlopos panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              
              {/* B) BAL oszlop: szobatípus + ágytípus */}
              <div className="min-w-0">
                {roomTypeLabel && (
  <div className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">
    {roomTypeLabel}
  </div>
)}

{bedTypeSafe && (
  <div className="text-xs text-gray-500">
    {bedTypeSafe}
  </div>
)}
              </div>

              {/* B) KÖZÉPSŐ oszlop: ellátás, lemondás, fizetés */}
              <div className="space-y-2">
                {/* Ellátás */}
                <div className={`flex items-center gap-2 text-sm ${mealInfo.isNoMeal ? 'text-gray-500' : 'text-emerald-600'}`}>
                  {getMealIcon(mealInfo.label)}
                  <span className={mealInfo.isNoMeal ? 'font-normal' : 'font-medium'}>
                    {mealInfo.label}
                  </span>
                </div>

                {/* Lemondás */}
                <div className={`flex items-center gap-2 text-sm ${freeCancellation ? 'text-emerald-600' : 'text-gray-500'}`}>
                  <RotateCcw className="w-4 h-4 flex-shrink-0" />
                  <span className={freeCancellation ? 'font-medium' : 'font-normal'}>
                    {freeCancellation ? 'Ingyenes lemondás' : 'Nincs ingyenes lemondás'}
                  </span>
                </div>

                {/* Fizetés mód */}
                {paymentLabel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {paymentLabel === 'Fizetés a szálláshelyen' ? (
                      <Building2 className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <CreditCard className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{paymentLabel}</span>
                  </div>
                )}
              </div>

              {/* B) JOBB oszlop: ár + éjszaka/vendég + adók */}
              <div className="text-right">
                {/* Eredeti ár áthúzva (ha van kedvezmény) */}
                {originalPrice && originalPrice > totalPrice && (
                  <div className="text-sm text-gray-400 line-through mb-0.5">
                    {formatPrice(originalPrice)} {getCurrencySymbol(hotelCurrency)}
                  </div>
                )}
                
                {/* Ár / éj (Zenhotels-szerű) */}
                {searchMeta?.nights && totalPrice ? (
                <div className="text-sm font-semibold text-gray-900">
                  {formatPrice(Number(totalPrice) / Number(searchMeta.nights))} {getCurrencySymbol(hotelCurrency)} / éj
                </div>
              ) : null}

                {/* Fő ár */}
                <div className="text-2xl lg:text-2xl font-bold text-gray-900">
                  {totalPrice
                    ? `${formatPrice(Number(totalPrice))} ${getCurrencySymbol(hotelCurrency)}`
                    : '—'}
                </div>
                
                {/* Éjszaka / vendég info */}
                {searchMeta && (
                  <div className="text-xs text-gray-500 mt-1">
                    {searchMeta.nights} éjszaka {searchMeta.adultsTotal}
                    {searchMeta.childrenTotal > 0 ? `+${searchMeta.childrenTotal}` : ''} vendég
                  </div>
                )}

                {/* Adók és díjak */}
                {taxesAndFees && taxesAndFees > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    + {formatPrice(taxesAndFees)} {getCurrencySymbol(hotelCurrency)} adók és díjak
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

          {/* --------------------- C) ALSÓ SÁV: CTA gomb --------------------- */}
          <div className="p-4 lg:p-5 lg:flex lg:justify-end">
            <button
              onClick={() => onBook(hotel)}
              className="w-full lg:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm"
            >
              Minden szoba megjelenítése
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;
