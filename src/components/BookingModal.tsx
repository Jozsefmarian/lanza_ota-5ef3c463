import { supabase } from "@/lib/supabase";
import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Users, CreditCard, Check, Loader2, AlertCircle } from 'lucide-react';
import { createBooking, PrebookResult } from '../lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  type: 'hotel' | 'flight' | 'car';
  onConfirm: (bookingData: any) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, item, type, onConfirm }) => {
  const getMealLabel = (meal?: { value?: string | null; has_breakfast?: boolean | null } | null) => {
  const raw = (meal?.value ?? "").toString();
  const norm = raw.toLowerCase().replace(/[\s_-]/g, "");

  // ✅ Fontos sorrend: AI/FB/HB előbb, mert ezekben benne lehet a "breakfast" szó is
  if (norm.includes("allinclusive") || norm === "ai") return "All inclusive";
  if (norm.includes("fullboard") || norm === "fb") return "Teljes ellátás";
  if (norm.includes("halfboard") || norm === "hb") return "Félpanzió";

  // reggeli (csak ha nincs erősebb meal típus)
  if (norm.includes("breakfast") || Boolean(meal?.has_breakfast)) return "Reggelivel";

  if (norm.length > 0) return raw; // ha van valami érték, mutassuk
  return "Ellátás nélkül";
};
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prebookData, setPrebookData] = useState<PrebookResult['prebook'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    checkIn: item?.checkIn || '',
    checkOut: item?.checkOut || '',
    specialRequests: ''
  });

  // Reset state ONLY when the modal is opened (not when `item` changes)
const wasOpenRef = useRef(false);

useEffect(() => {
  // when closing, mark as closed
  if (!isOpen) {
    wasOpenRef.current = false;
    return;
  }

  // if it just opened now (was closed before)
  if (isOpen && !wasOpenRef.current) {
    wasOpenRef.current = true;

    setStep(1);
    setError(null);
    setPrebookData(null);

    // keep the initial dates from item on open
    if (item?.checkIn) setFormData(prev => ({ ...prev, checkIn: item.checkIn }));
    if (item?.checkOut) setFormData(prev => ({ ...prev, checkOut: item.checkOut }));
  }
}, [isOpen]); // <-- IMPORTANT: item removed

  if (!isOpen || !item) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // --- Prebook válaszból ár kinyerés (többféle ETG struktúra miatt) ---
  const extractPrebookPrice = (raw: any): { amount: number | null; currency: string | null } => {
    try {
      const h0 = raw?.hotels?.[0];
      const r0 = h0?.rates?.[0];

      // Leggyakoribb: payment_options.payment_types[0].amount + currency
      const pt0 = r0?.payment_options?.payment_types?.[0];
      const amountA = pt0?.amount ?? pt0?.show_amount ?? null;
      const currencyA = pt0?.currency ?? r0?.currency ?? h0?.currency ?? null;
      if (typeof amountA === "number" && (typeof currencyA === "string" || currencyA === null)) {
        return { amount: amountA, currency: currencyA };
      }

      // Alternatív: rate.price.amount / rate.price.currency
      const amountB = r0?.price?.amount ?? r0?.price?.value ?? null;
      const currencyB = r0?.price?.currency ?? r0?.currency ?? null;
      if (typeof amountB === "number" && (typeof currencyB === "string" || currencyB === null)) {
        return { amount: amountB, currency: currencyB };
      }

      // Alternatív: hotel.price
      const amountC = h0?.price?.amount ?? h0?.price?.value ?? null;
      const currencyC = h0?.price?.currency ?? null;
      if (typeof amountC === "number" && (typeof currencyC === "string" || currencyC === null)) {
        return { amount: amountC, currency: currencyC };
      }

      return { amount: null, currency: null };
    } catch {
      return { amount: null, currency: null };
    }
  };

  const isPriceMismatch = (searchAmount: any, prebookAmount: any) => {
    if (typeof searchAmount !== "number" || typeof prebookAmount !== "number") return false;
    // 1 centes tolerancia (kerekítési különbségek miatt)
    const s = Math.round(searchAmount * 100);
    const p = Math.round(prebookAmount * 100);
    return s !== p;
  };

  // Step 1 -> Step 2: Prebook the rate
  const handleProceedToPayment = async () => {
    console.log("[BookingModal] Step1 gomb megnyomva", {
  itemBookHash: item?.bookHash,
  formData,
});
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      setError('Kérjük, töltse ki az összes kötelező mezőt!');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call prebook API to verify rate availability
      const { data, error } = await supabase.functions.invoke("ratehawk-prebook", {
        body: {
         book_hash: item.bookHash,
        },
      });

      console.log("[BookingModal] Prebook válasz", { data, error });

      if (error) {
        setError("Prebook hiba: " + (error.message || "ismeretlen hiba"));
        return;
      }

      // --- p-... book_hash kinyerés (többféle ETG válaszstruktúrára) ---
const prebook = data?.prebook;
const prebookData = prebook?.data;

// 1) leggyakoribb hely: prebook.data.book_hash
let pHash =
  prebookData?.book_hash ??
  prebookData?.bookHash ??
  null;

// 2) ha a válasz a hotels/rates struktúrában hozza
if (
  !pHash &&
  prebookData &&
  Array.isArray(prebookData.hotels) &&
  prebookData.hotels.length > 0
) {
  const h0 = prebookData.hotels[0];
  pHash =
    h0?.book_hash ??
    h0?.bookHash ??
    h0?.rates?.[0]?.book_hash ??
    h0?.rates?.[0]?.bookHash ??
    null;
}

console.log("[BookingModal] Prebook hash extracted", { pHash });

if (!pHash || typeof pHash !== "string" || !pHash.startsWith("p-")) {
  console.error("[BookingModal] Nem találtam p-... book_hash-t a prebook válaszban", {
    prebookStatus: prebook?.status,
    prebookError: prebook?.error,
    prebookDataKeys: prebookData ? Object.keys(prebookData) : null,
  });
  setError("Prebook sikeresnek tűnik, de nem jött meg a p-... book_hash.");
  return;
}

      // Minimál prebookData, hogy a Step2/Step3 ne omoljon össze
            const raw = data?.prebook?.data;

      // ✅ prebook ár kinyerés + összehasonlítás a search árral
      const extracted = extractPrebookPrice(raw);
      const prebookAmount = extracted.amount;
      const prebookCurrency = extracted.currency || item.currency || "EUR";

      const mismatch = isPriceMismatch(item?.price, prebookAmount);

      // ✅ Minimál prebookData + ár bekötése (getPrice már tudja ezt használni)
      setPrebookData({
        prebookHash: pHash,              // p-... kötelező a bookinghoz
        rawPrebook: raw,                 // debug / későbbi validálás

        // UI-hoz: ha tudjuk, mutassuk a végleges árat a prebook alapján
        price: (typeof prebookAmount === "number")
          ? { amount: prebookAmount, currency: prebookCurrency }
          : undefined,

        // UI-hoz: price mismatch információ (nem silent!)
        priceMismatch: mismatch
          ? {
              search: { amount: item?.price, currency: item?.currency || prebookCurrency },
              prebook: { amount: prebookAmount, currency: prebookCurrency },
            }
          : null,
      } as any);

setStep(2);
    } catch (err: any) {
      setError(err.message || 'Hiba történt az előfoglalás során.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 -> Step 3: Create booking
  const handleConfirmBooking = async () => {
    if (!prebookData?.prebookHash) {
      setError('Érvénytelen foglalási adatok. Kérjük, próbálja újra.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createBooking({
        prebookHash: prebookData.prebookHash,
        guests: [{
          firstName: formData.firstName,
          lastName: formData.lastName,
          isAdult: true
        }],
        contactInfo: {
          email: formData.email,
          phone: formData.phone
        },
        specialRequests: formData.specialRequests,
        language: 'hu'
      });

      if (result.success && result.booking) {
        setStep(3);
        onConfirm(result.booking);
      } else {
        setError(result.error || 'Hiba történt a foglalás során. Kérjük, próbálja újra.');
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt a foglalás során.');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (prebookData?.hotelName) return prebookData.hotelName;
    return item.name || item.hotelName || 'Szállás foglalás';
  };

  const getPrice = () => {
    if (prebookData?.price) {
      return `${prebookData.price.amount} ${prebookData.price.currency}`;
    }
    if (item.price) {
      return `${item.price} ${item.currency || 'EUR'}`;
    }
    return '';
  };

  const getRoomName = () => {
    return prebookData?.roomName || item.roomName || '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold">{getTitle()}</h2>
          {getRoomName() && <p className="text-white/80 mt-1">{getRoomName()}</p>}
          <p className="text-white/80 mt-1">{getPrice()}</p>
                    {prebookData?.priceMismatch && (
            <div className="mt-3 bg-white/15 border border-white/30 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div className="text-sm">
                  <div className="font-semibold">Árváltozás történt a foglalás előtt</div>
                  <div className="text-white/90 mt-1">
                    Keresési ár: {prebookData.priceMismatch.search.amount} {prebookData.priceMismatch.search.currency}
                    {" · "}
                    Előfoglalás ár: {prebookData.priceMismatch.prebook.amount} {prebookData.priceMismatch.prebook.currency}
                  </div>
                  <div className="text-white/90 mt-1">
                    A folytatáshoz a végleges ár az <b>előfoglalás</b> alapján érvényes.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-2">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  step >= s ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded ${step > s ? 'bg-white' : 'bg-white/30'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-white/80">
            <span>Adatok</span>
            <span>Összegzés</span>
            <span>Megerősítés</span>
          </div>
        </div>

        <div className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Guest Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Vendég adatai</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vezetéknév *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keresztnév *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email cím *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefonszám *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+36 30 123 4567"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Különleges kérések</label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Pl. korai bejelentkezés, babakiságy, stb."
                />
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Ellenőrzés...</span>
                  </>
                ) : (
                  <span>Tovább az összegzéshez</span>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Summary & Confirm */}
          {step === 2 && !!prebookData?.prebookHash && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Foglalás összegzése</h3>
              
              {/* Booking Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-3">Szállás adatai</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Szállás</span>
                    <span className="font-medium">{prebookData.hotelName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Szoba típus</span>
                    <span className="font-medium">{prebookData.roomName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bejelentkezés</span>
                    <span className="font-medium">{prebookData.checkin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kijelentkezés</span>
                    <span className="font-medium">{prebookData.checkout}</span>
                  </div>
                  {prebookData.meal?.value && prebookData.meal.value !== 'nomeal' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ellátás</span>
                      <span className="font-medium">
                        {getMealLabel(prebookData.meal)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Guest Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-3">Vendég adatai</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Név</span>
                    <span className="font-medium">{formData.lastName} {formData.firstName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy */}
              {prebookData?.cancellationPolicy?.freeCancellationBefore && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-green-700 text-sm">
                    <strong>Ingyenes lemondás</strong> {prebookData.cancellationPolicy.freeCancellationBefore} előtt
                  </p>
                </div>
              )}

              {/* Price Summary */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-900 mb-3">Fizetendő összeg</h4>
                <div className="flex justify-between text-lg font-bold">
                  <span>Összesen</span>
                  <span className="text-purple-600">
                  {prebookData?.price?.amount
                    ? `${prebookData.price.amount} ${prebookData.price.currency}`
                   : getPrice()}
                </span>
                </div>
                {item?.onSiteFeesText ? (
                 <div className="text-xs text-gray-500 mt-2">
                  <div>Az ár tartalmazza az összes adót és díjat, kivéve a helyszínen fizetendő tételeket.</div>
                  <div className="mt-1">{item.onSiteFeesText}</div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Az ár tartalmazza az összes adót és díjat.
                </p>
              )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Vissza
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Foglalás...</span>
                    </>
                  ) : (
                    <span>Foglalás megerősítése</span>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                A "Foglalás megerősítése" gombra kattintva elfogadja az Általános Szerződési Feltételeket.
              </p>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Foglalás megerősítve!</h3>
              <p className="text-gray-600 mb-6">
                A foglalása sikeresen rögzítésre került. Visszaigazoló emailt küldtünk a következő címre: {formData.email}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Foglalási azonosító: <span className="font-mono font-bold">WL{Date.now().toString().slice(-8)}</span>
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:from-purple-500 hover:to-pink-400 transition-all"
              >
                Bezárás
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
