# Halo Strategy Document: Creative Marketplace for Addis Ababa

## 1. Executive Summary

**Halo** is a localized digital marketplace connecting creative professionals (photographers, filmmakers, podcasters, event organizers) with studio spaces, high-end production equipment, and filming crews across Addis Ababa, Ethiopia.

Historically, creative resource discovery in Addis Ababa has been informal, fragmented, and heavily reliant on Telegram channels, personal phone calls, and unverified word-of-mouth recommendations. Halo formalizes this ecosystem by providing transparent hourly pricing in Ethiopian Birr (ETB), automated availability scheduling, guaranteed turnover cleanup buffers, digital quote negotiation, and unified storefronts.

---

## 2. Market Dynamics & Regional Challenges in Addis Ababa

### 2.1 The Creative Boom vs. Infrastructure Constraints
Addis Ababa is experiencing an explosion of media production, digital advertising, commercial fashion, and luxury wedding videography. However, creative entrepreneurs face significant operational friction:
1. **Capital-Intensive Equipment:** Cinema-grade camera bodies, anamorphic lenses, high-output LED fixtures, and audio kits are expensive due to import duties and foreign currency shortages. Equipment sharing and hourly rental are economic necessities.
2. **Space Scarcity & Urban Clustering:** Professional studios with acoustic treatment or infinity cycloramas are concentrated in specific neighbourhoods:
   - **Bole:** Premium commercial hubs and media agencies.
   - **Kazanchis:** Audio studios, podcast hubs, and international agency proximity.
   - **Arada / Piassa:** Heritage natural-light lofts and fashion shoot spaces.
   - **Megenagna & Sarbet:** Production houses, equipment rental hubs, and filming crews.
3. **Double-Booking & Maintenance Clashes:** Informal bookings frequently result in overlapping sessions where equipment has not been returned or studio spaces have not been cleaned between clients.

### 2.2 The Unique Dynamics of Event & Wedding Filming
In Ethiopia, weddings, engagements, and corporate banquets are large-scale celebrations involving multi-day shoots, aerial drone photography, and multiple videographers. These services cannot be priced with a simple flat hourly fee. They require a bespoke, iterative quoting mechanism that accounts for location, crew size, equipment tiers, and delivery turnaround.

---

## 3. Product Architecture & Multi-Tenancy Strategy

Halo balances marketplace aggregation with independent brand autonomy through a **white-label storefront model**:

```
                  ┌─────────────────────────────────┐
                  │        Halo Marketplace         │
                  │   (/browse, /studios, Search)   │
                  └───────────────┬─────────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
┌───────────────────────────┐                   ┌───────────────────────────┐
│     B Light Storefront    │                   │ Merkato Frames Storefront │
│   (/studios/b-light)      │                   │ (/studios/merkato-frames) │
│ Brand Accent: #D4AF37     │                   │ Brand Accent: #2D6A4F     │
│ Studio, Gear & Filming    │                   │ Natural Light Loft Studio │
└───────────────────────────┘                   └───────────────────────────┘
```

### 3.1 The Flagship Storefront: B Light (`/studios/b-light`)
- **Strategic Anchor:** B Light serves as the flagship proof-of-concept tenant. Located in Bole, B Light represents the ideal multi-offering provider:
  - **Main Studio:** Fixed hourly pricing with automated 30-minute turnover buffers.
  - **Equipment Rentals:** Camera, lighting, and audio equipment tracked by physical inventory.
  - **Wedding & Event Filming:** Dynamic quote-based service pipeline.
- **Brand Autonomy:** Through dynamic CSS variables (`--brand-color: #D4AF37`), B Light feels like a standalone bespoke destination while running on the standardized Halo infrastructure.

### 3.2 Standardization Across Providers
Every provider on Halo benefits from:
- Standardized hourly availability algorithms with collision detection.
- Unified reviews and rating badges.
- Standard mock TeleBirr checkout interface.
- 10% platform commission accounting model.

---

## 4. Monetization Model

Halo operates on a commission-based marketplace model:
1. **Platform Take Rate:** 10% platform commission on all hourly studio and equipment rentals (`fee = subtotal * 0.10`).
2. **Transparent Provider Earnings:** Providers receive net earnings (`earnings = subtotal - fee`) with separate refundable security deposits for equipment protection.
3. **Quote-Based Event Filming:** Future monetization will capture a 5–8% escrow processing fee upon client quote acceptance and deposit fulfillment.

---

## 5. Trust, Safety & Governance

In an emerging market without universal digital identity or credit scoring, trust is established through strict platform governance:
- **Provider Verification:** All provider storefronts remain `pending` until vetted by platform administrators.
- **Equipment Security Deposits:** Separate refundable deposits are tracked per rental to incentivize equipment care.
- **Mutual Review System:** Only verified renters with `completed` bookings can publish 5-star ratings; provider owners are granted a single public reply to maintain accountability.
- **Administrative Dispute Mediation:** In the event of damaged equipment or service disputes, an administrative center enables neutral arbitration and formal resolution recording.
