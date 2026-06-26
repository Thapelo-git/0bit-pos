# kasiFix — South African Local Service Marketplace

A marketplace connecting South African homeowners with verified local service providers: cleaning, plumbing, personal training, beauty, tutoring, and more.

---

## 01 — How to Run It

**Deployed:** (https://0bit-pos.vercel.app) 

**Local setup:**
```bash
git clone https://github.com/Thapelo-git/0bit-pos.git
cd 0bit-pos
pnpm install

# Copy and fill in your env variables
cp .env.example .env

pnpm dev
# Frontend → http://localhost:3000
# API      → http://localhost:3001/api/v1
```

Admin login: `superadmin@example.com` / `SuperAdmin123!` *(resets to default on every deploy)*

> **Note:** The API is hosted on Render's free tier and sleeps after inactivity. The first request after a period of no use may take 30–60 seconds to respond — this is normal. Refresh once if the page doesn't load immediately.

**To see the full flow as a reviewer:**
1. Log in as a vendor (`vendor@kasifix.demo` / any password you set during vendor signup at `/vendor/signup`)
2. Create a service listing
3. Log in as admin → **Service Listings tab** → click **"🔍 View Details"** then **"✓ Approve & Go Live"**
4. The service is now visible to customers on the marketplace

---

## 02 — Stack and AI Tools Used

**Stack:** Next.js 16 (App Router), React 19, Express 4 + TypeScript, PostgreSQL via Prisma, Supabase (hosted DB), Turborepo + pnpm monorepo, JWT in httpOnly cookies.

**AI — Smart Search (local keyword classifier):**
The original search called OpenAI. When quota errors hit under light load, I replaced it with a keyword classifier I wrote myself — ~25 domain terms per service category scored against the user's query. It runs in-process, costs nothing, and never fails. The feature goal (map natural language → service category) is fully met without the dependency.

**AI — Description Writer:**
Vendors can generate a service listing description with one click. This calls OpenAI if a key is present; it silently falls back to handwritten per-category templates if not. The prompt targets South African English and emphasises reliability — what the local market responds to.

---

## 03 — Key Decisions Made

**1. Vendor approval gate.**
New vendors sit at `PENDING` until an admin approves them. An open signup would flood the marketplace with unverified providers and break customer trust before the platform has any reputation. The gate adds vendor friction but protects the customer side, which is harder to win back.

**2. Cart lives in localStorage, not on the server.**
Customers can browse and add services without an account. Forcing login before the cart exists kills conversion. The trade-off is cart loss on device switch — acceptable at this stage.

**3. Keyword classifier over cloud LLM for search.**
API cost and quota unpredictability would make search unreliable in production. A deterministic classifier I control is more trustworthy than a dependency on a third-party rate limit.

---

## 04 — What I Chose Not to Build

- **In-app messaging** — customer/vendor chat would be the single most valuable feature, but building it correctly (WebSockets, read receipts, notifications) takes more time than was available. Phone number is shown on the booking instead as a stop-gap.
- **Real payment processing** — Peach Payments or Ozow integration is a weekend project on its own. Payment method is recorded (EFT, Card, Cash) but no money moves through the platform yet.
- **Mobile app** — The web is fully responsive. A native app is not the right first investment before product-market fit is established.

---

## 05 — What I Would Build Next

**In-app messaging between customer and vendor.** Right now the only coordination channel is a phone number visible after booking. A threaded conversation tied to a specific booking — with push notifications — would reduce no-shows, clarify scope, and give the platform a data advantage. That's the feature that makes the marketplace sticky rather than just a discovery tool.

---

## 06 — Most Critical Observation About eXobe

eXobe surfaces opportunity but does not own the service relationship. A homeowner finds a provider, contact details are exchanged, and everything that follows — negotiation, scheduling, payment, quality assurance — happens off-platform. That means eXobe has no visibility into whether the job was done, no leverage on quality, and no way to build the trust layer that justifies charging a platform fee.

kasiFix was built specifically toward closing that loop: the vendor accepts the booking in-platform, the job is marked complete in-platform, and payment method is recorded. It is a small step but it is the right direction. The critical next step — which I did not have time to build — is keeping payment on-platform, because that is what converts a listing directory into a marketplace with real network effects.

---

*Thapelo Chaba — O-Bit Developer Programme, June 2026*
