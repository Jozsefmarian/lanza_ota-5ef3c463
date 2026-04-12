import React, { useEffect, useMemo, useRef, useState } from "react";
import RoomCard, { RoomGroup } from "./RoomCard";

import type { RoomOffer } from "./RoomCard";

const toBool = (v: unknown): boolean => {
  if (v === true) return true;
  if (v === false) return false;
  if (typeof v === "string") {
    const s = v.toLowerCase().trim();
    return s === "true" || s === "1" || s === "yes";
  }
  if (typeof v === "number") return v === 1;
  return false;
};
export interface RoomListProps {
  roomGroups: RoomGroup[];
  loading?: boolean;
  hpError?: string | null;
  nights?: number;
  adults?: number;
  onBook: (payload: { roomName: string; offer: RoomOffer }) => void;
}

/* ------------------------------------------------------------------ */
/*  Shared chip / pill button class – matches CategoryFilter inactive  */
/* ------------------------------------------------------------------ */
const chipClass = [
  "px-4 py-2",
  "text-sm font-medium",
  "rounded-full",
  "border border-gray-200",
  "bg-white text-gray-700",
  "hover:bg-gray-100",
  "transition-all duration-200",
  // ✅ No thick black focus ring – subtle purple ring matching --ring token
  "focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-300",
].join(" ");

const RoomList: React.FC<RoomListProps> = ({ roomGroups, loading, hpError, nights, adults, onBook }) => {
    type OpenFilter = null | "beds" | "meals" | "payment" | "cancel";
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const filtersRef = useRef<HTMLDivElement | null>(null);

  // UI state (még NEM szűrünk vele, csak jelöljük)
  const [beds, setBeds] = useState<"all" | "double" | "separate">("all");
  const [meals, setMeals] = useState<string[]>([]);
  const mealLabelByKey: Record<string, string> = {
  no_meals: "Étkezés nélkül",
  breakfast: "Reggeli",
  hb: "Reggeli + ebéd vagy vacsora",
  fb: "Reggeli, ebéd és vacsora",
  ai: "All-inclusive",
};
  const [payment, setPayment] = useState<"any" | "now" | "hotel">("any");
  const [cancel, setCancel] = useState<"all" | "free" | "non_refundable">("all");

  const toggle = (key: Exclude<OpenFilter, null>) =>
    setOpenFilter((prev) => (prev === key ? null : key));

    const toggleMeal = (value: string, checked: boolean) => {
    setMeals((prev) => {
      const next = new Set(prev);
      if (checked) next.add(value);
      else next.delete(value);
      return Array.from(next);
    });
    // Zen-szerű: NE záródjon be pipálásra
  };
    useEffect(() => {
    if (!openFilter) return;

    const onMouseDown = (e: MouseEvent) => {
      const el = filtersRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpenFilter(null);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFilter(null);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openFilter]);
  // ✅ 1) Loading state
  if (loading) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Elérhető szobák
          </h2>
          <p className="text-sm text-gray-500 mt-1">Árak betöltése…</p>
        </div>

        <div className="p-4 sm:p-5 space-y-3">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </section>
    );
  }

  // ✅ 2) Empty / error state
  if (!roomGroups || roomGroups.length === 0) {
    const isMissingDates = hpError === "missing_checkin_or_checkout";
    const isRateLimited = typeof hpError === "string" && (hpError.includes("_429") || hpError.includes("429"));

    let title = "Nincs elérhető ajánlat";
    let desc = "Erre az időszakra jelenleg nem találtunk foglalható ajánlatot.";

    if (isMissingDates) {
      title = "Válassz dátumot";
      desc = "A szobaárak megjelenítéséhez add meg az érkezés és távozás dátumát.";
    } else if (isRateLimited) {
      title = "Túl sok kérés érkezett";
      desc = "Most túl sok lekérdezés fut. Próbáld újra pár másodperc múlva.";
    } else if (hpError) {
      title = "Nem sikerült betölteni az árakat";
      desc = "Kérlek próbáld újra. Ha ismétlődik, válts dátumot vagy frissítsd az oldalt.";
    }

    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
            Elérhető szobák
          </h2>
          <p className="text-sm text-gray-500 mt-1">Szobák és ajánlatok</p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="font-semibold text-gray-900">{title}</div>
            <div className="text-sm text-gray-600 mt-1">{desc}</div>
          </div>
        </div>
      </section>
    );
  }

   // ✅ G4 – valódi szűrés (frontend-only): offers szűrése + üres roomGroup elrejtése
  const filteredRoomGroups = roomGroups
    .map((group) => {
      // Beds: nálunk nincs külön bed mező → roomName alapján “közelítünk”
      const name = (group.roomName ?? "").toLowerCase();

      const matchesBeds =
        beds === "all" ||
        (beds === "double" &&
          ["double", "king", "queen", "francia", "kétszemélyes", "matrimonial"].some((k) =>
            name.includes(k)
          )) ||
        (beds === "separate" &&
          ["twin", "külön", "separate", "iker", "2 single", "egyszemélyes"].some((k) =>
            name.includes(k)
          ));

      if (!matchesBeds) return null;

            const filteredOffers = group.offers.filter((offer) => {
        // ── Meals (hivatalos): offer.meal_data.value + offer.meal_data.has_breakfast ──
        if (meals.length > 0) {
          const wantsNoMeals = meals.includes("no_meals");
          const wantsBreakfast = meals.includes("breakfast");
          const wantsHB = meals.includes("hb");
          const wantsFB = meals.includes("fb");
          const wantsAI = meals.includes("ai");

          const mealValueRaw = offer.meal_data?.value ?? "";
          const hasBreakfast = Boolean(offer.meal_data?.has_breakfast);

          const mvNorm = String(mealValueRaw || "")
            .toLowerCase()
            .replace(/[\s_-]/g, "");

          const isNoMeals = mvNorm === "nomeal";
          const isBreakfast = hasBreakfast || mvNorm.includes("breakfast");
          const isHB = mvNorm.includes("halfboard") || mvNorm.includes("hb");
          const isFB = mvNorm.includes("fullboard") || mvNorm.includes("fb");
          const isAI =
            mvNorm.includes("allinclusive") ||
            mvNorm.includes("softallinclusive") ||
            mvNorm.includes("superallinclusive") ||
            mvNorm.includes("ultraallinclusive");

          // Zen-szerű: több kijelölés = OR (bármelyik jó)
          const ok =
            (wantsNoMeals && isNoMeals) ||
            (wantsBreakfast && isBreakfast) ||
            (wantsHB && isHB) ||
            (wantsFB && isFB) ||
            (wantsAI && isAI);

          if (!ok) return false;
        }

        // ── Payment: a RoomOffer.paymentType a normalizált érték ──
        if (payment !== "any") {
          const pt = (offer.paymentType ?? "").toLowerCase();
          const isHotelPay = pt.includes("hotel");

          if (payment === "hotel" && !isHotelPay) return false;
          if (payment === "now" && isHotelPay) return false;
        }

        // ── Cancellation: freeCancellationBefore null → nincs ingyenes lemondás ──
        if (cancel === "free") {
          if (!offer.freeCancellationBefore) return false;
        }
        if (cancel === "non_refundable") {
          if (offer.freeCancellationBefore) return false;
        }

        return true;
      });

      if (filteredOffers.length === 0) return null;
      return { ...group, offers: filteredOffers };
    })
    .filter(Boolean) as RoomGroup[];

    const mealsChipLabel =
  meals.length === 0
    ? "Étkezések"
    : meals.length === 1
    ? (mealLabelByKey[meals[0]] ?? "Étkezések")
    : `Étkezések • ${meals.length}`;

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* ── G4 Header ── unified, no duplicate ── */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex flex-col gap-3 items-start">
          {/* Title + subtitle */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
              Elérhető szobák
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {nights ?? 0} éjszakára, {adults ?? 0} felnőtt számára
              {" "}&middot;{" "}
              {roomGroups.length} szobatípus elérhető
            </p>
          </div>

          {/* Filter chips – layout only, no logic yet */}
          {/* Filter chips – dropdown UI (no filtering logic yet) */}
<div ref={filtersRef} className="flex flex-wrap gap-2">
  {/* Beds */}
  <div className="relative">
    <button type="button" className={chipClass} onClick={() => toggle("beds")}>
      Ágyak <span className="ml-1">▾</span>
    </button>

    {openFilter === "beds" && (
      <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
        <p className="text-xs font-semibold text-gray-500 mb-2">Ágyak</p>

        <label className="flex items-center gap-2 py-2 cursor-pointer">
          <input type="radio" checked={beds === "all"} onChange={() => {
  setBeds("all");
  setOpenFilter(null);
}} />
          <span className="text-sm text-gray-800">Minden lehetőség</span>
        </label>
        <label className="flex items-center gap-2 py-2 cursor-pointer">
          <input type="radio" checked={beds === "double"} onChange={() => {
  setBeds("double");
  setOpenFilter(null);
}} />
          <span className="text-sm text-gray-800">Kétszemélyes ágy</span>
        </label>
        <label className="flex items-center gap-2 py-2 cursor-pointer">
          <input type="radio" checked={beds === "separate"} onChange={() => {
  setBeds("separate");
  setOpenFilter(null);
}} />
          <span className="text-sm text-gray-800">Külön ágyak</span>
        </label>
      </div>
    )}
  </div>

  {/* Meals */}
  <div className="relative">    
    <button type="button" className={chipClass} onClick={() => toggle("meals")}>
  {mealsChipLabel} <span className="ml-1">▾</span>
</button>

    {openFilter === "meals" && (
      <div className="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
        <p className="text-xs font-semibold text-gray-500 mb-2">Étkezések</p>

                {[
          { key: "no_meals", label: "Étkezés nélkül" },
          { key: "breakfast", label: "Reggeli" },
          { key: "hb", label: "Reggeli és ebéd, vagy vacsora" },
          { key: "fb", label: "Reggeli, ebéd és vacsora" },
          { key: "ai", label: "All inclusive" },
        ].map((opt) => (
          <label key={opt.key} className="flex items-center gap-2 py-2 cursor-pointer">
            <input
              type="checkbox"
              checked={meals.includes(opt.key)}
              onChange={(e) => {
  toggleMeal(opt.key, e.target.checked);
}}
            />
            <span className="text-sm text-gray-800">{opt.label}</span>
          </label>
        ))}
      </div>
    )}
  </div>

  {/* Payment */}
  <div className="relative">
    <button type="button" className={chipClass} onClick={() => toggle("payment")}>
      Fizetés <span className="ml-1">▾</span>
    </button>

    {openFilter === "payment" && (
      <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
        <p className="text-xs font-semibold text-gray-500 mb-2">Fizetés</p>

        <label
  className="flex items-center gap-2 py-2 cursor-pointer"
  onClick={() => {
    setPayment("any");
    setOpenFilter(null);
  }}
>
  <input
    type="radio"
    name="payment"
    value="any"
    checked={payment === "any"}
    onChange={() => {
      setPayment("any");
      setOpenFilter(null);
    }}
  />
  <span className="text-sm text-gray-800">Minden lehetőség</span>
</label>

<label
  className="flex items-center gap-2 py-2 cursor-pointer"
  onClick={() => {
    setPayment("now");
    setOpenFilter(null);
  }}
>
  <input
    type="radio"
    name="payment"
    value="now"
    checked={payment === "now"}
    onChange={() => {
      setPayment("now");
      setOpenFilter(null);
    }}
  />
  <span className="text-sm text-gray-800">Fizetés most</span>
</label>

<label
  className="flex items-center gap-2 py-2 cursor-pointer"
  onClick={() => {
    setPayment("hotel");
    setOpenFilter(null);
  }}
>
  <input
    type="radio"
    name="payment"
    value="hotel"
    checked={payment === "hotel"}
    onChange={() => {
      setPayment("hotel");
      setOpenFilter(null);
    }}
  />
  <span className="text-sm text-gray-800">Fizetés a szállodában</span>
</label>
      </div>
    )}
  </div>

    {/* Cancellation */}
  <div className="relative">
    <button type="button" className={chipClass} onClick={() => toggle("cancel")}>
      Lemondási feltételek <span className="ml-1">▾</span>
    </button>

    {openFilter === "cancel" && (
      <div className="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-20">
        <p className="text-xs font-semibold text-gray-500 mb-2">Lemondás</p>

        <label className="flex items-center gap-2 py-2 cursor-pointer">
          <input type="radio" checked={cancel === "all"} onChange={() => {
  setCancel("all");
  setOpenFilter(null);
}} />
          <span className="text-sm text-gray-800">Minden lehetőség</span>
        </label>

        <label className="flex items-center gap-2 py-2 cursor-pointer">
          <input type="radio" checked={cancel === "free"} onChange={() => {
  setCancel("free");
  setOpenFilter(null);
}} />
          <span className="text-sm text-gray-800">Ingyenes lemondással</span>
        </label>

        <label className="flex items-center gap-2 py-2 cursor-pointer">
  <input
    type="radio"
    checked={cancel === "non_refundable"}
    onChange={() => {
      setCancel("non_refundable");
      setOpenFilter(null);
    }}
  />
  <span className="text-sm text-gray-800">Nem visszatéríthető</span>
</label>
      </div>
    )}
  </div>

</div>   
</div>   
</div>  

{/* ── Room cards ── */}
      <div className="relative p-4 sm:p-5 space-y-3 min-h-[220px]">
  {filteredRoomGroups.length === 0 ? (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="font-semibold text-gray-900">Nincs találat a szűrőkre</div>
      <div className="text-sm text-gray-600 mt-1">
        Próbáld meg visszaállítani a szűrőket (pl. Étkezés/Fizetés), mert erre a kombinációra nincs elérhető ajánlat.
      </div>
    </div>
  ) : (
    filteredRoomGroups.map((group, index) => (
      <RoomCard
        key={`${group.roomName}-${index}`}
        group={group}
        onBook={onBook}
        nights={nights}
      />
    ))
  )}
</div>
    </section>
  );
};

export default RoomList;
