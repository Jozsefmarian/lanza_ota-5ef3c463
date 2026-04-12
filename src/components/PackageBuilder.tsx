import React, { useState } from 'react';
import { Building2, Plane, Car, Check, Plus, Minus, Sparkles } from 'lucide-react';
import { images } from '../data/images';

interface PackageBuilderProps {
  onBuildPackage: (packageData: any) => void;
}

const PackageBuilder: React.FC<PackageBuilderProps> = ({ onBuildPackage }) => {
  const [selectedHotel, setSelectedHotel] = useState<number | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedCar, setSelectedCar] = useState<number | null>(null);
  const [nights, setNights] = useState(3);

  const hotels = images.hotels.slice(0, 3);
  const cars = images.cars.slice(0, 3);

  const flightOptions = [
    { id: 1, route: 'Budapest → Barcelona', price: 89, airline: 'Wizz Air' },
    { id: 2, route: 'Budapest → London', price: 75, airline: 'Ryanair' },
    { id: 3, route: 'Budapest → Párizs', price: 120, airline: 'Air France' },
  ];

  const calculateTotal = () => {
    let total = 0;
    if (selectedHotel !== null) {
      const hotel = hotels.find(h => h.id === selectedHotel);
      if (hotel) total += hotel.price * nights;
    }
    if (selectedFlight !== null) {
      const flight = flightOptions.find(f => f.id === selectedFlight);
      if (flight) total += flight.price;
    }
    if (selectedCar !== null) {
      const car = cars.find(c => c.id === selectedCar);
      if (car) total += car.price * nights;
    }
    return total;
  };

  const calculateDiscount = () => {
    const itemsSelected = [selectedHotel, selectedFlight, selectedCar].filter(Boolean).length;
    if (itemsSelected >= 3) return 0.15;
    if (itemsSelected >= 2) return 0.10;
    return 0;
  };

  const total = calculateTotal();
  const discount = calculateDiscount();
  const finalPrice = total * (1 - discount);

  const handleBuildPackage = () => {
    onBuildPackage({
      hotel: selectedHotel ? hotels.find(h => h.id === selectedHotel) : null,
      flight: selectedFlight ? flightOptions.find(f => f.id === selectedFlight) : null,
      car: selectedCar ? cars.find(c => c.id === selectedCar) : null,
      nights,
      total: finalPrice,
      discount: discount * 100
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 lg:p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Állítsd össze álomcsomagodat</h3>
          <p className="text-white/60">Kombináld és spórolj akár 15%-ot</p>
        </div>
      </div>

      {/* Időtartam választó */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">Utazás időtartama</span>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setNights(Math.max(1, nights - 1))}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-white font-bold text-xl w-16 text-center">{nights} éj</span>
            <button
              onClick={() => setNights(nights + 1)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Szállások */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Building2 className="w-5 h-5 text-orange-400" />
            <span className="text-white font-medium">Válassz szállást</span>
          </div>
          <div className="space-y-2">
            {hotels.map((hotel) => (
              <button
                key={hotel.id}
                onClick={() => setSelectedHotel(selectedHotel === hotel.id ? null : hotel.id)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedHotel === hotel.id
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{hotel.name}</p>
                    <p className={`text-sm ${selectedHotel === hotel.id ? 'text-gray-500' : 'text-white/60'}`}>
                      {hotel.price} €/éj
                    </p>
                  </div>
                  {selectedHotel === hotel.id && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Repülőjáratok */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Plane className="w-5 h-5 text-pink-400" />
            <span className="text-white font-medium">Válassz járatot</span>
          </div>
          <div className="space-y-2">
            {flightOptions.map((flight) => (
              <button
                key={flight.id}
                onClick={() => setSelectedFlight(selectedFlight === flight.id ? null : flight.id)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedFlight === flight.id
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{flight.route}</p>
                    <p className={`text-sm ${selectedFlight === flight.id ? 'text-gray-500' : 'text-white/60'}`}>
                      {flight.price} € • {flight.airline}
                    </p>
                  </div>
                  {selectedFlight === flight.id && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Autóbérlés */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Car className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Adj hozzá autóbérlést</span>
          </div>
          <div className="space-y-2">
            {cars.map((car) => (
              <button
                key={car.id}
                onClick={() => setSelectedCar(selectedCar === car.id ? null : car.id)}
                className={`w-full p-3 rounded-xl text-left transition-all ${
                  selectedCar === car.id
                    ? 'bg-white text-gray-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{car.name}</p>
                    <p className={`text-sm ${selectedCar === car.id ? 'text-gray-500' : 'text-white/60'}`}>
                      {car.price} €/nap
                    </p>
                  </div>
                  {selectedCar === car.id && (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center ml-2">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Összesítő */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            {discount > 0 && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                  {discount * 100}% KEDVEZMÉNY
                </span>
                <span className="text-white/60 line-through">{total.toFixed(0)} €</span>
              </div>
            )}
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-white">{finalPrice.toFixed(0)} €</span>
              <span className="text-white/60">teljes csomag</span>
            </div>
          </div>
          <button
            onClick={handleBuildPackage}
            disabled={!selectedHotel && !selectedFlight && !selectedCar}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-400 hover:to-pink-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
          >
            Csomag foglalása
          </button>
        </div>
      </div>
    </div>
  );
};

export default PackageBuilder;
