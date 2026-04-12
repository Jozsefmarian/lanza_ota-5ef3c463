import { MapPin } from 'lucide-react';

interface HotelLocationProps {
  address: string;
  city?: string;
  lat?: number;
  lng?: number;
}

const HotelLocation = ({ address, city, lat, lng }: HotelLocationProps) => {
  const hasCoordinates = lat !== undefined && lng !== undefined;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Helyszín</h2>
      
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className={`${hasCoordinates ? 'md:flex' : ''}`}>
          {/* Map Section */}
          {hasCoordinates && (
            <div className="w-full md:w-1/2 h-64 md:h-auto md:min-h-[280px]">
              <iframe
                title="Hotel Location Map"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '280px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
              />
            </div>
          )}
          
          {/* Address Section */}
          <div className={`p-6 ${hasCoordinates ? 'md:w-1/2' : 'w-full'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Cím</h3>
                <p className="text-gray-600">{address}</p>
                {city && (
                  <p className="text-gray-500 text-sm mt-1">{city}</p>
                )}
              </div>
            </div>
            
            {hasCoordinates && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">Koordináták:</span>
                  <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HotelLocation;
