import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { SlidersHorizontal, TrendingUp, Building2, ArrowRight, Plane, Car } from 'lucide-react';
import Header from './Header';
import AppBanner from './AppBanner';
import SearchWidget from './SearchWidget';
import DestinationCard from './DestinationCard';
import HotelCard from './HotelCard';
import CategoryFilter from './CategoryFilter';
import DealsSection from './DealsSection';
import TestimonialsSection from './TestimonialsSection';
import AuthModal from './AuthModal';
import BookingModal from './BookingModal';
import FilterSidebar from './FilterSidebar';
import LiveBookingNotification from './LiveBookingNotification';
import SearchResultsModal from './SearchResultsModal';
import UserDashboard from './UserDashboard';
import Footer from './Footer';
import CarCard from './CarCard';
import PackageBuilder from './PackageBuilder';
import { images, categories } from '../data/images';
import { User, getStoredUser, syncWishlist, getWishlist, saveBooking, saveSearch } from '../lib/auth';








const AppLayout: React.FC = () => {
  // Auth state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState<number>(116);

  useLayoutEffect(() => {
    const el = stickyHeaderRef.current;
    if (!el) return;
    const update = () => setStickyHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [bannerVisible]);

  const [user, setUser] = useState<User | null>(null);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // Booking state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<any>(null);
  const [bookingType, setBookingType] = useState<'hotel' | 'flight' | 'car'>('hotel');

  // Search results modal
  const [searchResultsOpen, setSearchResultsOpen] = useState(false);
  const [searchType, setSearchType] = useState<'hotels' | 'flights' | 'cars'>('hotels');
  const [searchParams, setSearchParams] = useState<any>({});

  // Filter state
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [filters, setFilters] = useState({
    priceRange: [0, 2000] as [number, number],
    starRating: [] as number[],
    amenities: [] as string[],
    categories: [] as string[]
  });

  // Wishlist & Cart
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [cart, setCart] = useState<any[]>([]);



  // Load user on mount
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      // Load user's wishlist
      loadUserWishlist(storedUser.id);
    }
  }, []);
  const loadUserWishlist = async (userId: string) => {
    const items = await getWishlist(userId);
    const ids = items.map(item => item.type === 'hotel' ? item.id + 100 : item.id);
    setWishlist(ids);
  };

  // Sync wishlist when it changes (for logged in users)
  useEffect(() => {
    if (user) {
      const items = wishlist.map(id => {
        if (id > 100) {
          const hotel = images.hotels.find(h => h.id === id - 100);
          return {
            type: 'hotel',
            id: id - 100,
            data: hotel
          };
        } else {
          const dest = images.destinations.find(d => d.id === id);
          return {
            type: 'destination',
            id,
            data: dest
          };
        }
      });
      syncWishlist(user.id, items);
    }
  }, [wishlist, user]);

  // Filter destinations
  const filteredDestinations = useMemo(() => {
    return images.destinations.filter(dest => {
      if (activeCategory !== 'all' && dest.category !== activeCategory) return false;
      if (dest.price < filters.priceRange[0] || dest.price > filters.priceRange[1]) return false;
      if (filters.categories.length > 0 && !filters.categories.includes(dest.category)) return false;
      return true;
    });
  }, [activeCategory, filters]);

  // Handlers
  const handleAuthSuccess = (authUser: User) => {
    setUser(authUser);
    loadUserWishlist(authUser.id);
  };
  const handleLogout = () => {
    setUser(null);
    setWishlist([]);
  };
  const handleSearch = (type: 'hotels' | 'flights' | string, data: any) => {
    console.log('Keresés:', type, data);

    // Open search results modal for API search
    if (type === 'hotels' || type === 'flights' || type === 'cars') {
      setSearchType(type as 'hotels' | 'flights' | 'cars');
      setSearchParams(data);
      setSearchResultsOpen(true);

      // Save search for logged in users
      if (user) {
        const label = type === 'flights'
          ? `${type} - ${data.origin} → ${data.destination}`
          : `${type} - ${data.destination}`;
        saveSearch(user.id, label, type, data);
      }
    } else {
      // For packages, scroll to section
      const section = document.getElementById(type);
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
  };

  const handleSearchResultSelect = (item: any, type: 'hotel' | 'flight' | 'car') => {
    setSearchResultsOpen(false);
    setBookingItem(item);
    setBookingType(type);
    setBookingModalOpen(true);
  };
  const handleWishlistToggle = (id: number) => {
    setWishlist(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const handleDestinationClick = (destination: any) => {
    console.log('Úticél kiválasztva:', destination);
  };
  const handleBookHotel = (hotel: any) => {
    setBookingItem(hotel);
    setBookingType('hotel');
    setBookingModalOpen(true);
  };
  const handleSelectFlight = (flight: any) => {
    setBookingItem(flight);
    setBookingType('flight');
    setBookingModalOpen(true);
  };
  const handleRentCar = (car: any) => {
    setBookingItem(car);
    setBookingType('car');
    setBookingModalOpen(true);
  };
  const handleBookingConfirm = async (bookingData: any) => {
    console.log('Foglalás megerősítve:', bookingData);
    setCart(prev => [...prev, bookingData]);

    // Save booking for logged in users
    if (user) {
      await saveBooking(user.id, {
        type: bookingType,
        item: bookingItem,
        ...bookingData
      });
    }
  };
  const handleBuildPackage = (packageData: any) => {
    console.log('Csomag összeállítva:', packageData);
    setBookingItem(packageData);
    setBookingType('hotel');
    setBookingModalOpen(true);
  };
  const handleDealClick = (deal: any) => {
    console.log('Ajánlat kiválasztva:', deal);
    setBookingItem({
      ...deal,
      price: deal.dealPrice
    });
    setBookingType('hotel');
    setBookingModalOpen(true);
  };
  const handleRunSavedSearch = (type: string, params: any) => {
    setSearchType(type as 'hotels' | 'flights' | 'cars');
    setSearchParams(params);
    setSearchResultsOpen(true);
  };
  return <div className="min-h-screen bg-gray-50">
      {/* Sticky csoport: promóciós banner + fejléc együtt */}
      <div ref={stickyHeaderRef} className="fixed top-0 left-0 right-0 z-50">
        {bannerVisible && <AppBanner onClose={() => setBannerVisible(false)} />}
        <Header user={user} onAuthClick={() => setAuthModalOpen(true)} onDashboardClick={() => setDashboardOpen(true)} cartCount={cart.length} wishlistCount={wishlist.length} />
      </div>

      {/* Spacer = fix fejléc tényleges magassága, hogy ne maradjon fehér rés */}
      <div style={{ height: stickyHeight }} aria-hidden="true" />

      {/* Hero Szekció */}
      <section className="relative w-full flex flex-col items-center justify-start">
        {/* Háttérkép - rögzített, nem mozdul a tab váltáskor */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
          <img src={images.hero} alt="Utazási célpont" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-purple-900/50 to-slate-900/80" />
        </div>

        {/* Tartalom */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-12">
            <span className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
              <TrendingUp className="w-4 h-4" />
              <span>Powered by Lanzaventura</span>
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              A következő kalandod
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                itt kezdődik
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto mb-8">Fedezd fel a legcsodálatosabb úticélokat, foglalj repülőjegyet, szállást, autót - minden egy helyen.</p>
          </div>

          {/* Kereső Widget */}
          <SearchWidget onSearch={handleSearch} />

          {/* Gyors Statisztikák */}
          <div className="flex flex-wrap justify-center gap-8 mt-12">
            {[{
            value: '2.9M+',
            label: 'Szállás'
          }, {
            value: '500+',
            label: 'Légitársaság'
          }, {
            value: '150+',
            label: 'Ország'
          }, {
            value: '15%',
            label: 'Átl. megtakarítás'
          }].map((stat, index) => <div key={index} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>)}
          </div>
        </div>

        {/* Görgetés Jelző */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/60 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Népszerű Úticélok */}
      <section id="destinations" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-8">
            <div>
              <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
                Felfedezés
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Népszerű úticélok
              </h2>
              <p className="text-gray-600">
                Fedezd fel a legkeresettebb helyeket, ahová az utazók most foglalnak
              </p>
            </div>
            <button onClick={() => setFilterSidebarOpen(true)} className="mt-4 lg:mt-0 inline-flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all lg:hidden">
              <SlidersHorizontal className="w-5 h-5" />
              <span>Szűrők</span>
            </button>
          </div>

          <div className="mb-8">
            <CategoryFilter categories={categories} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDestinations.map(destination => <DestinationCard key={destination.id} destination={destination} isWishlisted={wishlist.includes(destination.id)} onWishlistToggle={handleWishlistToggle} onClick={handleDestinationClick} />)}
          </div>

          {filteredDestinations.length === 0 && <div className="text-center py-12">
              <p className="text-gray-500">Nincs találat a szűrőknek megfelelően. Próbáld módosítani a szűrőket.</p>
            </div>}
        </div>
      </section>

      {/* Villámajánlatok */}
      <section id="deals" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DealsSection onDealClick={handleDealClick} />
        </div>
      </section>

      {/* Szállások Szekció */}
      <section id="hotels" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Building2 className="w-6 h-6 text-purple-600" />
                <span className="text-purple-600 font-medium">Szállások</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Kiemelt szálláshelyek
              </h2>
            </div>
            <button className="hidden sm:flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium">
              <span>Összes megtekintése</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.hotels.map(hotel => <HotelCard key={hotel.id} hotel={hotel} isWishlisted={wishlist.includes(hotel.id + 100)} onWishlistToggle={id => handleWishlistToggle(id + 100)} onBook={handleBookHotel} />)}
          </div>
        </div>
      </section>

      {/* Repülőjáratok Szekció */}
      <section id="flights" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Plane className="w-6 h-6 text-pink-600" />
                <span className="text-pink-600 font-medium">Repülőjáratok</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Népszerű útvonalak
              </h2>
              <p className="text-gray-600 mt-2">Válassz egy népszerű útvonalat, vagy használd a keresőt fent a "Repülőjegy" fülön.</p>
            </div>
          </div>

          {/* Popular routes grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { from: 'BUD', fromCity: 'Budapest', to: 'ACE', toCity: 'Lanzarote', img: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=400&h=200&fit=crop' },
              { from: 'BUD', fromCity: 'Budapest', to: 'TFS', toCity: 'Tenerife', img: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=400&h=200&fit=crop' },
              { from: 'BUD', fromCity: 'Budapest', to: 'BCN', toCity: 'Barcelona', img: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&h=200&fit=crop' },
              { from: 'BUD', fromCity: 'Budapest', to: 'LPA', toCity: 'Gran Canaria', img: 'https://images.unsplash.com/photo-1500259571355-332da5cb07aa?w=400&h=200&fit=crop' },
              { from: 'BUD', fromCity: 'Budapest', to: 'PMI', toCity: 'Mallorca', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=200&fit=crop' },
              { from: 'BUD', fromCity: 'Budapest', to: 'ATH', toCity: 'Athén', img: 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&h=200&fit=crop' },
            ].map((route, idx) => {
              // Calculate a date 14 days from now for the default departure
              const depDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
              const retDate = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];

              return (
                <button
                  key={idx}
                  onClick={() => handleSearch('flights', {
                    origin: route.from,
                    destination: route.to,
                    departureDate: depDate,
                    returnDate: retDate,
                    adults: 1,
                    children: 0,
                    infants: 0,
                    tripClass: 'Y',
                    currency: 'EUR',
                    locale: 'hu',
                    marketCode: 'HU',
                  })}
                  className="group relative overflow-hidden rounded-2xl h-40 text-left"
                >
                  <img
                    src={route.img}
                    alt={`${route.fromCity} → ${route.toCity}`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center space-x-2 text-white">
                      <span className="font-bold text-lg">{route.fromCity}</span>
                      <Plane className="w-4 h-4 text-pink-300" />
                      <span className="font-bold text-lg">{route.toCity}</span>
                    </div>
                    <p className="text-white/70 text-xs mt-1">{route.from} → {route.to} • Kattints a kereséshez</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 text-center border border-pink-100">
            <Plane className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Keress repülőjegyet valós időben</h3>
            <p className="text-gray-600 max-w-lg mx-auto mb-4">500+ légitársaság járatai között keresgélhetsz. Válts a "Repülőjegy" fülre a fenti keresőben.</p>
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-xl hover:from-pink-400 hover:to-purple-500 transition-all shadow-lg shadow-pink-500/30"
            >
              Repülőjegy keresése
            </button>
          </div>
        </div>
      </section>




      {/* Autóbérlés Szekció */}
      <section id="cars" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Car className="w-6 h-6 text-orange-600" />
                <span className="text-orange-600 font-medium">Autóbérlés</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                Bérelj autót
              </h2>
            </div>
            <button className="hidden sm:flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-medium">
              <span>Összes megtekintése</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {images.cars.map(car => <CarCard key={car.id} car={car} onRent={handleRentCar} />)}
          </div>
        </div>
      </section>

      {/* Csomag Összeállító */}
      <section id="packages" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PackageBuilder onBuildPackage={handleBuildPackage} />
        </div>
      </section>

      {/* Vélemények */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TestimonialsSection />
        </div>
      </section>

      {/* Lábléc */}
      <Footer />

      {/* Modálok */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />

      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} item={bookingItem} type={bookingType} onConfirm={handleBookingConfirm} />

      <FilterSidebar isOpen={filterSidebarOpen} onClose={() => setFilterSidebarOpen(false)} filters={filters} onFilterChange={setFilters} type="destinations" />

      <SearchResultsModal isOpen={searchResultsOpen} onClose={() => setSearchResultsOpen(false)} searchType={searchType} searchParams={searchParams} onSelect={handleSearchResultSelect} />

      {user && <UserDashboard isOpen={dashboardOpen} onClose={() => setDashboardOpen(false)} user={user} onLogout={handleLogout} onRunSearch={handleRunSavedSearch} />}

      {/* Élő Foglalási Értesítések */}
      <LiveBookingNotification />
    </div>;
};
export default AppLayout;
