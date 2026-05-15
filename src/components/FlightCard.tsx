import React, { useState } from "react";
import {
  Plane,
  Clock,
  ArrowRight,
  Luggage,
  Briefcase,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { AviasalesFlightOption, AviasalesSegment, getFlightBookingLink } from "@/lib/api";

interface FlightCardProps {
  flight: AviasalesFlightOption;
  onSelect?: (flight: AviasalesFlightOption) => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}p`;
  if (m === 0) return `${h}ó`;
  return `${h}ó ${m}p`;
}

function formatTime(dateTimeStr: string): string {
  if (!dateTimeStr) return "--:--";
  // Handle ISO or "YYYY-MM-DDTHH:mm" format
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) {
    // Try extracting time from string like "2026-03-15T14:30"
    const match = dateTimeStr.match(/(\d{2}):(\d{2})/);
    if (match) return `${match[1]}:${match[2]}`;
    return "--:--";
  }
  return d.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateTimeStr: string): string {
  if (!dateTimeStr) return "";
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
}

const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect }) => {
  const [expanded, setExpanded] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = flight.resultsUrl || flight.affiliateUrl;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const renderSegmentLine = (
    from: string,
    to: string,
    departureLocal: string,
    arrivalLocal: string,
    durationMinutes: number,
    stops: number,
    stopAirports: string[],
    segments?: AviasalesSegment[],
    label?: string,
  ) => (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
      {/* Label (Oda / Vissza) */}
      {label && (
        <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider lg:hidden">{label}</span>
      )}

      {/* Departure */}
      <div className="text-center min-w-[70px]">
        <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatTime(departureLocal)}</p>
        <p className="text-xs text-gray-500">{from}</p>
        <p className="text-xs text-gray-400">{formatDate(departureLocal)}</p>
      </div>

      {/* Duration line */}
      <div className="flex flex-col items-center flex-1 mx-2 lg:mx-6">
        <span className="text-xs text-gray-500 mb-1">{formatDuration(durationMinutes)}</span>
        <div className="flex items-center w-full max-w-[200px]">
          <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
          <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 relative mx-1">
            {stopAirports.map((airport, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500"
                style={{ left: `${((i + 1) / (stops + 1)) * 100}%` }}
                title={airport}
              />
            ))}
          </div>
          <ArrowRight className="w-4 h-4 text-pink-500 flex-shrink-0" />
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
            stops === 0 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}
        >
          {stops === 0
            ? "Közvetlen"
            : `${stops} átszállás${stopAirports.length > 0 ? ` (${stopAirports.join(", ")})` : ""}`}
        </span>
      </div>

      {/* Arrival */}
      <div className="text-center min-w-[70px]">
        <p className="text-xl lg:text-2xl font-bold text-gray-900">{formatTime(arrivalLocal)}</p>
        <p className="text-xs text-gray-500">{to}</p>
        <p className="text-xs text-gray-400">{formatDate(arrivalLocal)}</p>
      </div>
    </div>
  );

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
      <div className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Airline info */}
          <div className="flex items-center space-x-3 lg:min-w-[140px]">
            {flight.airlineLogos.length > 0 ? (
              <img
                src={flight.airlineLogos[0]}
                alt={flight.airlineNames[0] || flight.airlineCodes[0]}
                className="w-10 h-10 object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-purple-600" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">
                {flight.airlineNames.length > 0 ? flight.airlineNames[0] : flight.airlineCodes.join(", ")}
              </p>
              {flight.airlineNames.length > 1 && (
                <p className="text-xs text-gray-500">+{flight.airlineNames.length - 1} másik</p>
              )}
              <span className="text-xs text-gray-400">
                {flight.tripClass === "Y"
                  ? "Economy"
                  : flight.tripClass === "C"
                    ? "Business"
                    : flight.tripClass === "F"
                      ? "First"
                      : "Comfort"}
              </span>
            </div>
          </div>

          {/* Route segments */}
          <div className="flex-1 space-y-3">
            {/* Outbound */}
            {renderSegmentLine(
              flight.from,
              flight.to,
              flight.departureLocal,
              flight.arrivalLocal,
              flight.durationMinutes,
              flight.stops,
              flight.stopAirports,
              flight.segments,
              flight.isReturn ? "Oda" : undefined,
            )}

            {/* Return (if round trip) */}
            {flight.isReturn && flight.returnDepartureLocal && (
              <>
                <div className="border-t border-gray-100 my-2" />
                {renderSegmentLine(
                  flight.to,
                  flight.from,
                  flight.returnDepartureLocal,
                  flight.returnArrivalLocal || "",
                  flight.returnDurationMinutes || 0,
                  flight.returnStops || 0,
                  flight.returnStopAirports || [],
                  flight.returnSegments,
                  "Vissza",
                )}
              </>
            )}
          </div>

          {/* Price & Buy */}
          <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-5 lg:min-w-[150px]">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(flight.price).toLocaleString("hu-HU")}{" "}
                <span className="text-base font-normal">{flight.currency}</span>
              </p>
              {flight.pricePerPerson !== flight.price && (
                <p className="text-xs text-gray-500">
                  {Math.round(flight.pricePerPerson).toLocaleString("hu-HU")} {flight.currency}/fő
                </p>
              )}
              {flight.seatsAvailable && flight.seatsAvailable <= 5 && (
                <p className="text-xs text-red-500 font-medium">Már csak {flight.seatsAvailable} hely!</p>
              )}
            </div>

            {/* Baggage icons */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {flight.handbagsIncluded && (
                <span className="flex items-center gap-0.5" title="Kézipoggyász">
                  <Briefcase className="w-3.5 h-3.5" />
                </span>
              )}
              {flight.baggageIncluded ? (
                <span
                  className="flex items-center gap-0.5 text-green-600"
                  title={`Poggyász${flight.baggageWeight ? ` (${flight.baggageWeight}kg)` : ""}`}
                >
                  <Luggage className="w-3.5 h-3.5" />
                  {flight.baggageWeight && <span>{flight.baggageWeight}kg</span>}
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-gray-400 line-through" title="Nincs poggyász">
                  <Luggage className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <button
              onClick={handleBuy}
              disabled={buyLoading}
              className="w-full lg:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {buyLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>Foglalás</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-400 text-center">{flight.agentName}</p>
          </div>
        </div>
      </div>

      {/* Expand/collapse for details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-xs text-gray-500 flex items-center justify-center gap-1 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {expanded ? "Részletek elrejtése" : "Részletek"}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 lg:px-6 pb-4 bg-gray-50 border-t border-gray-100">
          <div className="space-y-4 pt-3">
            {/* Outbound segments */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {flight.isReturn ? "Odaút részletei" : "Járat részletei"}
              </h4>
              <div className="space-y-2">
                {flight.segments.map((seg, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm bg-white rounded-lg p-3">
                    <Plane className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {seg.airlineCode} {seg.flightNumber} &middot; {seg.from} &rarr; {seg.to}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(seg.departureLocal)} - {formatTime(seg.arrivalLocal)} &middot;{" "}
                        {formatDuration(seg.durationMinutes)}
                        {seg.aircraft && ` &middot; ${seg.aircraft}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return segments */}
            {flight.isReturn && flight.returnSegments && flight.returnSegments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Visszaút részletei</h4>
                <div className="space-y-2">
                  {flight.returnSegments.map((seg, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-white rounded-lg p-3">
                      <Plane className="w-4 h-4 text-pink-500 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {seg.airlineCode} {seg.flightNumber} &middot; {seg.from} &rarr; {seg.to}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(seg.departureLocal)} - {formatTime(seg.arrivalLocal)} &middot;{" "}
                          {formatDuration(seg.durationMinutes)}
                          {seg.aircraft && ` &middot; ${seg.aircraft}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional info */}
            <div className="flex flex-wrap gap-2 text-xs">
              {flight.isLowcost && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Fapados</span>
              )}
              {flight.baggageIncluded && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                  Poggyász: {flight.baggageWeight ? `${flight.baggageWeight}kg` : "tartalmazza"}
                </span>
              )}
              {!flight.baggageIncluded && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">Poggyász nélkül</span>
              )}
              {flight.handbagsIncluded && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  Kézipoggyász{flight.handbagsWeight ? `: ${flight.handbagsWeight}kg` : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightCard;
