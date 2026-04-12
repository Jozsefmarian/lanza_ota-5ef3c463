import React from 'react';
import { Heart, Star, TrendingUp, MapPin } from 'lucide-react';

interface Destination {
  id: number;
  name: string;
  image: string;
  price: number;
  rating: number;
  trending: boolean;
  category: string;
}

interface DestinationCardProps {
  destination: Destination;
  isWishlisted: boolean;
  onWishlistToggle: (id: number) => void;
  onClick: (destination: Destination) => void;
}

const categoryLabels: Record<string, string> = {
  'beach': 'Tengerpart',
  'mountain': 'Hegység',
  'city': 'Város',
  'adventure': 'Kaland',
  'cultural': 'Kulturális',
  'romantic': 'Romantikus',
};

const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  isWishlisted,
  onWishlistToggle,
  onClick
}) => {
  return (
    <div
      onClick={() => onClick(destination)}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2"
    >
      {/* Kép Konténer */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradiens Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Népszerű Badge */}
        {destination.trending && (
          <div className="absolute top-3 left-3 flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full text-white text-xs font-bold shadow-lg">
            <TrendingUp className="w-3 h-3" />
            <span>Népszerű</span>
          </div>
        )}
        
        {/* Kedvencek Gomb */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWishlistToggle(destination.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
            isWishlisted
              ? 'bg-pink-500 text-white'
              : 'bg-white/20 text-white hover:bg-white/40'
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Ár Címke */}
        <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
          <span className="text-sm text-gray-500">-tól</span>
          <span className="ml-1 text-lg font-bold text-gray-900">{destination.price} €</span>
        </div>
      </div>

      {/* Tartalom */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
              {destination.name}
            </h3>
            <div className="flex items-center mt-1 text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{categoryLabels[destination.category] || destination.category}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-amber-50 rounded-lg">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-sm font-bold text-amber-700">{destination.rating}</span>
          </div>
        </div>

        {/* Gyors Művelet */}
        <button className="w-full mt-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Felfedezés
        </button>
      </div>
    </div>
  );
};

export default DestinationCard;
