import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface AppBannerProps {
  onClose?: () => void;
}

const AppBanner: React.FC<AppBannerProps> = ({ onClose }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 text-white py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center space-x-4 text-sm">
        <Sparkles className="w-4 h-4 hidden sm:block" />
        <span className="font-medium">
          New Year Sale! Get up to 30% off on all bookings
        </span>
        <a
          href="#deals"
          className="hidden sm:inline-flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-all"
        >
          <span>View Deals</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>
      <button
        onClick={onClose}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AppBanner;
