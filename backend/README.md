# RateHawk API Backend

Ez a mappa tartalmazza a RateHawk API-hoz kapcsolódó Edge Functions-öket.

## Famous Backend Konfiguráció

Ez a projekt a Famous-provided Supabase-kompatibilis backendet használja. A frontend automatikusan csatlakozik a Famous backendhez a `src/lib/supabase.ts` fájlban található hardcoded hitelesítő adatokkal.

**FONTOS:** Nem szükséges VITE_SUPABASE_URL vagy VITE_SUPABASE_ANON_KEY környezeti változókat beállítani. A hitelesítő adatok már be vannak ágyazva a kódba.

## Elérhető Edge Functions

### 1. ratehawk-search
Szállások keresése régió, koordináták vagy hotel ID-k alapján.

### 2. ratehawk-hotel
Egy adott hotel részletes adatainak és szobáinak lekérése.

### 3. ratehawk-prebook
Ár és elérhetőség ellenőrzése foglalás előtt.

### 4. ratehawk-book
Foglalás véglegesítése.

### 5. ratehawk-check-booking
Meglévő foglalás státuszának lekérdezése.

## Frontend Használat

A frontend a `src/lib/api.ts` fájlban található függvényeket használja az Edge Functions hívásához:

```typescript
import { searchHotels, getHotelDetails, prebookRate, createBooking, checkBooking } from '@/lib/api';

// Keresés
const results = await searchHotels({
  regionId: 2114, // Budapest
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

## Backend Credentials (Edge Functions)

Az Edge Functions a RateHawk API-hoz kapcsolódnak. A RateHawk hitelesítő adatokat (RATEHAWK_USER_ID, RATEHAWK_API_KEY) a Famous backend secrets-ben kell beállítani.

Lásd: `backend/.env.example` a szükséges változókhoz.

## API Dokumentáció

Részletes API dokumentáció: `backend/api-docs.md`
