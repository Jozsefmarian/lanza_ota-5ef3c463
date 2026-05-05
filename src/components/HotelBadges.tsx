import React from 'react';
import { Coffee, RefreshCcw, Wifi } from 'lucide-react';

export interface HotelBadgesProps {
  // ✅ új: konkrét felirat (pl. Félpanzió / Teljes ellátás / All inclusive / Reggelivel)
  mealLabel?: string | null;

  // régi fallback, maradhat kompatibilitás miatt
  hasBreakfast?: boolean;

  hasFreeCancellation?: boolean;
  hasWifi?: boolean;
}

const HotelBadges: React.FC<HotelBadgesProps> = ({
  mealLabel = null,
  hasBreakfast = false,
  hasFreeCancellation = false,
  hasWifi = false,
}) => {
  // Check if any badge should be displayed
  const hasMealBadge = Boolean(mealLabel) || hasBreakfast;
  const hasBadges = hasMealBadge || hasFreeCancellation || hasWifi;

  if (!hasBadges) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {(mealLabel || hasBreakfast) && (
  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-green-700 text-sm font-medium">
    <Coffee className="w-4 h-4" />
    <span>{mealLabel || 'Reggeli'}</span>
  </div>
)}

      {hasFreeCancellation && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium">
          <RefreshCcw className="w-4 h-4" />
          <span>Ingyenes lemondás</span>
        </div>
      )}

      {hasWifi && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium">
          <Wifi className="w-4 h-4" />
          <span>Ingyenes WiFi</span>
        </div>
      )}
    </div>
  );
};

export default HotelBadges;
