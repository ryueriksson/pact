# Pact — System Architecture

## Overview

Pact is a SaaS platform that combines proposal creation, e-signature, and payment collection into a single shareable link. Built to scale to millions of users from day one.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, one repo, edge-ready, Vercel-native |
| Language | TypeScript (strict) | Type safety end-to-end |
| Database | PostgreSQL via Railway | Relational, ACID, scales vertically + read replicas |
| ORM | Prisma | Type-safe queries, migrations, connection pooling |
| Auth | NextAuth.js v5 | JWT sessions, Google OAuth + email/password |
| Payments | Stripe Checkout + Webhooks | Industry standard, PCI compliant |
| Email | Resend | Developer-first, high deliverability |
| UI | Tailwind CSS + shadcn/ui | Fast iteration, accessible components |
| Validation | Zod | Runtime + compile-time safety |
| Deployment | Vercel (app) + Railway (DB) | Zero-config, auto-scaling |
| Storage | Vercel Blob | Simple signed URL uploads (PDFs, signatures) |

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        CLIENT                           │
│  Browser (Next.js SSR + React Client Components)        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                     VERCEL EDGE                         │
│  Next.js App Router (Middleware → Auth Guard)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  /app routes │  │  /api routes │  │  /p/[token]  │  │
│  │  (RSC + CSR) │  │  (Route Hdl) │  │  (public)    │  │
│  └──────────────┘  └──────┬───────┘  └──────────────┘  │
└─────────────────────────  │  ───────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
┌─────────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│   PostgreSQL   │  │    Stripe    │  │    Resend    │
│   (Railway)    │  │  (Payments)  │  │   (Email)    │
│   via Prisma   │  │  + Webhooks  │  │              │
└────────────────┘  └──────────────┘  └──────────────┘
          │
┌─────────▼──────┐
│  Vercel Blob   │
│ (Signatures,   │
│  PDF uploads)  │
└────────────────┘
```

---

## Database Schema

```
Users
  id, email, name, passwordHash, stripeAccountId, plan, createdAt

Proposals
  id, userId (FK), title, clientName, clientEmail, status, token (unique),
  depositAmount, currency, expiresAt, createdAt, updatedAt

ProposalSections
  id, proposalId (FK), type (TEXT|PRICING|IMAGE|DIVIDER), order,
  content (JSON), createdAt

Contracts
  id, proposalId (FK, unique), body (text/HTML), signerName,
  signerEmail, signatureData (base64), signedAt, ipAddress

Payments
  id, proposalId (FK, unique), stripeSessionId, stripePaymentIntentId,
  amount, currency, status (PENDING|PAID|REFUNDED), paidAt
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | /api/auth/register | Create account |
| POST | /api/auth/[...nextauth] | NextAuth handlers |

### Proposals (authenticated)
| Method | Path | Description |
|---|---|---|
| GET | /api/proposals | List user's proposals |
| POST | /api/proposals | Create proposal |
| GET | /api/proposals/[id] | Get proposal detail |
| PATCH | /api/proposals/[id] | Update proposal |
| DELETE | /api/proposals/[id] | Delete proposal |
| POST | /api/proposals/[id]/publish | Generate shareable token link |

### Client Flow (public, token-gated)
| Method | Path | Description |
|---|---|---|
| GET | /api/p/[token] | Fetch proposal for client view |
| POST | /api/p/[token]/sign | Submit e-signature |
| POST | /api/p/[token]/payment | Create Stripe Checkout session |

### Webhooks
| Method | Path | Description |
|---|---|---|
| POST | /api/webhooks/stripe | Handle payment_intent.succeeded, etc. |

---

## UI Architecture

```
app/
├── (marketing)/
│   └── page.tsx              ← Landing page
├── (auth)/
│   ├── login/page.tsx        ← Login
│   └── signup/page.tsx       ← Signup
├── (dashboard)/              ← Protected layout with sidebar
│   ├── layout.tsx
│   ├── dashboard/page.tsx    ← Stats + recent proposals
│   └── proposals/
│       ├── page.tsx          ← Proposals list
│       ├── new/page.tsx      ← Proposal builder
│       └── [id]/page.tsx     ← Edit proposal
└── p/[token]/page.tsx        ← Client-facing view (public)
```

### Component Strategy
- **Server Components** for all data fetching (dashboard, proposal lists)
- **Client Components** for interactivity (proposal builder, signature pad, payment button)
- **Middleware** enforces auth on `/(dashboard)` routes

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT sessions (1-day access, 30-day refresh)
- Proposal tokens: cryptographically random (32 bytes, hex)
- Stripe webhooks verified with `stripe.webhooks.constructEvent`
- All DB queries scoped to `userId` (never trust client-supplied IDs alone)
- Rate limiting via Vercel Edge middleware on auth routes
- CSRF protection via NextAuth built-in

---

## Scalability Plan

| Stage | Users | Changes needed |
|---|---|---|
| MVP | 0–10K | Single Postgres, Vercel serverless |
| Growth | 10K–100K | Read replica, Redis cache (sessions/rate limiting) |
| Scale | 100K–1M | PgBouncer connection pooling, queue (BullMQ) for emails/webhooks |
| Enterprise | 1M+ | Multi-region Vercel, Planetscale or Neon, CDN for assets |

---

## Environment Variables

```bash
# Database
DATABASE_URL=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Email
RESEND_API_KEY=

# Storage
BLOB_READ_WRITE_TOKEN=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/yourname/pact
cd pact
npm install

# 2. Set up env
cp .env.example .env.local
# Fill in values

# 3. Run database
docker compose up -d  # starts local postgres

# 4. Migrate
npx prisma migrate dev

# 5. Start dev server
npm run dev
```

---

## Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add Railway PostgreSQL, copy DATABASE_URL to Vercel env vars
4. Set all other env vars in Vercel dashboard
5. `npx prisma migrate deploy` runs on first deploy via postbuild script
