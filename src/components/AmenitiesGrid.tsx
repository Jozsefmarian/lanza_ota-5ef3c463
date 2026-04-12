import React from 'react';
import { 
  Wifi, 
  Car, 
  Dumbbell, 
  Waves, 
  Coffee, 
  Utensils, 
  Wind, 
  Tv, 
  Bath, 
  Sparkles, 
  ShieldCheck, 
  Cigarette, 
  Dog, 
  Baby, 
  Accessibility, 
  Plane, 
  Clock, 
  CreditCard,
  Snowflake,
  Sun,
  Mountain,
  Building2,
  Check
} from 'lucide-react';

interface Amenity {
  key: string;
  label: string;
  icon?: string;
}

interface AmenitiesGridProps {
  amenities: Amenity[];
}

const AmenitiesGrid: React.FC<AmenitiesGridProps> = ({ amenities }) => {

  const isEmpty = !amenities || amenities.length === 0;

  // Icon mapping based on the icon string
  const getIcon = (iconName?: string) => {
    if (!iconName) {
      return <Check className="w-5 h-5" />;
    }

    const iconMap: Record<string, React.ReactNode> = {
      wifi: <Wifi className="w-5 h-5" />,
      parking: <Car className="w-5 h-5" />,
      car: <Car className="w-5 h-5" />,
      gym: <Dumbbell className="w-5 h-5" />,
      fitness: <Dumbbell className="w-5 h-5" />,
      pool: <Waves className="w-5 h-5" />,
      swimming: <Waves className="w-5 h-5" />,
      coffee: <Coffee className="w-5 h-5" />,
      breakfast: <Coffee className="w-5 h-5" />,
      restaurant: <Utensils className="w-5 h-5" />,
      dining: <Utensils className="w-5 h-5" />,
      ac: <Wind className="w-5 h-5" />,
      aircon: <Wind className="w-5 h-5" />,
      climate: <Snowflake className="w-5 h-5" />,
      tv: <Tv className="w-5 h-5" />,
      television: <Tv className="w-5 h-5" />,
      spa: <Bath className="w-5 h-5" />,
      bath: <Bath className="w-5 h-5" />,
      wellness: <Sparkles className="w-5 h-5" />,
      clean: <Sparkles className="w-5 h-5" />,
      safe: <ShieldCheck className="w-5 h-5" />,
      security: <ShieldCheck className="w-5 h-5" />,
      smoking: <Cigarette className="w-5 h-5" />,
      pet: <Dog className="w-5 h-5" />,
      dog: <Dog className="w-5 h-5" />,
      baby: <Baby className="w-5 h-5" />,
      child: <Baby className="w-5 h-5" />,
      accessible: <Accessibility className="w-5 h-5" />,
      disability: <Accessibility className="w-5 h-5" />,
      airport: <Plane className="w-5 h-5" />,
      shuttle: <Plane className="w-5 h-5" />,
      '24h': <Clock className="w-5 h-5" />,
      reception: <Clock className="w-5 h-5" />,
      payment: <CreditCard className="w-5 h-5" />,
      heating: <Sun className="w-5 h-5" />,
      view: <Mountain className="w-5 h-5" />,
      terrace: <Sun className="w-5 h-5" />,
      balcony: <Building2 className="w-5 h-5" />,
    };

    const lowerIcon = iconName.toLowerCase();
    
    // Try exact match first
    if (iconMap[lowerIcon]) {
      return iconMap[lowerIcon];
    }

    // Try partial match
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerIcon.includes(key) || key.includes(lowerIcon)) {
        return icon;
      }
    }

    // Default icon
    return <Check className="w-5 h-5" />;
  };

  return (
  <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
    {/* Section Title */}
    <h2 className="text-lg font-bold text-gray-900 mb-4">
      Szolgáltatások
    </h2>

    {isEmpty ? (
      <p className="text-sm text-gray-600">
        Ehhez a szállodához most nincs megadva szolgáltatáslista.
      </p>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {amenities.map((amenity) => (
          <div
            key={amenity.key}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="text-purple-600 flex-shrink-0">
              {getIcon(amenity.icon)}
            </span>
            <span className="text-sm text-gray-700 font-medium truncate">
              {amenity.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default AmenitiesGrid;
