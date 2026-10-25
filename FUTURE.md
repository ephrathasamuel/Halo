# Halo Future Production Roadmap (FUTURE.md)

This document outlines the architectural migration roadmap, infrastructural enhancements, and feature extensions required to transition Halo from a frontend-only capstone prototype into a production-scale marketplace for Addis Ababa.

---

## 1. Backend & Data Layer Migration

```
Current Architecture (Capstone):
Browser Client  ──►  localStorage (halo_*_v1)  ──►  lib/domain/* (Frontend Checks)

Target Production Architecture:
Next.js Server  ──►  Next.js Server Actions / API Routes  ──►  PostgreSQL (Supabase / Prisma)
                             │
                             ├──►  TeleBirr Payment Webhook Gateway
                             └──►  Cloudflare R2 / S3 Object Storage
```

### 1.1 Relational Database Schema
- **Database Engine:** PostgreSQL hosted on Supabase or Neon.
- **ORM:** Prisma or Drizzle with strict foreign key constraints:
  - `User` 1:N `Booking`, `EventRequest`, `Review`.
  - `Provider` 1:N `Listing`, `PortfolioItem`, `Booking`.
  - `Listing` composite indices on `(providerId, status)` and `(type, status)` for sub-millisecond catalogue filtering.
- **ACID Transactions:** Database-level locking (`SELECT ... FOR UPDATE`) during slot checkout to guarantee zero double-booking even under concurrent race conditions.

---

## 2. Real Payment Integration: TeleBirr & Ethiopian Gateways

The current `/checkout` route features a mock TeleBirr interface with simulated transaction references. Production deployment will integrate official Ethiopian payment providers:

1. **TeleBirr Merchant Direct API (Ethio Telecom):**
   - Hashing transaction payloads with RSA private keys.
   - Handling asynchronous USSD push notifications and instant STK prompts on customer handsets.
   - Processing webhook callbacks with HMAC signature verification.
2. **Alternative Gateways:**
   - **Chapa API:** Support for international credit/debit cards (Visa/Mastercard) for Diaspora Ethiopian clients booking wedding coverage from abroad.
   - **CBE Birr & Commercial Bank of Ethiopia Webhooks.**
3. **Escrow & Automated Payouts:**
   - Holding funds in platform escrow until service delivery or studio checkout completion.
   - Automated deduction of the 10% platform fee and scheduled batch payouts to provider bank accounts.

---

## 3. Real-Time Messaging & Operational Features (Stretch Scope)

### 3.1 Equipment Handover & Return Digital Checklist
- Interactive mobile checklist for equipment rentals (`New`, `Excellent`, `Good`, `Fair`).
- High-resolution condition photos uploaded upon physical handover and return.
- Digital sign-off and instant deposit refund release upon inspection.

### 3.2 Production Crew Tracking on Event Days
- Live simulated/GPS crew dispatch status on wedding shoot days:
  `Equipment Packed` → `En Route to Venue` → `Setup Complete` → `Cameras Rolling` → `Wrap & Backup`.
- Real-time client SMS alerts powered by Africa's Talking or local Ethiopian SMS aggregators.

### 3.3 Bundled Package Discounts
- Combined studio and equipment bundle pricing (e.g., *Main Studio + Cinema Camera Kit + LED Kit* at a 15% bundled discount).
- Automated bundle availability resolution across studio slots and equipment inventory counters.

---

## 4. Media Pipeline & High-Performance Storage

- **Storage:** Cloudflare R2 or AWS S3 with presigned client uploads.
- **Transformation:** Cloudflare Images / Sharp pipeline generating optimized AVIF and WebP responsive sizes for low-bandwidth mobile connections.
- **Video Previews:** Integration with Mux for streaming wedding highlight reels and portfolio teasers without excessive mobile bandwidth consumption.
