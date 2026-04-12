import React, { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';

const bookingMessages = [
  { location: 'Barcelona, Spanyolország', time: '2 perce', type: 'szállás' },
  { location: 'Bali, Indonézia', time: '5 perce', type: 'csomag' },
  { location: 'Dubai, Egyesült Arab Emírségek', time: '8 perce', type: 'repülőjegy' },
  { location: 'Párizs, Franciaország', time: '12 perce', type: 'szállás' },
  { location: 'London, Egyesült Királyság', time: '15 perce', type: 'autóbérlés' },
  { location: 'Maldív-szigetek', time: '18 perce', type: 'csomag' },
  { location: 'Róma, Olaszország', time: '22 perce', type: 'szállás' },
  { location: 'Prága, Csehország', time: '25 perce', type: 'repülőjegy' },
];

const LiveBookingNotification: React.FC = () => {
  const [currentNotification, setCurrentNotification] = useState<typeof bookingMessages[0] | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      const randomBooking = bookingMessages[Math.floor(Math.random() * bookingMessages.length)];
      setCurrentNotification(randomBooking);
      setIsVisible(true);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const initialTimeout = setTimeout(showNotification, 3000);

    const interval = setInterval(() => {
      showNotification();
    }, Math.random() * 15000 + 15000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  if (!currentNotification || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 animate-in slide-in-from-left duration-500">
      <div className="bg-white rounded-2xl shadow-2xl p-4 max-w-xs border border-gray-100">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-gray-500" />
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-900">
              <span className="font-semibold">Valaki</span> most foglalt: {currentNotification.type}
            </p>
            <p className="text-sm font-medium text-purple-600">{currentNotification.location}</p>
            <p className="text-xs text-gray-400 mt-1">{currentNotification.time}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveBookingNotification;
