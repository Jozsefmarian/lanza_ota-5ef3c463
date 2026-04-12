import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Users, Search, Minus, Plus, Plane, Car, ArrowRightLeft, ChevronDown } from 'lucide-react';

interface SearchWidgetProps {
  onSearch?: (type: 'hotels' | 'flights' | 'cars', data: any) => void;
}

// Common IATA airport codes for quick suggestions
const POPULAR_AIRPORTS = [
  { code: 'BUD', city: 'Budapest', country: 'HU' },
  { code: 'ACE', city: 'Lanzarote', country: 'ES' },
  { code: 'BCN', city: 'Barcelona', country: 'ES' },
  { code: 'LPA', city: 'Gran Canaria', country: 'ES' },
  { code: 'TFS', city: 'Tenerife', country: 'ES' },
  { code: 'FUE', city: 'Fuerteventura', country: 'ES' },
  { code: 'PMI', city: 'Palma de Mallorca', country: 'ES' },
  { code: 'FCO', city: 'Róma', country: 'IT' },
  { code: 'CDG', city: 'Párizs', country: 'FR' },
  { code: 'LHR', city: 'London', country: 'GB' },
  { code: 'VIE', city: 'Bécs', country: 'AT' },
  { code: 'MUC', city: 'München', country: 'DE' },
  { code: 'ATH', city: 'Athén', country: 'GR' },
  { code: 'IST', city: 'Isztambul', country: 'TR' },
  { code: 'DUB', city: 'Dublin', country: 'IE' },
  { code: 'LIS', city: 'Lisszabon', country: 'PT' },
];

const SearchWidget: React.FC<SearchWidgetProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'hotels' | 'flights' | 'cars'>('hotels');


  // Hotel form states
  const [guestPickerOpen, setGuestPickerOpen] = useState(false);
  const [guests, setGuests] = useState({ adults: 2, children: 0, rooms: 1 });
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  // Flight form states
  const [flightOrigin, setFlightOrigin] = useState('BUD');
  const [flightDestination, setFlightDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [flightPassengers, setFlightPassengers] = useState({ adults: 1, children: 0, infants: 0 });
  const [flightPassengerPickerOpen, setFlightPassengerPickerOpen] = useState(false);
  const [tripClass, setTripClass] = useState<'Y' | 'C' | 'F' | 'W'>('Y');
  const [tripType, setTripType] = useState<'roundtrip' | 'oneway'>('roundtrip');

  // Airport suggestion states
  const [originSuggestions, setOriginSuggestions] = useState<typeof POPULAR_AIRPORTS>([]);
  const [destSuggestions, setDestSuggestions] = useState<typeof POPULAR_AIRPORTS>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [originInput, setOriginInput] = useState('Budapest (BUD)');
  const [destInput, setDestInput] = useState('');

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const guestPickerRef = useRef<HTMLDivElement>(null);
  const flightPassengerPickerRef = useRef<HTMLDivElement>(null);



  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setShowOriginSuggestions(false);
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setShowDestSuggestions(false);
      }
      if (guestPickerRef.current && !guestPickerRef.current.contains(e.target as Node)) {
        setGuestPickerOpen(false);
      }
      if (flightPassengerPickerRef.current && !flightPassengerPickerRef.current.contains(e.target as Node)) {
        setFlightPassengerPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filterAirports = (query: string) => {
    if (!query || query.length < 1) return POPULAR_AIRPORTS.slice(0, 8);
    const q = query.toLowerCase();
    return POPULAR_AIRPORTS.filter(
      a => a.code.toLowerCase().includes(q) || a.city.toLowerCase().includes(q)
    );
  };

  const handleOriginInputChange = (val: string) => {
    setOriginInput(val);
    setOriginSuggestions(filterAirports(val));
    setShowOriginSuggestions(true);
    // Extract IATA code if typed directly
    const upper = val.toUpperCase().trim();
    if (upper.length === 3 && POPULAR_AIRPORTS.some(a => a.code === upper)) {
      setFlightOrigin(upper);
    }
  };

  const handleDestInputChange = (val: string) => {
    setDestInput(val);
    setDestSuggestions(filterAirports(val));
    setShowDestSuggestions(true);
    const upper = val.toUpperCase().trim();
    if (upper.length === 3 && POPULAR_AIRPORTS.some(a => a.code === upper)) {
      setFlightDestination(upper);
    }
  };

  const selectOriginAirport = (airport: typeof POPULAR_AIRPORTS[0]) => {
    setFlightOrigin(airport.code);
    setOriginInput(`${airport.city} (${airport.code})`);
    setShowOriginSuggestions(false);
  };

  const selectDestAirport = (airport: typeof POPULAR_AIRPORTS[0]) => {
    setFlightDestination(airport.code);
    setDestInput(`${airport.city} (${airport.code})`);
    setShowDestSuggestions(false);
  };

  const swapAirports = () => {
    const tmpCode = flightOrigin;
    const tmpInput = originInput;
    setFlightOrigin(flightDestination);
    setOriginInput(destInput);
    setFlightDestination(tmpCode);
    setDestInput(tmpInput);
  };

  // Hotel search handler
  const handleHotelSearch = () => {
    const params = new URLSearchParams({
      destination: destination,
      checkin: checkIn,
      checkout: checkOut,
      adults: guests.adults.toString(),
    });
    navigate(`/search-results?${params.toString()}`);

    if (onSearch) {
      const searchData = {
        destination,
        checkIn,
        checkOut,
        guests: {
          adults: guests.adults,
          children: guests.children > 0 ? Array(guests.children).fill(10) : [],
        },
        rooms: guests.rooms
      };
      onSearch('hotels', searchData);
    }
  };

  // Flight search handler
  const handleFlightSearch = () => {
    if (!flightOrigin || !flightDestination || !departureDate) {
      return; // Basic validation
    }

    if (onSearch) {
      const searchData = {
        origin: flightOrigin,
        destination: flightDestination,
        departureDate,
        returnDate: tripType === 'roundtrip' ? returnDate : undefined,
        adults: flightPassengers.adults,
        children: flightPassengers.children,
        infants: flightPassengers.infants,
        tripClass,
        currency: 'EUR',
        locale: 'hu',
        marketCode: 'HU',
      };
      onSearch('flights', searchData);
    }
  };

  const updateGuests = (type: 'adults' | 'children' | 'rooms', delta: number) => {
    setGuests(prev => ({
      ...prev,
      [type]: Math.max(type === 'adults' ? 1 : type === 'rooms' ? 1 : 0, prev[type] + delta)
    }));
  };

  const updateFlightPassengers = (type: 'adults' | 'children' | 'infants', delta: number) => {
    setFlightPassengers(prev => {
      const newVal = prev[type] + delta;
      if (type === 'adults') return { ...prev, adults: Math.max(1, Math.min(9, newVal)), infants: Math.min(prev.infants, Math.max(1, Math.min(9, newVal))) };
      if (type === 'children') return { ...prev, children: Math.max(0, Math.min(6, newVal)) };
      if (type === 'infants') return { ...prev, infants: Math.max(0, Math.min(prev.adults, Math.min(6, newVal))) };
      return prev;
    });
  };

  const totalFlightPassengers = flightPassengers.adults + flightPassengers.children + flightPassengers.infants;

  const tripClassLabels: Record<string, string> = {
    'Y': 'Economy',
    'C': 'Business',
    'F': 'First',
    'W': 'Premium Economy',
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];
  const minCheckout = checkIn ? new Date(new Date(checkIn).getTime() + 86400000).toISOString().split('T')[0] : today;
  const minReturnDate = departureDate || today;

  const GuestPicker = () => (
    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
      {[
        { key: 'adults', label: 'Felnőttek', subtitle: '18 év felett' },
        { key: 'children', label: 'Gyermekek', subtitle: '0-17 év' },
        { key: 'rooms', label: 'Szobák', subtitle: '' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div>
            <p className="font-medium text-gray-900">{item.label}</p>
            {item.subtitle && <p className="text-sm text-gray-500">{item.subtitle}</p>}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateGuests(item.key as any, -1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{guests[item.key as keyof typeof guests]}</span>
            <button
              onClick={() => updateGuests(item.key as any, 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-purple-500 hover:text-purple-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={() => setGuestPickerOpen(false)}
        className="w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl"
      >
        Kész
      </button>
    </div>
  );

  const FlightPassengerPicker = () => (
    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 min-w-[280px]">
      {[
        { key: 'adults', label: 'Felnőttek', subtitle: '12+ év' },
        { key: 'children', label: 'Gyermekek', subtitle: '2-11 év' },
        { key: 'infants', label: 'Csecsemők', subtitle: '0-2 év' }
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div>
            <p className="font-medium text-gray-900">{item.label}</p>
            <p className="text-sm text-gray-500">{item.subtitle}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateFlightPassengers(item.key as any, -1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-pink-500 hover:text-pink-500 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{flightPassengers[item.key as keyof typeof flightPassengers]}</span>
            <button
              onClick={() => updateFlightPassengers(item.key as any, 1)}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-pink-500 hover:text-pink-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Trip class selector */}
      <div className="pt-3 mt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-2">Osztály</p>
        <div className="grid grid-cols-2 gap-2">
          {(['Y', 'W', 'C', 'F'] as const).map(cls => (
            <button
              key={cls}
              onClick={() => setTripClass(cls)}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                tripClass === cls
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-pink-300'
              }`}
            >
              {tripClassLabels[cls]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setFlightPassengerPickerOpen(false)}
        className="w-full mt-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl"
      >
        Kész
      </button>
    </div>
  );

  const AirportSuggestionList = ({ suggestions, onSelect }: { suggestions: typeof POPULAR_AIRPORTS; onSelect: (a: typeof POPULAR_AIRPORTS[0]) => void }) => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-60 overflow-y-auto">
      {suggestions.length === 0 ? (
        <div className="p-3 text-sm text-gray-500">Nincs találat. Írd be az IATA kódot (pl. ACE).</div>
      ) : (
        suggestions.map(airport => (
          <button
            key={airport.code}
            onClick={() => onSelect(airport)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 last:border-0"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{airport.city}</p>
                <p className="text-xs text-gray-500">{airport.country}</p>
              </div>
            </div>
            <span className="text-sm font-bold text-purple-600">{airport.code}</span>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Glassmorphism Container */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('hotels')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 font-semibold text-base transition-all ${
              activeTab === 'hotels'
                ? 'bg-white/10 text-white border-b-2 border-orange-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Szálláskeresés</span>
          </button>
          <button
            onClick={() => setActiveTab('flights')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 font-semibold text-base transition-all ${
              activeTab === 'flights'
                ? 'bg-white/10 text-white border-b-2 border-pink-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Plane className="w-5 h-5" />
            <span>Repülőjegy</span>
          </button>
          <button
            onClick={() => setActiveTab('cars')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 font-semibold text-base transition-all ${
              activeTab === 'cars'
                ? 'bg-white/10 text-white border-b-2 border-purple-400'
                : 'text-white/60 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Car className="w-5 h-5" />
            <span>Autóbérlés</span>
          </button>
        </div>

        {/* Hotel Search Form */}
        {activeTab === 'hotels' && (
          <div className="p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Destination */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Hová szeretne utazni?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Check In */}
              <div className="relative">
                <span className="absolute left-12 top-1 text-xs text-gray-500 pointer-events-none">
                  Érkezés
                </span>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full pl-12 pr-4 pt-5 pb-3 bg-white/90 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Check Out */}
              <div className="relative">
                <span className="absolute left-12 top-1 text-xs text-gray-500 pointer-events-none">
                  Távozás
                </span>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={checkOut}
                  min={minCheckout}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full pl-12 pr-4 pt-5 pb-3 bg-white/90 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Guests */}
              <div className="relative" ref={guestPickerRef}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                  <Users className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setGuestPickerOpen(!guestPickerOpen)}
                  className="w-full pl-12 pr-4 py-4 bg-white/90 rounded-xl text-gray-900 text-left focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                >
                  {guests.adults} felnőtt{guests.children > 0 ? `, ${guests.children} gyermek` : ''}, {guests.rooms} szoba
                </button>
                {guestPickerOpen && <GuestPicker />}
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleHotelSearch}
              className="w-full mt-4 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-400 hover:via-pink-400 hover:to-purple-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Szállás keresése</span>
            </button>
          </div>
        )}

        {/* Flight Search Form */}
        {activeTab === 'flights' && (
          <div className="p-4 lg:p-6">
            {/* Trip type toggle */}
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={() => setTripType('roundtrip')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tripType === 'roundtrip'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Oda-vissza
              </button>
              <button
                onClick={() => setTripType('oneway')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tripType === 'oneway'
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white/80'
                }`}
              >
                Csak oda
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3">
              {/* Origin */}
              <div className="relative lg:col-span-3" ref={originRef}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 z-10">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <input
                  type="text"
                  placeholder="Honnan? (pl. BUD)"
                  value={originInput}
                  onChange={(e) => handleOriginInputChange(e.target.value)}
                  onFocus={() => {
                    setOriginSuggestions(filterAirports(originInput));
                    setShowOriginSuggestions(true);
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
                {showOriginSuggestions && (
                  <AirportSuggestionList suggestions={originSuggestions} onSelect={selectOriginAirport} />
                )}
              </div>

              {/* Swap button */}
              <div className="hidden lg:flex lg:col-span-1 items-center justify-center">
                <button
                  onClick={swapAirports}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
                  title="Csere"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Destination */}
              <div className="relative lg:col-span-3" ref={destRef}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 z-10">
                  <Plane className="w-5 h-5 rotate-45" />
                </div>
                <input
                  type="text"
                  placeholder="Hová? (pl. ACE)"
                  value={destInput}
                  onChange={(e) => handleDestInputChange(e.target.value)}
                  onFocus={() => {
                    setDestSuggestions(filterAirports(destInput));
                    setShowDestSuggestions(true);
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-white/90 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
                {showDestSuggestions && (
                  <AirportSuggestionList suggestions={destSuggestions} onSelect={selectDestAirport} />
                )}
              </div>

              {/* Mobile swap button */}
              <div className="flex lg:hidden justify-center -my-1">
                <button
                  onClick={swapAirports}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all"
                  title="Csere"
                >
                  <ArrowRightLeft className="w-4 h-4 rotate-90" />
                </button>
              </div>

              {/* Departure Date */}
              <div className="relative lg:col-span-2">
                <span className="absolute left-12 top-1 text-xs text-gray-500 pointer-events-none">
                  Indulás
                </span>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  value={departureDate}
                  min={today}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full pl-12 pr-3 pt-5 pb-3 bg-white/90 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>

              {/* Return Date (only for roundtrip) */}
              {tripType === 'roundtrip' && (
                <div className="relative lg:col-span-2">
                  <span className="absolute left-12 top-1 text-xs text-gray-500 pointer-events-none">
                    Visszaút
                  </span>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <input
                    type="date"
                    value={returnDate}
                    min={minReturnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-12 pr-3 pt-5 pb-3 bg-white/90 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                  />
                </div>
              )}

              {/* Passengers */}
              <div className={`relative ${tripType === 'oneway' ? 'lg:col-span-3' : 'lg:col-span-1'}`} ref={flightPassengerPickerRef}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400">
                  <Users className="w-5 h-5" />
                </div>
                <button
                  onClick={() => setFlightPassengerPickerOpen(!flightPassengerPickerOpen)}
                  className="w-full pl-12 pr-4 py-4 bg-white/90 rounded-xl text-gray-900 text-left focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all text-sm"
                >
                  <span className="block truncate">
                    {totalFlightPassengers} utas
                  </span>
                </button>
                {flightPassengerPickerOpen && <FlightPassengerPicker />}
              </div>
            </div>

            {/* Search Button */}
            <button
              onClick={handleFlightSearch}
              disabled={!flightOrigin || !flightDestination || !departureDate}
              className="w-full mt-4 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-400 hover:via-purple-400 hover:to-indigo-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-5 h-5" />
              <span>Repülőjegy keresése</span>
            </button>
          </div>
        )}
      </div>

      {/* Info text */}
      <p className="text-center text-white/60 text-sm mt-4">
        {activeTab === 'hotels'
          ? 'Több mint 2.9 millió szállás világszerte • Legjobb árak garantálva'
          : '500+ légitársaság • Valós idejű árak • Biztonságos foglalás'
        }
      </p>
    </div>
  );
};

export default SearchWidget;
