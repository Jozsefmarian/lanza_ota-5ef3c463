import React, { useMemo, useRef, useState } from "react";
import { Star, MapPin, Building2, Image as ImageIcon } from "lucide-react";
import ImageLightbox from "./ImageLightbox";


export interface HotelHeroProps {
  hotel?: any;
  name?: string;
  stars?: number;
  address?: string;
  images?: string[];
  price?: number;
  currency?: string;
  reviewScore?: number;
}

const PLACEHOLDER_IMAGE = "/placeholder.svg";
const MAX_IMAGES = 10;

function normalizeImageUrl(img: any): string | null {
  if (!img) return null;
  if (typeof img === "string") return img.replace("{size}", "1024x768");
  if (typeof img === "object" && img.url) return String(img.url).replace("{size}", "1024x768");
  return null;
}

const HotelHero: React.FC<HotelHeroProps> = ({
  hotel,
  name,
  stars,
  address,
  images: imagesProp,
  price,
  currency,
  reviewScore,
}) => {
  // ========== MEZŐNÉV-NORMALIZÁLÁS ==========
  const hotelName = hotel?.name ?? hotel?.title ?? name ?? "Hotel";

  const rawImages =
    hotel?.images ??
    hotel?.hotelImages ??
    hotel?.photos ??
    hotel?.image_urls ??
    imagesProp ??
    [];

  const images: string[] = useMemo(() => {
    const normalized = (Array.isArray(rawImages) ? rawImages : [])
      .map(normalizeImageUrl)
      .filter(Boolean) as string[];

    // Stabil debug-limit: max 10 kép
    return normalized.slice(0, MAX_IMAGES);
  }, [rawImages]);

  const hotelStars = hotel?.stars ?? hotel?.starRating ?? hotel?.star_rating ?? stars ?? 0;
  const hotelAddress = hotel?.address ?? hotel?.location?.address ?? address;
  const hotelReviewScore = hotel?.reviewScore ?? hotel?.review_score ?? hotel?.rating ?? reviewScore;
  const hotelPrice = hotel?.price ?? hotel?.min_price ?? price;
  const hotelCurrency = hotel?.currency ?? currency;
  // ========== NORMALIZÁLÁS VÉGE ==========

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchMoved = useRef(false);

  const getReviewBadge = (score: number) => {
    if (score >= 9) return { label: "Kiváló" };
    if (score >= 8) return { label: "Nagyon jó" };
    if (score >= 7) return { label: "Jó" };
    if (score >= 6) return { label: "Megfelelő" };
    return { label: "Elfogadható" };
  };

  const mainSrc = images[0] || PLACEHOLDER_IMAGE;

  return (
    <>
      {/* Hotel Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          {hotelStars > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex">
                {[...Array(hotelStars)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded ml-1">
                {hotelStars} csillagos szálloda
              </span>
            </div>
          )}

          {hotelReviewScore !== undefined && hotelReviewScore > 0 && (
            <div className="bg-black/70 text-white px-2 py-1 rounded-lg flex items-center gap-1.5">
              <span className="font-bold text-sm">{Number(hotelReviewScore).toFixed(1)}</span>
              <span className="text-xs">{getReviewBadge(Number(hotelReviewScore)).label}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{hotelName}</h1>

        {hotelAddress && (
          <p className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
            {hotelAddress}
          </p>
        )}
      </div>

            {/* Hero Images - Zenhotels layout (bal nagy + jobb 2x2) */}
      <div className="mb-6 relative">
        {images.length > 0 ? (
          <>
            {(() => {
              const main = images[0] || PLACEHOLDER_IMAGE;
              const grid = images.slice(1, 5);
              const extraCount = Math.max(0, images.length - 5);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                                                      {/* BAL: Fő kép (kb 60%) */}

                  {/* MOBIL: swipe-olható galéria (tap = lightbox, húzás = lapozás) */}
                  <div className="lg:hidden lg:col-span-7 rounded-xl overflow-hidden bg-gray-100 relative aspect-[16/10] w-full">
                    {/* scrollbar elrejtése mobilon */}
                    <style>{`
                      .no-scrollbar::-webkit-scrollbar { display: none; }
                    `}</style>

                    <div
                      className="no-scrollbar flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none]"
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        if (idx !== mobileIndex) setMobileIndex(idx);
                      }}
                    >
                      {images.slice(0, 10).map((src, idx) => (
                        <div
                          key={src + idx}
                          className="w-full h-full shrink-0 snap-center relative"
                          onTouchStart={(e) => {
  touchStartX.current = e.touches[0]?.clientX ?? null;
  touchMoved.current = false;
}}
onTouchMove={(e) => {
  if (touchStartX.current === null) return;
  const x = e.touches[0]?.clientX ?? touchStartX.current;
  if (Math.abs(x - touchStartX.current) > 8) touchMoved.current = true;
}}
onTouchEnd={() => {
  if (!touchMoved.current) setLightboxIndex(idx);
  touchStartX.current = null;
  touchMoved.current = false;
}}
                        >
                          <img
                            src={src}
                            alt={`${hotelName} - ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading={idx === 0 ? "eager" : "lazy"}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                            }}
                          />
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                        </div>
                      ))}
                    </div>

                    {/* pöttyök */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {Array.from({ length: Math.min(7, images.length) }).map((_, i) => {
                        const active = i === Math.min(mobileIndex, 6);
                        return (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-white/50"}`}
                          />
                        );
                      })}
                    </div>

                  </div>
                  {/* DESKTOP: marad a kattintós lightbox */}
                  <button
                    type="button"
                    className="hidden lg:block lg:col-span-7 rounded-xl group cursor-pointer overflow-hidden bg-gray-100 relative aspect-[16/10] w-full"
                    onClick={() => setLightboxIndex(0)}
                    aria-label="Fő kép megnyitása"
                  >
                    <img
                      src={main}
                      alt={hotelName}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      loading="eager"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/35 via-transparent to-black/10" />

                    <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      {images.length} fotó
                    </div>
                  </button>



                  {/* JOBB: 2x2 rács + rating panel (kb 40%) */}
                  <div className="lg:col-span-5 hidden lg:grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((i) => {
                      const src = grid[i] || main || PLACEHOLDER_IMAGE;
                      const idx = i + 1; // mert 0 a main
                      return (
                        <button
                          key={src + i}
                          type="button"
                          className="rounded-xl overflow-hidden group bg-gray-100 relative aspect-[4/3] w-full"
                          onClick={() => setLightboxIndex(Math.min(idx, images.length - 1))}
                          aria-label={`Kép ${idx + 1} megnyitása`}
                        >
                          <img
                            src={src}
                            alt={`${hotelName} - ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                            }}
                          />
                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-black/5" />

                          {/* Utolsó csempén “+N” overlay, ha van még több kép */}
                          {i === 3 && extraCount > 0 && (
                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center text-white font-semibold text-lg">
                              +{extraCount} fénykép
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {/* MOBIL: swipe thumbnail sor */}
<div className="lg:hidden mt-2">
  <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
    {images.slice(0, 12).map((src, idx) => (
      <button
        key={src + idx}
        type="button"
        className="shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-gray-100 relative"
        onClick={() => setLightboxIndex(idx)}
        aria-label={`Kép ${idx + 1} megnyitása`}
      >
        <img
          src={src}
          alt={`${hotelName} - ${idx + 1}`}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMAGE;
          }}
        />
      </button>
    ))}

    {images.length > 12 && (
      <button
        type="button"
        className="shrink-0 w-24 h-16 rounded-lg overflow-hidden bg-black/50 text-white font-semibold flex items-center justify-center"
        onClick={() => setLightboxIndex(0)}
      >
        +{images.length - 12}
      </button>
    )}
  </div>
</div>

                    {/* “Összes fotó” gomb – a rács felett, jobb felső sarokban (desktop) */}
                    <div className="col-span-2 flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(0)}
                        className="text-sm px-3 py-2 rounded-lg bg-white/95 border shadow-sm hover:bg-white"
                      >
                        Összes fotó
                      </button>
                    </div>

                    {/* Rating panel (wireframe szerint jobb oldali panel jelleg) */}
                    {hotelReviewScore !== undefined && Number(hotelReviewScore) > 0 && (
                      <div className="col-span-2 rounded-xl bg-white border shadow-sm p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-black text-white rounded-lg px-3 py-2 font-bold">
                            {Number(hotelReviewScore).toFixed(1)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {getReviewBadge(Number(hotelReviewScore)).label}
                            </div>
                            <div className="text-sm text-gray-500">
                              (Értékelések hamarosan)
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ár panel a jobb felső sarokban, a teljes blokk tetején */}
                  {hotelPrice !== undefined && hotelCurrency && (
                    <div className="lg:col-span-12 relative">
                      <div className="absolute -top-2 right-0 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg px-4 py-2">
                        <p className="text-xs text-gray-500">Ártól</p>
                        <p className="text-xl font-bold text-purple-600">
                          {Number(hotelPrice).toLocaleString()}{" "}
                          <span className="text-sm font-normal">{hotelCurrency}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
                        {lightboxIndex !== null && (
              <ImageLightbox
                images={images}
                initialIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </>
        ) : (
          <div className="bg-gray-200 rounded-xl aspect-video flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Building2 className="w-16 h-16 mx-auto mb-2" />
              <span className="text-sm">Nincs elérhető kép</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default HotelHero;
