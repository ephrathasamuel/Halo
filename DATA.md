# Halo Data Architecture & Storage Schema (DATA.md)

This document specifies the client-side persistence schemas, storage key conventions, safe storage abstraction layer, and data integrity mechanisms used throughout Halo.

---

## 1. Storage Keys Directory

In accordance with Section 1.3 conventions, all storage keys use the prefix `halo_` and terminate with the version suffix `_v1`.

### 1.1 LocalStorage (Durable Demo Data)

| Key | Entity | Description |
|-----|--------|-------------|
| `halo_users_v1` | `User[]` | Registered accounts, role assignments, and suspension flags. |
| `halo_providers_v1` | `Provider[]` | Creative studios and gear rental companies (e.g. B Light). |
| `halo_listings_v1` | `Listing[]` | Studios, equipment packages, and event filming services. |
| `halo_portfolio_v1` | `PortfolioItem[]` | Showcase photos and production media tagged by event type. |
| `halo_bookings_v1` | `Booking[]` | Hourly studio and equipment rental transactions. |
| `halo_event_requests_v1` | `EventRequest[]` | Bespoke filming inquiries with production state machines. |
| `halo_quotes_v1` | `Quote[]` | Negotiated quote proposals with versioning and validity dates. |
| `halo_reviews_v1` | `Review[]` | 5-star ratings with optional single owner replies. |
| `halo_disputes_v1` | `Dispute[]` | Contested transactions submitted for admin arbitration. |
| `halo_announcements_v1` | `Announcement[]` | Platform-wide banners published by administrators. |

### 1.2 SessionStorage (Ephemeral Session State)

| Key | Description |
|-----|-------------|
| `halo_session_v1` | Authenticated user credentials (`userId`, `name`, `email`, `roles`). |
| `halo_checkout_draft_v1` | Selected timeslot, add-on equipment, and cost summary awaiting checkout completion. |

---

## 2. Entity Schemas & Validation Rules

### 2.1 User
```typescript
interface User {
  id: string;               // UUID (crypto.randomUUID())
  name: string;             // Display name (e.g. "Meron Tadesse")
  email: string;            // Lowercase unique identifier (no passwords stored)
  phone: string;            // Contact number (e.g. "+251911000002")
  roles: ('renter' | 'owner' | 'admin')[];
  status: 'active' | 'suspended';
  createdAt: string;        // ISO 8601 string
}
```

### 2.2 Provider
```typescript
interface Provider {
  id: string;
  ownerId: string;          // Foreign key -> User.id
  slug: string;             // Unique URL path (e.g. "b-light")
  name: string;             // Business name
  tagline: string;
  about: string;
  logo: string;             // Public image path
  cover: string;            // Banner image path
  brandColor: string;       // Hex color (e.g. "#D4AF37") injected as CSS variable
  city: string;             // "Addis Ababa"
  neighbourhood: string;    // "Bole", "Arada", "Kazanchis", etc.
  latitude: number;
  longitude: number;
  contact: {
    phone: string;
    whatsapp?: string;
    telegram?: string;
  };
  hours: {
    open: string;           // "08:00" (HH:mm)
    close: string;          // "20:00" (HH:mm)
  };
  status: 'pending' | 'approved' | 'suspended';
  createdAt: string;
}
```

### 2.3 Listing
```typescript
interface Listing {
  id: string;
  providerId: string;       // Foreign key -> Provider.id
  ownerId: string;          // Foreign key -> User.id
  type: 'studio' | 'equipment' | 'service';
  title: string;
  description: string;
  photos: string[];
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'inactive';
  createdAt: string;

  // Studio-specific fields
  hourlyRate?: number;      // Price in ETB
  minHours?: number;        // Default 2
  capacity?: number;
  amenities?: string[];
  bufferMinutes?: number;   // Turnover cleanup window (e.g. 15, 30, 45, 60 mins)
  blockedDates?: string[];  // ["YYYY-MM-DD", ...]

  // Equipment-specific fields
  category?: 'Camera' | 'Lighting' | 'Audio' | 'Lens' | 'Aerial' | 'Support' | 'Props';
  deposit?: number;         // Refundable equipment bond in ETB
  quantity?: number;        // Physical inventory count
  condition?: 'New' | 'Excellent' | 'Good' | 'Fair';

  // Service-specific fields
  eventTypes?: string[];    // ["Wedding", "Corporate Event", "Engagement", ...]
  startingFromHint?: number;// Informational baseline price in ETB
  pricingModel?: 'quote';   // Fixed string: quote-only
}
```

### 2.4 Booking (Hourly Rental)
```typescript
interface Booking {
  id: string;
  providerId: string;
  renterId: string;
  ownerId: string;
  date: string;             // YYYY-MM-DD
  startTime: string;        // HH:mm
  endTime: string;          // HH:mm
  hours: number;
  items: Array<{
    listingId: string;
    type: 'studio' | 'equipment';
    qty: number;
    rateSnapshot: number;   // Immutable hourly rate at booking time
    lineTotal: number;
  }>;
  subtotal: number;         // Total items cost
  deposit: number;          // Total equipment deposit (held separately)
  fee: number;              // 10% platform commission
  total: number;            // subtotal + fee (deposit paid upon physical handover)
  paymentStatus: 'pending' | 'paid' | 'refunded';
  status: 'requested' | 'confirmed' | 'in_progress' | 'completed' | 'declined' | 'cancelled' | 'reviewed' | 'disputed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}
```

### 2.5 EventRequest & Quote
```typescript
interface EventRequest {
  id: string;
  providerId: string;
  listingId: string;
  renterId: string;
  ownerId: string;
  eventType: string;
  date: string;
  startTime: string;
  durationHours: number;
  location: string;
  coverage: string;
  budgetHint: number;
  notes: string;
  agreedAmount: number | null;
  status: 'submitted' | 'under_review' | 'quoted' | 'accepted' | 'declined' | 'confirmed' | 'in_progress' | 'completed' | 'delivered' | 'reviewed' | 'disputed' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

interface Quote {
  id: string;
  requestId: string;        // Foreign key -> EventRequest.id
  amount: number;           // Total proposed quote in ETB
  inclusions: string[];     // Line items covered in quotation
  validUntil: string;       // Expiry date (YYYY-MM-DD)
  version: number;          // Incremental version integer (1, 2, 3...)
  status: 'sent' | 'accepted' | 'revised' | 'declined' | 'expired' | 'withdrawn';
}
```

---

## 3. Safe Storage Layer Implementation (Hard Rule 2)

All reads and writes interact exclusively with `lib/storage/readStorage.js` and `lib/storage/writeStorage.js`:

```javascript
// Never throws; returns fallback and auto-clears corrupted keys
const { data, recovered } = readStorage(STORAGE_KEYS.BOOKINGS, []);

// Traps QuotaExceededError and returns structured { ok, error }
const { ok, error } = writeStorage(STORAGE_KEYS.BOOKINGS, updatedBookings);
```

### Non-Destructive Seeding (`initializeDemoData`)
`initializeDemoData()` inspects each of the 10 storage keys. If a key is absent (`null`), it seeds the default baseline. If data is already present, it is **never overwritten**, allowing user actions and edits to persist across page reloads.
