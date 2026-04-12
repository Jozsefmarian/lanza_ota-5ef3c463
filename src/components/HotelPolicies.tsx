import React from 'react';
import { Clock, LogIn, LogOut, XCircle } from 'lucide-react';

export interface HotelPoliciesProps {
  // régi, direkt props – maradnak kompatibilitás miatt
  checkIn?: string;
  checkOut?: string;
  cancellationPolicy?: string;

  // új: teljes hotel info (Ratehawk source of truth)
  hotel?: any;
}

const HotelPolicies: React.FC<HotelPoliciesProps> = ({
  checkIn,
  checkOut,
  cancellationPolicy,
  hotel,
}) => {
    // --- Normalizálás: több lehetséges Ratehawk mező ---
  const normalizedCheckIn =
    checkIn ||
    hotel?.checkin ||
    hotel?.checkin_time ||
    hotel?.policies?.checkin ||
    hotel?.policies?.check_in;

  const normalizedCheckOut =
    checkOut ||
    hotel?.checkout ||
    hotel?.checkout_time ||
    hotel?.policies?.checkout ||
    hotel?.policies?.check_out;

  const normalizedCancellation =
    cancellationPolicy ||
    hotel?.cancellation_policy ||
    hotel?.policies?.cancellation ||
    hotel?.policies?.cancellation_policy;

  // Don't render if no props are provided
  if (!normalizedCheckIn && !normalizedCheckOut && !normalizedCancellation) {
  return null;
}

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">Szabályok</h2>
      </div>

      {/* Policy Rows */}
      <div className="p-5 space-y-4">
        {/* Check-in Time */}
        {normalizedCheckIn && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <LogIn className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Bejelentkezés</p>
              <p className="font-medium text-gray-900">{normalizedCheckIn}</p>
            </div>
          </div>
        )}

        {/* Check-out Time */}
        {normalizedCheckOut && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Kijelentkezés</p>
              <p className="font-medium text-gray-900">{normalizedCheckOut}</p>
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        {normalizedCancellation && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Lemondási feltételek</p>
              <p className="font-medium text-gray-900">{normalizedCancellation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelPolicies;
