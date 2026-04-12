import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Kovács Anna',
    location: 'Budapest',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    text: 'A Lanzaventura segítségével könnyedén megterveztem a barcelonai utazásomat! A csomagajánlatokkal több mint 150 eurót spóroltam, és a foglalási folyamat zökkenőmentes volt. Nagyon ajánlom!',
    trip: 'Barcelona, Spanyolország'
  },
  {
    id: 2,
    name: 'Nagy Péter',
    location: 'Debrecen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    text: 'A legjobb utazási platform, amit valaha használtam. A valós idejű árazás és az azonnali visszaigazolás mindent stresszmentessé tett. Már foglaltam is a következő kalandomat!',
    trip: 'Bali, Indonézia'
  },
  {
    id: 3,
    name: 'Szabó Eszter',
    location: 'Szeged',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Az ügyfélszolgálat kivételes! Amikor a járatom késett, azonnal segítettek mindent átfoglalni. Igazi nyugalom.',
    trip: 'Dubai, Egyesült Arab Emírségek'
  },
  {
    id: 4,
    name: 'Tóth Gábor',
    location: 'Pécs',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Imádom a villámajánlatokat! Egy fantasztikus Maldív-szigeteki csomagot kaptam 40% kedvezménnyel. Az alkalmazás szuper intuitív és az árak verhetetlenek.',
    trip: 'Maldív-szigetek'
  }
];

const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="relative">
      {/* Háttér */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl" />
      
      <div className="relative p-6 lg:p-12">
        {/* Fejléc */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
            Vélemények
          </span>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Utazóink szeretnek minket
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Csatlakozz elégedett utazóink ezreihez, akik velünk találták meg tökéletes útjukat
          </p>
        </div>

        {/* Vélemények Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Idézet Ikon */}
            <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg z-10">
              <Quote className="w-8 h-8 text-white" />
            </div>

            {/* Kártya */}
            <div className="bg-white rounded-3xl shadow-xl p-8 lg:p-12 ml-6">
              <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                {/* Avatar & Info */}
                <div className="flex lg:flex-col items-center lg:items-start space-x-4 lg:space-x-0 lg:space-y-4">
                  <img
                    src={testimonials[currentIndex].avatar}
                    alt={testimonials[currentIndex].name}
                    className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl object-cover"
                  />
                  <div className="lg:text-left">
                    <h4 className="font-bold text-gray-900">{testimonials[currentIndex].name}</h4>
                    <p className="text-sm text-gray-500">{testimonials[currentIndex].location}</p>
                    <div className="flex items-center mt-2">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tartalom */}
                <div className="flex-1">
                  <p className="text-lg lg:text-xl text-gray-700 leading-relaxed mb-4">
                    "{testimonials[currentIndex].text}"
                  </p>
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-50 rounded-full">
                    <span className="text-sm text-purple-600 font-medium">
                      Utazás: {testimonials[currentIndex].trip}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigáció */}
            <div className="flex items-center justify-center mt-8 space-x-4">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-purple-600 hover:shadow-xl transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              {/* Pontok */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-gradient-to-r from-purple-600 to-pink-500'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-purple-600 hover:shadow-xl transition-all"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Statisztikák */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {[
            { value: '2.5M+', label: 'Elégedett utazó' },
            { value: '150+', label: 'Úticél' },
            { value: '4.9', label: 'Átlagos értékelés' },
            { value: '24/7', label: 'Ügyfélszolgálat' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
