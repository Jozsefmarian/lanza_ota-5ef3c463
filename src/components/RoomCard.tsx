import React from "react";
import { Coffee, Check, Ban, BedDouble, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

export type RoomOffer = {
  bookHash: string;
  price: number;
  currency: string;

  // régi (UI fallback), maradhat:
  hasBreakfast: boolean;

  // ✅ hivatalos ETG mező a megjelenítéshez is
  meal_data?: {
    value?: string | null;
    has_breakfast?: boolean | null;
  } | null;

  // opcionális fallback (ha valahol még átjön)
  meal?: string | null;

  freeCancellationBefore?: string | null;
  paymentType?: string | null;
  onSiteFeesText?: string | null;
};

export type RoomGroup = {
  roomName: string;
  offers: RoomOffer[];
  isBestDeal?: boolean;

  // ✅ Bal oldali fix blokk adatai (opcionálisak, ha nincs adat, nem törik)
  roomImageUrl?: string | null;      // 1 db thumbnail
  roomImageCount?: number | null;    // pl. "3 fénykép"
  bedInfoText?: string | null;       // pl. "2 különálló ágy"
  areaSqm?: number | null;           // pl. 14
  highlights?: string[] | null;      // pl. ["Privát fürdőszoba", "Ingyenes wifi"]
};

export interface RoomCardProps {
  group: RoomGroup;
  nights?: number;
  onBook: (payload: { roomName: string; offer: RoomOffer }) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ group, nights, onBook }) => {
  const { roomName, offers, isBestDeal } = group;
    const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const scrollByCards = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    // kb. 1 kártyányit lapozunk
    const amount = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // ✅ Smart Price: a legolcsóbb ajánlat indexe
  const smartIndex = React.useMemo(() => {
    if (!offers || offers.length === 0) return -1;
    let minIdx = 0;
    let minPrice = Number(offers[0]?.price ?? Infinity);

    for (let i = 1; i < offers.length; i++) {
      const p = Number(offers[i]?.price ?? Infinity);
      if (p < minPrice) {
        minPrice = p;
        minIdx = i;
      }
    }
    return minIdx;
  }, [offers]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 hover:shadow-md transition-shadow min-h-[340px] md:min-h-[380px]">
      <div className="grid gap-4 items-stretch lg:grid-cols-[clamp(16rem,22vw,20rem)_minmax(0,1fr)]">
        {/* LEFT: Room summary */}
<div className="min-w-0 lg:pr-4 lg:border-r lg:border-gray-100 flex flex-col gap-3">
  {/* Room image */}
  <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-100">
    {group.roomImageUrl ? (
      <img
        src={group.roomImageUrl}
        alt={roomName}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        Nincs kép
      </div>
    )}

    {typeof group.roomImageCount === "number" && group.roomImageCount > 0 ? (
      <div className="absolute left-3 bottom-3 px-2.5 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
        {group.roomImageCount} fénykép
      </div>
    ) : null}
  </div>
  <div className="min-h-0 flex flex-col gap-3">

  {/* Title + best deal */}
  <div className="flex items-center gap-2 min-w-0">
    <h3 className="font-semibold text-gray-900 text-lg md:text-xl truncate">
      {roomName}
    </h3>

    {isBestDeal && (
      <span className="text-green-700 font-semibold text-sm whitespace-nowrap">
        Best Deal
      </span>
    )}
  </div>

  {/* Bed / offers / nights */}
  <p className="text-sm text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
    <span className="inline-flex items-center gap-2">
      <BedDouble className="w-4 h-4 text-gray-400" />
      {group.bedInfoText ?? `${offers.length} ajánlat`}
    </span>

    <span className="text-gray-300">•</span>
    <span>{offers.length} ajánlat</span>

    {typeof nights === "number" ? (
      <>
        <span className="text-gray-300">•</span>
        <span>{nights} éj</span>
      </>
    ) : null}
  </p>

  {/* Area + highlights */}
  {group.areaSqm ? (
    <div className="text-sm text-gray-600">
      {group.areaSqm} m²
    </div>
  ) : null}

  {Array.isArray(group.highlights) && group.highlights.length > 0 ? (
    <div className="flex flex-wrap gap-2 pt-1">
      {group.highlights.slice(0, 6).map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
        >
          {t}
        </span>
      ))}
    </div>
  ) : null}
</div>
</div>

                {/* RIGHT: Offers carousel (G4) */}
        <div className="min-w-0 h-full flex flex-col">
          <div className="relative h-full flex flex-col">
            {/* Left/Right arrows */}
            <button
              type="button"
              onClick={() => scrollByCards("left")}
              className="hidden md:flex items-center justify-center absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow transition"
              aria-label="Balra"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => scrollByCards("right")}
              className="hidden md:flex items-center justify-center absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow transition"
              aria-label="Jobbra"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Scroll area */}
            <div
  ref={scrollRef}
  data-hide-scrollbar="true"
  className="min-w-0 grid grid-flow-col auto-cols-[clamp(14rem,18vw,16.5rem)] gap-3 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory"
  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
>
              {/* Webkit scrollbar hide */}
              <style>{`
                div[data-hide-scrollbar="true"]::-webkit-scrollbar { display: none; }
              `}</style>

              {offers.map((o, idx) => {
                const isSmart = idx === smartIndex;

                return (
                  <div
                    key={`${o.bookHash}-${idx}`}
                    className={
                      "snap-start shrink-0 border rounded-xl p-3 md:p-4 flex flex-col " +
                      "min-h-[clamp(12rem,20vw,16rem)] h-full " +
                      (isSmart
                        ? "border-purple-300 bg-purple-50/30 shadow-sm"
                        : "border-gray-100 bg-white")
                    }
                  >
                    {/* Top area: badges/conditions */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {isSmart && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-600 text-white">
                            Smart Price
                          </span>
                        )}

                        {/* Meal chip */}
                        {(() => {
                          const raw = (o.meal_data?.value ?? o.meal ?? "").toString();
                          const norm = raw.toLowerCase().replace(/[\s_-]/g, "");

                          const isNoMeal =
                            norm === "" || norm.includes("nomeal") || norm.includes("roomonly");

                          const label = isNoMeal
                            ? "Ellátás nélkül"
                            : norm.includes("allinclusive") || norm === "ai"
                            ? "All inclusive"
                            : norm.includes("fullboard") || norm === "fb"
                            ? "Reggeli, ebéd és vacsora"
                            : norm.includes("halfboard") || norm === "hb"
                            ? "Reggeli és ebéd, vagy vacsora"
                            : (o.meal_data?.has_breakfast ?? o.hasBreakfast)
                            ? "Reggeli"
                            : "Ellátás";

                          return (
                            <span
                              className={
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium " +
                                (isNoMeal
                                  ? "bg-slate-50 text-slate-700"
                                  : "bg-green-50 text-green-700")
                              }
                            >
                              <Coffee className="w-3.5 h-3.5" />
                              {label}
                            </span>
                          );
                        })()}

                        {/* Cancellation */}
                        {o.freeCancellationBefore ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md text-xs font-medium">
                            <Check className="w-3.5 h-3.5" />
                            Ingyenes lemondás
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
                            <Ban className="w-3.5 h-3.5" />
                            Nem visszatéríthető
                          </span>
                        )}

                        {/* Payment */}
                        {o.paymentType ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium">
                            <CreditCard className="w-3.5 h-3.5" />
                            {o.paymentType}
                          </span>
                        ) : null}
                      </div>

                      {/* Optional cancellation date */}
                      {o.freeCancellationBefore ? (
                        <div className="text-xs text-gray-500">
                          Lemondás eddig: {o.freeCancellationBefore}
                        </div>
                      ) : null}
                    </div>

                    {/* Bottom area: price + fees + CTA (always bottom aligned) */}
                    <div className="mt-auto pt-3 border-t border-gray-100">
                      <div className="flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xl md:text-2xl font-bold text-gray-900 leading-none">
                            {o.price}{" "}
                            <span className="text-sm font-normal text-gray-500">
                              {o.currency}
                            </span>
                          </div>

                          {o.onSiteFeesText ? (
                            <div className="text-xs text-gray-500 mt-1">
                              {o.onSiteFeesText}
                            </div>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => onBook({ roomName, offer: o })}
                          className="px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-sm whitespace-nowrap"
                        >
                          Foglalás
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* hide scrollbar (webkit) */}
            <div data-hide-scrollbar="true" className="hidden" />
                    </div>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;