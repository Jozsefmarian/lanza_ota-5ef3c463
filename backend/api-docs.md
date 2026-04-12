# API Dokumentáció - Lanzaventura Travel Webapp

## Áttekintés

Ez a dokumentáció a Lanzaventura utazási webapp backend API-jait írja le. Minden API hívás a Supabase Edge Functions-ön keresztül történik.

A rendszer két fő API integrációt használ:
1. **RateHawk** – szálláskereső (ratehawk-* edge functions)
2. **Aviasales / Travelpayouts** – repülőjegy-kereső (aviasales-* edge functions)

---

# I. RateHawk Szállás API

## 1. Szálláskeresés (`ratehawk-search`)

Szállások keresése régió, koordináták vagy hotel ID-k alapján.

### Request

```typescript
POST /functions/v1/ratehawk-search

{
  // Keresés régió alapján (opcionális)
  "regionId": 2114,  // pl. Budapest = 2114
  
  // VAGY keresés koordináták alapján (opcionális)
  "latitude": 47.4979,
  "longitude": 19.0402,
  "radius": 10000,  // méterben, alapértelmezett: 10000
  
  // VAGY keresés hotel ID-k alapján (opcionális)
  "hotelIds": [123456, 789012],
  
  // Kötelező mezők
  "checkin": "2024-06-01",   // YYYY-MM-DD formátum
  "checkout": "2024-06-05",  // YYYY-MM-DD formátum
  "guests": [
    {
      "adults": 2,
      "children": [5, 10]  // gyerekek életkora (opcionális)
    }
  ],
  
  // Opcionális mezők
  "currency": "EUR",      // alapértelmezett: EUR
  "language": "hu",       // alapértelmezett: hu
  "residency": "hu"       // alapértelmezett: hu
}
```

### Response

```typescript
{
  "success": true,
  "totalHotels": 150,
  "hotels": [
    {
      "id": 123456,
      "name": "Hotel Example Budapest",
      "starRating": 4,
      "rates": [
        {
          "searchHash": "abc123...",
          "matchHash": "def456...",
          "roomName": "Deluxe Double Room",
          "meal": "breakfast",
          "hasBreakfast": true,
          "price": "150.00",
          "currency": "EUR",
          "freeCancellation": "2024-05-28T23:59:59",
          "amenities": ["wifi", "parking", "pool"],
          "allotment": 5
        }
      ]
    }
  ]
}
```

### Hibák

```typescript
{
  "success": false,
  "error": "Check-in and check-out dates are required"
}
```

---

## 2. Hotel Részletek (`ratehawk-hotel`)

Egy adott hotel részletes adatainak és szobáinak lekérése.

### Request

```typescript
POST /functions/v1/ratehawk-hotel

{
  "hotelId": 123456,
  "checkin": "2024-06-01",
  "checkout": "2024-06-05",
  "guests": [
    {
      "adults": 2,
      "children": []
    }
  ],
  "currency": "EUR",
  "language": "hu",
  "residency": "hu"
}
```

### Response

```typescript
{
  "success": true,
  "hotel": {
    "id": 123456,
    "name": "Hotel Example Budapest",
    "address": "Példa utca 123, Budapest, 1051",
    "starRating": 4,
    "images": [
      "https://photos.ratehawk.com/...",
      "https://photos.ratehawk.com/..."
    ],
    "description": "A hotel leírása...",
    "amenities": ["wifi", "parking", "restaurant", "spa"],
    "checkInTime": "14:00",
    "checkOutTime": "11:00",
    "latitude": 47.4979,
    "longitude": 19.0402,
    "rates": [
      {
        "bookHash": "xyz789...",
        "roomName": "Deluxe Double Room",
        "roomDescription": "Tágas szoba két fő részére...",
        "meal": "breakfast",
        "hasBreakfast": true,
        "price": "150.00",
        "currency": "EUR",
        "originalPrice": "180.00",
        "freeCancellation": "2024-05-28T23:59:59",
        "cancellationPolicies": [...],
        "amenities": ["wifi", "minibar", "safe"],
        "allotment": 5,
        "bedding": {...},
        "rg_ext": {...}
      }
    ]
  }
}
```

---

## 3. Előfoglalás (`ratehawk-prebook`)

Ár és elérhetőség ellenőrzése foglalás előtt.

### Request

```typescript
POST /functions/v1/ratehawk-prebook

{
  // Egyik kötelező
  "bookHash": "xyz789...",     // Hotel részletekből
  // VAGY
  "searchHash": "abc123..."    // Keresési eredményből
}
```

### Response

```typescript
{
  "success": true,
  "prebook": {
    "available": true,
    "prebookHash": "prebook123...",
    "hotelId": 123456,
    "hotelName": "Hotel Example Budapest",
    "roomName": "Deluxe Double Room",
    "checkin": "2024-06-01",
    "checkout": "2024-06-05",
    "guests": {...},
    "price": {
      "amount": "150.00",
      "currency": "EUR",
      "originalAmount": "180.00",
      "originalCurrency": "EUR"
    },
    "cancellationPolicy": {
      "freeCancellationBefore": "2024-05-28T23:59:59",
      "policies": [...]
    },
    "meal": {...},
    "amenities": ["wifi", "breakfast"],
    "taxes": {...},
    "vat": {...},
    "depositRequired": null,
    "noShow": {...},
    "requiredFields": ["first_name", "last_name", "email", "phone"],
    "paymentTypes": ["deposit", "now"]
  }
}
```

---

## 4. Foglalás (`ratehawk-book`)

Foglalás véglegesítése.

### Request

```typescript
POST /functions/v1/ratehawk-book

{
  "prebookHash": "prebook123...",
  "partnerOrderId": "MY-ORDER-12345",  // opcionális, saját rendelés azonosító
  "guests": [
    {
      "firstName": "János",
      "lastName": "Kovács",
      "isAdult": true
    },
    {
      "firstName": "Mária",
      "lastName": "Kovács",
      "isAdult": true
    }
  ],
  "contactInfo": {
    "email": "janos.kovacs@example.com",
    "phone": "+36301234567"
  },
  "specialRequests": "Magas emeleti szobát kérnénk",  // opcionális
  "language": "hu"
}
```

### Response

```typescript
{
  "success": true,
  "booking": {
    "orderId": "RH-123456789",
    "partnerOrderId": "MY-ORDER-12345",
    "status": "confirmed",
    "hotelName": "Hotel Example Budapest",
    "roomName": "Deluxe Double Room",
    "checkin": "2024-06-01",
    "checkout": "2024-06-05",
    "guests": [...],
    "contactInfo": {
      "email": "janos.kovacs@example.com",
      "phone": "+36301234567"
    },
    "price": {
      "amount": "150.00",
      "currency": "EUR"
    },
    "confirmationNumber": "CONF-ABC123",
    "createdAt": "2024-05-15T10:30:00Z"
  }
}
```

---

## 5. Foglalás Ellenőrzése (`ratehawk-check-booking`)

Meglévő foglalás státuszának lekérdezése.

### Request

```typescript
POST /functions/v1/ratehawk-check-booking

{
  // Egyik kötelező
  "orderId": "RH-123456789",
  // VAGY
  "partnerOrderId": "MY-ORDER-12345"
}
```

### Response

```typescript
{
  "success": true,
  "booking": {
    "orderId": "RH-123456789",
    "partnerOrderId": "MY-ORDER-12345",
    "status": "confirmed",
    "statusText": "Megerősítve",
    "hotelId": 123456,
    "hotelName": "Hotel Example Budapest",
    "hotelAddress": "Példa utca 123, Budapest, 1051",
    "roomName": "Deluxe Double Room",
    "checkin": "2024-06-01",
    "checkout": "2024-06-05",
    "guests": [
      {
        "firstName": "János",
        "lastName": "Kovács",
        "isAdult": true
      }
    ],
    "contactInfo": {
      "email": "janos.kovacs@example.com",
      "phone": "+36301234567"
    },
    "price": {
      "amount": "150.00",
      "currency": "EUR",
      "isPaid": true
    },
    "confirmationNumber": "CONF-ABC123",
    "cancellation": {
      "isCancellable": true,
      "freeCancellationBefore": "2024-05-28T23:59:59",
      "penaltyAmount": null
    },
    "createdAt": "2024-05-15T10:30:00Z",
    "modifiedAt": "2024-05-15T10:30:00Z"
  }
}
```

---

## Foglalás Státuszok

| Státusz | Magyar | Leírás |
|---------|--------|--------|
| `pending` | Függőben | Foglalás feldolgozás alatt |
| `confirmed` | Megerősítve | Foglalás sikeresen megerősítve |
| `cancelled` | Lemondva | Foglalás lemondva |
| `completed` | Teljesítve | Vendég kijelentkezett |
| `no_show` | Nem jelent meg | Vendég nem jelent meg |

---

## Régió ID-k (Példák)

| Város | Region ID |
|-------|-----------|
| Budapest | 2114 |
| Bécs | 2949 |
| Prága | 2734 |
| Párizs | 2734 |
| London | 2114 |
| Barcelona | 2657 |
| Róma | 2624 |

A teljes régió listát a RateHawk API `/region/list/` endpointján keresztül lehet lekérni.

---

## Pénznemek

Támogatott pénznemek: EUR, USD, GBP, HUF, CZK, PLN, CHF, stb.

---

## Hibakódok

| Kód | Jelentés |
|-----|----------|
| 400 | Hibás kérés (hiányzó vagy érvénytelen paraméterek) |
| 401 | Hitelesítési hiba (érvénytelen API kulcs) |
| 404 | Nem található (hotel, foglalás) |
| 429 | Túl sok kérés (rate limit) |
| 500 | Szerver hiba |

---

## Frontend Használat (RateHawk)

```typescript
import { searchHotels, getHotelDetails, prebookRate, createBooking, checkBooking } from '@/lib/api';

// Keresés
const results = await searchHotels({
  regionId: 2114,
  checkin: '2024-06-01',
  checkout: '2024-06-05',
  guests: [{ adults: 2 }]
});

// Hotel részletek
const hotel = await getHotelDetails({
  hotelId: 123456,
  checkin: '2024-06-01',
  checkout: '2024-06-05',
  guests: [{ adults: 2 }]
});

// Előfoglalás
const prebook = await prebookRate({
  bookHash: hotel.hotel.rates[0].bookHash
});

// Foglalás
const booking = await createBooking({
  prebookHash: prebook.prebook.prebookHash,
  guests: [
    { firstName: 'János', lastName: 'Kovács', isAdult: true }
  ],
  contactInfo: {
    email: 'janos@example.com',
    phone: '+36301234567'
  }
});

// Foglalás ellenőrzés
const status = await checkBooking({
  orderId: booking.booking.orderId
});
```

---
---

# II. Aviasales Repülőjegy-kereső API

Az Aviasales / Travelpayouts Flights Search API integrációja két Supabase Edge Function-ön keresztül érhető el. A meglévő RateHawk funkciókhoz nem nyúl, teljesen külön névteret használ.

## Fontos szabályok

1. Minden keresés felhasználói akcióhoz kötött (nem szabad automatikusan keresni).
2. Minden találathoz "Foglalás" (Buy/Book) gomb tartozik.
3. A foglalási/ügynökségi linket **kizárólag** a "Foglalás" gomb kattintásakor szabad generálni (`aviasales-click`).
4. Rate limit: 100 request / óra / user IP.
5. Az API-t kizárólag szerveroldalról hívjuk (Edge Functions), kliens oldali közvetlen hívás tilos.

## Környezeti változók

| Változó | Leírás |
|---------|--------|
| `TRAVELPAYOUTS_API_TOKEN` | Travelpayouts API token (x-affiliate-user-id header) |
| `TRAVELPAYOUTS_MARKER_ID` | Travelpayouts partner/marker ID |

---

## 6. Repülőjegy keresés (`aviasales-search`)

Járatok keresése az Aviasales Flights Search API-n keresztül. Az edge function elrejti a kliens elől a "start search" + "results poll" folyamatot, és egy normalizált járatlistát ad vissza.

### Request

```typescript
POST /functions/v1/aviasales-search

interface AviasalesSearchRequest {
  origin: string;          // IATA kód, pl. "BUD"
  destination: string;     // IATA kód, pl. "ACE"
  departureDate: string;   // "YYYY-MM-DD"
  returnDate?: string;     // opcionális, "YYYY-MM-DD" (oda-vissza)
  adults: number;          // 1–9
  children?: number;       // 0–6
  infants?: number;        // 0–6, max infants <= adults
  currency?: string;       // pl. "EUR", "HUF" – default: "EUR"
  locale?: string;         // pl. "hu" – default: "hu"
  marketCode?: string;     // pl. "HU" – default: "HU"
  tripClass?: 'Y' | 'C' | 'F' | 'W'; // economy / business / first / comfort – default: 'Y'
}
```

### Példa request

```json
{
  "origin": "BUD",
  "destination": "ACE",
  "departureDate": "2026-04-15",
  "returnDate": "2026-04-22",
  "adults": 2,
  "children": 0,
  "infants": 0,
  "currency": "EUR",
  "locale": "hu",
  "tripClass": "Y"
}
```

### Működés (belső)

1. Validálja a bemenetet (kötelező mezők, dátumok, utasszámok).
2. Összeállítja az Aviasales "start search" kérést:
   - URL: `POST https://tickets-api.travelpayouts.com/search/affiliate/start`
   - Body: marker, market_code, currency_code, locale, signature, search_params
   - Headers: Content-Type, x-affiliate-user-id, x-signature, x-user-ip, x-real-host
3. Signature generálás: md5 hash a token + összes paraméterérték ABC-sorrendben, `:` elválasztóval.
4. Kiolvassa a válaszból: `search_id`, `results_url`.
5. Ciklikusan hívja a "Get Search Results" endpointot (`{results_url}/search/affiliate/results`):
   - Body: `{ "search_id": ..., "last_update_timestamp": 0 }` (első hívás), utána az előző válasz timestamp-jét.
   - Max 30 másodperc várakozás, 1.5 mp szünet hívások között.
6. A válasz tickets/proposals/flight_legs struktúrájából normalizált járatlistát állít össze.

### Response

```typescript
interface AviasalesSearchResult {
  success: boolean;
  searchId?: string;          // Aviasales search_id
  resultsUrl?: string;        // Aviasales results_url (click endpointhoz)
  flights?: AviasalesFlightOption[];
  totalResults?: number;
  isComplete?: boolean;       // true ha a keresés befejeződött
  airlines?: Record<string, any>;
  agents?: Record<string, any>;
  error?: string;
  message?: string;
}

interface AviasalesFlightOption {
  id: string;                  // `${search_id}_${proposal_id}`
  proposalId: string;          // proposals[].id – a "Foglalás" híváshoz kell
  searchId: string;            // Aviasales search_id
  resultsUrl: string;          // Aviasales results_url
  ticketSignature: string;     // ticket signature
  from: string;                // origin IATA
  to: string;                  // destination IATA
  departureLocal: string;      // helyi indulási idő
  arrivalLocal: string;        // helyi érkezési idő
  durationMinutes: number;     // teljes utazási idő percben
  stops: number;               // átszállások száma
  stopAirports: string[];      // átszállási repülőterek IATA kódjai
  segments: AviasalesSegment[];// részletes szegmens info
  airlineCodes: string[];      // légitársaság IATA kódok
  airlineNames: string[];      // légitársaság nevek
  airlineLogos: string[];      // légitársaság logó URL-ek
  price: number;               // teljes ár
  pricePerPerson: number;      // ár/fő
  currency: string;            // pénznem
  agentId: number;             // ügynökség ID
  agentName: string;           // ügynökség neve
  baggageIncluded: boolean;    // tartalmaz-e poggyászt
  baggageWeight: number | null;// poggyász súly (kg)
  handbagsIncluded: boolean;   // tartalmaz-e kézipoggyászt
  handbagsWeight: number | null;// kézipoggyász súly (kg)
  tripClass: string;           // utazási osztály
  seatsAvailable: number | null;// elérhető helyek száma (1-9, ha van)
  isLowcost: boolean;          // fapados-e
  isReturn: boolean;           // oda-vissza jegy-e
  returnDepartureLocal?: string;
  returnArrivalLocal?: string;
  returnDurationMinutes?: number;
  returnStops?: number;
  returnStopAirports?: string[];
  returnSegments?: AviasalesSegment[];
}

interface AviasalesSegment {
  from: string;                // IATA
  to: string;                  // IATA
  departureLocal: string;      // helyi indulás
  arrivalLocal: string;        // helyi érkezés
  durationMinutes: number;     // szegmens időtartam
  airlineCode: string;         // légitársaság IATA
  flightNumber: string;        // járatszám
  aircraft: string;            // repülőgép típus
}
```

### Hibakódok

| Kód | Jelentés |
|-----|----------|
| 400 | Hibás kérés (validációs hiba) |
| 429 | Rate limit (100 req/óra/IP) |
| 500 | Szerver hiba |
| 502 | Aviasales API hiba |

---

## 7. Foglalási link generálás (`aviasales-click`)

A "Foglalás" (Buy/Book) gomb kattintásakor hívandó. Generálja az ügynökségi/légitársasági foglalási linket.

**FONTOS:** Ezt az endpointot kizárólag felhasználói kattintásra szabad hívni! Automatikus link-gyűjtés tilos és az API hozzáférés elvesztéséhez vezet.

### Request

```typescript
POST /functions/v1/aviasales-click

interface AviasalesClickRequest {
  proposalId: string;   // Az AviasalesFlightOption.proposalId
  searchId: string;     // Az AviasalesFlightOption.searchId
  resultsUrl: string;   // Az AviasalesFlightOption.resultsUrl
}
```

### Példa request

```json
{
  "proposalId": "abc123def456",
  "searchId": "xyz789",
  "resultsUrl": "https://search-results.travelpayouts.com"
}
```

### Response

```typescript
interface AviasalesClickResult {
  success: boolean;
  url?: string | null;    // Foglalási link (új ablakban nyitandó)
  rawResponse?: any;      // Debug: teljes API válasz (ha nincs URL)
  error?: string;
  message?: string;
}
```

### Hibakódok

| Kód | Jelentés |
|-----|----------|
| 400 | Hibás kérés (hiányzó paraméter) |
| 429 | Rate limit |
| 500 | Szerver hiba |
| 502 | Aviasales API hiba |

---

## Frontend Használat (Aviasales)

```typescript
import { searchFlights, getFlightBookingLink } from '@/lib/api';
import type { AviasalesSearchParams, AviasalesFlightOption } from '@/lib/api';

// Járat keresés
const results = await searchFlights({
  origin: 'BUD',
  destination: 'ACE',
  departureDate: '2026-04-15',
  returnDate: '2026-04-22',
  adults: 2,
  currency: 'EUR',
  tripClass: 'Y'
});

if (results.success && results.flights) {
  // Járatok megjelenítése
  results.flights.forEach(flight => {
    console.log(`${flight.from} → ${flight.to}: ${flight.price} ${flight.currency}`);
  });
}

// Foglalási link generálás (CSAK felhasználói kattintásra!)
const handleBuyClick = async (flight: AviasalesFlightOption) => {
  const clickResult = await getFlightBookingLink({
    proposalId: flight.proposalId,
    searchId: flight.searchId,
    resultsUrl: flight.resultsUrl,
  });

  if (clickResult.success && clickResult.url) {
    window.open(clickResult.url, '_blank');
  }
};
```

---

## Légitársaság és ügynökség logók

- **Légitársaság logó:** `http://img.wway.io/pics/root/{IATA}@png?exar=1&rs=fit:{width}:{height}`
  - Példa: `http://img.wway.io/pics/root/W6@png?exar=1&rs=fit:200:200` (Wizz Air)
- **Ügynökség logó:** `http://img.wway.io/pics/as_gates/{id}@png?exar=1&rs=fit:{width}:{height}`
  - Példa: `http://img.wway.io/pics/as_gates/70@png?exar=1&rs=fit:110:70`
- **Retina:** szélesség és magasság duplázása

---

## Signature generálás (belső, Edge Function)

1. A request body-ból (signature mező nélkül) ABC-sorrendben kigyűjti az összes értéket.
2. Beágyazott objektumok/tömbök külön rendezve, de a helyükön maradnak.
3. Az értékeket `:` karakterrel összefűzi.
4. A token-t az elejére illeszti: `{token}:{value1}:{value2}:...`
5. MD5 hash-t számol az eredményből.

Példa:
```
Token:USD:en_US:Marker:US:2026-09-09:NYC:LAX:2026-09-25:LAX:NYC:1:0:0:Y
→ md5 hash → signature
```
