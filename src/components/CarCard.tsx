import React from 'react';
import { Users, Cog, Navigation, Music } from 'lucide-react';

interface Car {
  id: number;
  name: string;
  image: string;
  price: number;
  type: string;
  seats: number;
  transmission: string;
  features: string[];
}

interface CarCardProps {
  car: Car;
  onRent: (car: Car) => void;
}

const featureIcons: Record<string, React.ReactNode> = {
  'GPS': <Navigation className="w-4 h-4" />,
  'Premium Audio': <Music className="w-4 h-4" />,
  'Premium Sound': <Music className="w-4 h-4" />,
  'Navigáció': <Navigation className="w-4 h-4" />,
  'Prémium hangrendszer': <Music className="w-4 h-4" />,
};

const transmissionLabels: Record<string, string> = {
  'Automatic': 'Automata',
  'Manual': 'Manuális',
};

const CarCard: React.FC<CarCardProps> = ({ car, onRent }) => {
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Kép */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        <img
          src={car.image}
          alt={car.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Típus Badge */}
        <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-white text-xs font-bold">
          {car.type}
        </div>
      </div>

      {/* Tartalom */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{car.name}</h3>
        
        {/* Specifikációk */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center space-x-1 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{car.seats} fő</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-600">
            <Cog className="w-4 h-4" />
            <span className="text-sm">{transmissionLabels[car.transmission] || car.transmission}</span>
          </div>
        </div>

        {/* Felszereltség */}
        <div className="flex flex-wrap gap-2 mb-4">
          {car.features.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-600"
            >
              {featureIcons[feature] || null}
              <span>{feature}</span>
            </span>
          ))}
        </div>

        {/* Ár & Bérlés */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <span className="text-sm text-gray-500">naponta</span>
            <p className="text-2xl font-bold text-gray-900">{car.price} €</p>
          </div>
          <button
            onClick={() => onRent(car)}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
          >
            Bérlés
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
