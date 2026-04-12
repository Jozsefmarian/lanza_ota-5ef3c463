import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type AnyObj = Record<string, any>;

interface HotelDescriptionProps {
  /**
   * Backward compatible:
   * - ha már van egy kész stringed, add át ide
   */
  description?: string;

  /**
   * Új: add át a hotel/info objektumot is (info vagy info.hotel),
   * és a komponens megkeresi benne a leírást több mezőben.
   */
  hotel?: AnyObj;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function stripHtml(input: string): string {
  // egyszerű, biztonságos “jó elég” tisztítás
  return input
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function joinParagraphs(value: any): string | null {
  // tipikus struktúrált formák támogatása
  // pl: description_struct?.[0]?.paragraphs -> string[]
  if (!value) return null;

  // ha már string:
  if (isNonEmptyString(value)) return value;

  // ha tömb stringekből:
  if (Array.isArray(value) && value.some(isNonEmptyString)) {
    return value.filter(isNonEmptyString).join("\n\n").trim() || null;
  }

  // ha objektum paragraphs mezővel:
  if (typeof value === "object") {
    const paragraphs = (value as any).paragraphs;
    if (Array.isArray(paragraphs) && paragraphs.some(isNonEmptyString)) {
      return paragraphs.filter(isNonEmptyString).join("\n\n").trim() || null;
    }
  }

  return null;
}

function pickFirstDescriptionText(description?: string, hotel?: AnyObj): string | null {
  // 1) direkt prop
  if (isNonEmptyString(description)) return description;

  // 2) hotel több lehetséges mezője
  const candidates: any[] = [
    hotel?.description,
    // struktúráltak:
    hotel?.description_struct?.[0]?.paragraphs,
    hotel?.description_struct?.[0],
    hotel?.details?.description,
    hotel?.details?.about,
    hotel?.about,
    hotel?.summary,
    hotel?.info?.description, // ha véletlenül “info” alá van csomagolva
    hotel?.info?.about,
  ];

  for (const c of candidates) {
    const joined = joinParagraphs(c);
    if (isNonEmptyString(joined)) return joined;
  }

  return null;
}

const HotelDescription: React.FC<HotelDescriptionProps> = ({ description, hotel }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const CHARACTER_LIMIT = 300;

  const descriptionText = useMemo(() => {
    const raw = pickFirstDescriptionText(description, hotel);
    if (!raw) return null;
    const cleaned = stripHtml(raw);
    return cleaned.length ? cleaned : null;
  }, [description, hotel]);

  if (!descriptionText) {
    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
          A szállodáról
        </h2>
        <p className="text-gray-600">
          Ehhez a szállodához most nincs elérhető leírás.
        </p>
      </section>
    );
  }

  const shouldTruncate = descriptionText.length > CHARACTER_LIMIT;
  const displayText =
    isExpanded || !shouldTruncate
      ? descriptionText
      : descriptionText.slice(0, CHARACTER_LIMIT).trim() + "…";

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">
        A szállodáról
      </h2>

      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 leading-relaxed text-base md:text-lg whitespace-pre-line">
          {displayText}
        </p>
      </div>

      {shouldTruncate && (
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm md:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-1 -ml-1"
        >
          {isExpanded ? (
            <>
              Mutass kevesebbet
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              Bővebben
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </section>
  );
};

export default HotelDescription;
