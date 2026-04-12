import React, { useState, useEffect } from 'react';
import { Clock, Flame, ArrowRight } from 'lucide-react';
import { images } from '../data/images';

interface DealsSectionProps {
  onDealClick: (deal: any) => void;
}

const DealsSection: React.FC<DealsSectionProps> = ({ onDealClick }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const deals = [
    {
      id: 1,
      title: 'Tokiói Kaland',
      description: '5 éj + repülőjegy + túrák',
      originalPrice: 2499,
      dealPrice: 1799,
      image: images.destinations[6]?.image || images.destinations[0].image,
      discount: 28,
      spotsLeft: 3
    },
    {
      id: 2,
      title: 'Bali Paradicsom',
      description: '7 éj + spa + reggeli',
      originalPrice: 1899,
      dealPrice: 1299,
      image: images.destinations[0].image,
      discount: 32,
      spotsLeft: 5
    },
    {
      id: 3,
      title: 'Dubai Luxus',
      description: '4 éj + sivatagi szafari',
      originalPrice: 3299,
      dealPrice: 2499,
      image: images.destinations[Math.min(12, images.destinations.length - 1)]?.image || images.destinations[0].image,
      discount: 24,
      spotsLeft: 2
    }
  ];

  return (
    <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-3xl p-6 lg:p-8 overflow-hidden relative">
      {/* Háttér Minta */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative">
        {/* Fejléc */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center space-x-3 mb-4 lg:mb-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Villámajánlatok</h3>
              <p className="text-white/80">Korlátozott ideig érvényes ajánlatok</p>
            </div>
          </div>

          {/* Visszaszámláló */}
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white/80 mr-2">Lejár:</span>
            <div className="flex space-x-2">
              {[
                { value: timeLeft.hours, label: 'óra' },
                { value: timeLeft.minutes, label: 'perc' },
                { value: timeLeft.seconds, label: 'mp' }
              ].map((item, index) => (
                <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center min-w-[60px]">
                  <span className="text-2xl font-bold text-white">{String(item.value).padStart(2, '0')}</span>
                  <span className="text-xs text-white/80 block">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ajánlatok Rács */}
        <div className="grid md:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <div
              key={deal.id}
              onClick={() => onDealClick(deal)}
              className="bg-white rounded-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-xl"
            >
              <div className="relative h-40">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  -{deal.discount}%
                </div>
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-lg">
                  Már csak {deal.spotsLeft} hely!
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-gray-900 text-lg">{deal.title}</h4>
                <p className="text-gray-500 text-sm mb-3">{deal.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 line-through text-sm">{deal.originalPrice} €</span>
                    <span className="text-2xl font-bold text-purple-600 ml-2">{deal.dealPrice} €</span>
                  </div>
                  <button className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DealsSection;
