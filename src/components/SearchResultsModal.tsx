import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from "react-router-dom";
import { X, Loader2, Star, MapPin, Building2, Coffee, Wifi, Check, Plane, ArrowUpDown } from 'lucide-react';

import { searchHotelsPage, searchFlights } from '../lib/api';
import type { SearchPageParams, SearchPageResult, FlightSearchParams, FlightOption, FlightSearchResult } from '../lib/api';
import FlightCard from './FlightCard';
import CarCard from './CarCard';

interface SearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchType: 'hotels' | 'flights' | 'cars';
  searchParams: any;
  onSelect: (item: any, type: 'hotel' | 'flight' | 'car') => void;
}

type FlightSortKey = 'price' | 'duration' | 'departure' | 'stops';

const SearchResultsModal: React.FC<SearchResultsModalProps> = ({
  isOpen,
  onClose,
  searchType,
  searchParams,
  onSelect
}) => {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHotels, setTotalHotels] = useState(0);
  const location = useLocation();

  // Flight-specific state
  const [flightResults, setFlightResults] = useState<FlightOption[]>([]);
  const [flightSortBy, setFlightSortBy] = useState<FlightSortKey>('price');
  const [flightSortAsc, setFlightSortAsc] = useState(true);
  const [flightFilterStops, setFlightFilterStops] = useState<number | null>(null); // null = all
  const [flightSearchMeta, setFlightSearchMeta] = useState<{ searchId?: string; resultsUrl?: string; totalResults?: number }>({});

  const readCurrencyFromUrl = () => {
    const p1 = new URLSearchParams(location.search);
    const c1 = p1.get("currency");
    const hash = window.location.hash || "";
    const qIndex = hash.indexOf("?");
    const hashQuery = qIndex >= 0 ? hash.slice(qIndex + 1) : "";
    const p2 = new URLSearchParams(hashQuery);
    const c2 = p2.get("currency");
    const c = c1 || c2;
    const fromUrl = (c === "EUR" || c === "USD" || c === "HUF" || c === "GBP") ? c : null;
    if (fromUrl) return fromUrl;
    const fromLs = localStorage.getItem("lanza_currency");
    return (fromLs === "EUR" || fromLs === "USD" || fromLs === "HUF" || fromLs === "GBP") ? fromLs : "EUR";
  };

  const [currency, setCurrency] = useState<"EUR" | "USD" | "HUF" | "GBP">(readCurrencyFromUrl() as any);

  // Trigger search when modal opens
  useEffect(() => {
    if (isOpen && searchType === 'hotels') {
      performHotelSearch(1);
    }
    if (isOpen && searchType === 'flights') {
      performFlightSearch();
    }
    if (isOpen && searchType === 'cars') {
    performFlightSearch(); 
    }
  }, [isOpen, searchType, searchParams]);

  // Currency sync
  useEffect(() => {
    const sync = (e: any) => {
      const next = e?.detail?.currency;
      if (next === "EUR" || next === "USD" || next === "HUF" || next === "GBP") {
        localStorage.setItem("lanza_currency", next);
        setCurrency(next);
      } else {
        setCurrency(readCurrencyFromUrl() as any);
      }
    };
    window.addEventListener("lanza:currencyChanged", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("lanza:currencyChanged", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [location.search]);

  // Hotel search
  const performHotelSearch = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const apiParams: SearchPageParams = {
        destination: searchParams.destination || 'Budapest',
        checkin: searchParams.checkIn,
        checkout: searchParams.checkOut,
        guests: [{
          adults: searchParams.guests?.adults || 2,
          children: searchParams.guests?.children || []
        }],
        currency: currency,
        language: 'hu',
        residency: 'hu',
        page: page,
        pageSize: 10
      };
      const response = await searchHotelsPage(apiParams);
      if (response.success && response.hotels) {
        setResults(response.hotels);
        setCurrentPage(response.page || 1);
        setTotalPages(response.totalPages || 1);
        setTotalHotels(response.totalHotels || 0);
      } else {
        setError(response.error || 'A keresés sikertelen volt');
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt a keresés során');
    } finally {
      setLoading(false);
    }
  };

  // Flight search
  const performFlightSearch = async () => {
    setLoading(true);
    setError(null);
    setFlightResults([]);
    setFlightSearchMeta({});

    try {
      const apiParams: FlightSearchParams = {
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureDate: searchParams.departureDate,
        returnDate: searchParams.returnDate || undefined,
        adults: searchParams.adults || 1,
        children: searchParams.children || 0,
        infants: searchParams.infants || 0,
        currency: searchParams.currency || currency || 'EUR',
        locale: searchParams.locale || 'hu',
        marketCode: searchParams.marketCode || 'HU',
        tripClass: searchParams.tripClass || 'Y',
      };

      const response: FlightSearchResult = await searchFlights(apiParams);

      if (response.success && response.flights && response.flights.length > 0) {
        setFlightResults(response.flights);
        setFlightSearchMeta({
          searchId: response.searchId,
          resultsUrl: response.resultsUrl,
          totalResults: response.totalResults,
        });
      } else if (response.success && (!response.flights || response.flights.length === 0)) {
        setError('Nem találtunk járatot a megadott feltételekkel. Próbálj más dátumot vagy útvonalat.');
      } else {
        setError(response.error || response.message || 'A járatkeresés sikertelen volt.');
      }
    } catch (err: any) {
      setError(err.message || 'Hiba történt a járatkeresés során');
    } finally {
      setLoading(false);
    }
  };

  // Sorted & filtered flights
  const sortedFlights = useMemo(() => {
    let filtered = [...flightResults];

    // Filter by stops
    if (flightFilterStops !== null) {
      filtered = filtered.filter(f => f.stops <= flightFilterStops);
    }

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (flightSortBy) {
        case 'price':
          cmp = a.price - b.price;
          break;
        case 'duration':
          cmp = a.durationMinutes - b.durationMinutes;
          break;
        case 'departure':
          cmp = new Date(a.departureLocal).getTime() - new Date(b.departureLocal).getTime();
          break;
        case 'stops':
          cmp = a.stops - b.stops;
          break;
      }
      return flightSortAsc ? cmp : -cmp;
    });

    return filtered;
  }, [flightResults, flightSortBy, flightSortAsc, flightFilterStops]);

  // Stats for flight filters
  const flightStats = useMemo(() => {
    if (flightResults.length === 0) return { directCount: 0, oneStopCount: 0, multiStopCount: 0, minPrice: 0, maxPrice: 0 };
    return {
      directCount: flightResults.filter(f => f.stops === 0).length,
      oneStopCount: flightResults.filter(f => f.stops === 1).length,
      multiStopCount: flightResults.filter(f => f.stops >= 2).length,
      minPrice: Math.min(...flightResults.map(f => f.price)),
      maxPrice: Math.max(...flightResults.map(f => f.price)),
    };
  }, [flightResults]);

  if (!isOpen) return null;

  const handleSelectRate = (hotel: any, rate: any) => {
    onSelect({
      ...hotel,
      ...rate,
      hotelId: hotel.id,
      hotelName: hotel.name,
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut
    }, 'hotel');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      performHotelSearch(newPage);
    }
  };

  const handleFlightSort = (key: FlightSortKey) => {
    if (flightSortBy === key) {
      setFlightSortAsc(!flightSortAsc);
    } else {
      setFlightSortBy(key);
      setFlightSortAsc(true);
    }
  };

  const formatFlightSearchSummary = () => {
    const origin = searchParams.origin || '?';
    const dest = searchParams.destination || '?';
    const depDate = searchParams.departureDate || '';
    const retDate = searchParams.returnDate;
    const pax = (searchParams.adults || 1) + (searchParams.children || 0) + (searchParams.infants || 0);
    return `${origin} → ${dest} | ${depDate}${retDate ? ` - ${retDate}` : ' (csak oda)'} | ${pax} utas`;
  };

  // ========== RENDER ==========

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`sticky top-0 p-6 text-white z-10 ${
          searchType === 'flights'
            ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600'
            : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            {searchType === 'flights' ? (
              <Plane className="w-6 h-6" />
            ) : (
              <Building2 className="w-6 h-6" />
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {searchType === 'flights' ? 'Repülőjegy találatok' : 'Szállások keresése'}
              </h2>
              <p className="text-white/80 text-sm">
                {searchType === 'flights'
                  ? formatFlightSearchSummary()
                  : `${searchParams.destination} | ${searchParams.checkIn} - ${searchParams.checkOut}`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ===== FLIGHTS ===== */}
          {searchType === 'flights' && (
            <>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative">
                    <Loader2 className="w-14 h-14 text-pink-600 animate-spin" />
                    <Plane className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-gray-700 font-medium mt-6">Járatok keresése folyamatban...</p>
                  <p className="text-gray-400 text-sm mt-2">Ez akár 15-30 másodpercig is eltarthat</p>
                  <div className="mt-4 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-600 font-medium mb-2">Keresési hiba</p>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
                  <button
                    onClick={performFlightSearch}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-400 hover:to-purple-500 transition-colors font-medium"
                  >
                    Újrapróbálás
                  </button>
                </div>
              ) : sortedFlights.length === 0 && flightResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plane className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium mb-2">Nem találtunk járatot</p>
                  <p className="text-gray-400 text-sm max-w-md mx-auto">Próbálj más dátumokat vagy útvonalat választani.</p>
                </div>
              ) : (
                <div className="p-4 lg:p-6">
                  {/* Flight toolbar: sort + filter */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <p className="text-gray-600 text-sm">
                      <span className="font-semibold text-gray-900">{sortedFlights.length}</span> járat
                      {flightFilterStops !== null && ` (szűrve: max ${flightFilterStops} átszállás)`}
                      {flightSearchMeta.totalResults && flightSearchMeta.totalResults > flightResults.length && (
                        <span className="text-gray-400"> / összesen {flightSearchMeta.totalResults}</span>
                      )}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Stop filter chips */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setFlightFilterStops(null)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                            flightFilterStops === null
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          Mind ({flightResults.length})
                        </button>
                        {flightStats.directCount > 0 && (
                          <button
                            onClick={() => setFlightFilterStops(0)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                              flightFilterStops === 0
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                            }`}
                          >
                            Közvetlen ({flightStats.directCount})
                          </button>
                        )}
                        {flightStats.oneStopCount > 0 && (
                          <button
                            onClick={() => setFlightFilterStops(1)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                              flightFilterStops === 1
                                ? 'bg-orange-500 text-white border-orange-500'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            Max 1 átszállás ({flightStats.directCount + flightStats.oneStopCount})
                          </button>
                        )}
                      </div>

                      {/* Sort buttons */}
                      <div className="flex items-center gap-1.5 ml-2">
                        {([
                          { key: 'price' as FlightSortKey, label: 'Ár' },
                          { key: 'duration' as FlightSortKey, label: 'Időtartam' },
                          { key: 'departure' as FlightSortKey, label: 'Indulás' },
                          { key: 'stops' as FlightSortKey, label: 'Átszállás' },
                        ]).map(({ key, label }) => (
                          <button
                            key={key}
                            onClick={() => handleFlightSort(key)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all flex items-center gap-1 ${
                              flightSortBy === key
                                ? 'bg-pink-50 text-pink-700 border-pink-300'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-pink-200'
                            }`}
                          >
                            {label}
                            {flightSortBy === key && (
                              <ArrowUpDown className="w-3 h-3" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Flight results list */}
                  <div className="space-y-4">
                    {sortedFlights.map((flight) => (
                      <FlightCard
                        key={flight.id}
                        flight={flight}
                        onSelect={(f) => onSelect(f, 'flight')}
                      />
                    ))}
                  </div>

                  {/* No results after filter */}
                  {sortedFlights.length === 0 && flightResults.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Nincs járat a szűrőknek megfelelően.</p>
                      <button
                        onClick={() => setFlightFilterStops(null)}
                        className="mt-3 text-purple-600 font-medium text-sm hover:text-purple-700"
                      >
                        Szűrők törlése
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ===== HOTELS ===== */}
          {searchType === 'hotels' && (
            <div className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600">Szállások keresése folyamatban...</p>
                  <p className="text-gray-400 text-sm mt-2">A legjobb ajánlatokat keressük Önnek</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <p className="text-red-500 mb-4">{error}</p>
                  <button
                    onClick={() => performHotelSearch(1)}
                    className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Újrapróbálás
                  </button>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-2">Nem találtunk szállást a megadott feltételekkel.</p>
                  <p className="text-gray-400 text-sm">Próbáljon más dátumokat vagy úti célt választani.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-gray-600 text-sm">
                    {totalHotels} szállás található (Oldal {currentPage}/{totalPages})
                  </p>
                  
                  {results.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
                    >
                      {/* Hotel Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">{hotel.name}</h3>
                            <div className="flex items-center mt-1">
                              {[...Array(hotel.starRating || 0)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rates */}
                      <div className="divide-y divide-gray-100">
                        {hotel.rates?.slice(0, 3).map((rate: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleSelectRate(hotel, rate)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{rate.roomName}</p>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                  {rate.hasBreakfast && (
                                    <span className="flex items-center space-x-1 text-green-600">
                                      <Coffee className="w-4 h-4" />
                                      <span>Reggelivel</span>
                                    </span>
                                  )}
                                  {rate.freeCancellation && (
                                    <span className="flex items-center space-x-1 text-green-600">
                                      <Check className="w-4 h-4" />
                                      <span>Ingyenes lemondás</span>
                                    </span>
                                  )}
                                  {rate.amenities?.includes('wifi') && (
                                    <span className="flex items-center space-x-1">
                                      <Wifi className="w-4 h-4" />
                                      <span>WiFi</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-purple-600">
                                  {rate.price} {rate.currency}
                                </p>
                                <p className="text-sm text-gray-500">teljes ár</p>
                                <button className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-pink-400 transition-all">
                                  Kiválasztás
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {hotel.rates?.length > 3 && (
                        <div className="p-3 bg-gray-50 text-center">
                          <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
                            + {hotel.rates.length - 3} további szoba opció
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center space-x-2 pt-4">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Előző
                      </button>
                      <span className="px-4 py-2 text-gray-600">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Következő
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsModal;
