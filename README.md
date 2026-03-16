# BuildForge AI

An AI SaaS builder platform — generate websites, tools, and software from natural language prompts.

---

## Architecture

```
buildforge-ai/
├── frontend/                  # Next.js 16 app (Vercel)
│   ├── app/
│   │   ├── (auth)/            # Clerk sign-in / sign-up pages
│   │   ├── api/
│   │   │   ├── generate/      # AI generation endpoint (streaming)
│   │   │   ├── projects/      # Project CRUD
│   │   │   ├── user/me/       # Authenticated user profile
│   │   │   ├── billing/       # Stripe checkout + portal
│   │   │   └── webhooks/      # Clerk + Stripe webhooks
│   │   ├── dashboard/         # Protected dashboard
│   │   │   ├── builder/       # AI Builder Studio
│   │   │   ├── billing/       # Stripe billing UI
│   │   │   ├── usage/         # Credit usage
│   │   │   └── settings/      # User settings
│   │   └── admin/             # Admin panel (role-gated)
│   ├── components/            # shadcn/ui + custom components
│   ├── lib/
│   │   ├── auth-context.tsx   # App-level user context (Clerk-backed)
│   │   ├── db.ts              # Prisma client singleton
│   │   └── stripe.ts          # Stripe client + plan config
│   ├── prisma/
│   │   ├── schema.prisma      # DB schema
│   │   └── seed.ts            # Seed script
│   └── middleware.ts          # Clerk route protection
│
└── backend/                   # FastAPI (Railway)
    ├── main.py                # WebSocket AI generation (Gemini)
    ├── Procfile               # Heroku fallback
    └── railway.toml           # Railway deployment config
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui |
| Auth | Clerk |
| Database | PostgreSQL (Neon) + Prisma ORM |
| AI (frontend) | OpenAI GPT-4o / GPT-4o-mini via Vercel AI SDK |
| AI (backend) | Google Gemini 1.5 Flash via FastAPI WebSocket |
| Payments | Stripe (subscriptions + webhooks) |
| Frontend deploy | Vercel |
| Backend deploy | Railway |

---

## Local Development

### Prerequisites

- Node.js 20+
- Python 3.11+
- PostgreSQL (or a free [Neon](https://neon.tech) database)
- Accounts: [Clerk](https://clerk.com), [Stripe](https://stripe.com), [OpenAI](https://platform.openai.com)

### 1. Clone and install

```bash
git clone <repo>
cd buildforge-ai/frontend
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in all values in .env.local
```

Required values:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` — from Clerk dashboard
- `DATABASE_URL` — Neon or local Postgres connection string
- `OPENAI_API_KEY` — from OpenAI
- `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — from Stripe
- `STRIPE_WEBHOOK_SECRET` — from `stripe listen` (see below)
- `STRIPE_PRICE_PRO_MONTHLY` etc. — create products in Stripe dashboard

### 3. Set up the database

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # push schema to database
npx ts-node prisma/seed.ts  # optional: seed admin user
```

### 4. Set up Clerk webhooks

In your Clerk dashboard, add a webhook endpoint:
- URL: `http://localhost:3000/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy the signing secret to `CLERK_WEBHOOK_SECRET` in `.env.local`

### 5. Set up Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret to STRIPE_WEBHOOK_SECRET
```

### 6. Run the frontend

```bash
npm run dev
# → http://localhost:3000
```

### 7. Run the backend (optional)

```bash
cd ../backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
# → http://localhost:8000
```

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add all environment variables from `.env.local.example`
5. Deploy

Update Clerk and Stripe webhook URLs to your production domain after deploy.

### Backend → Railway

1. Go to [Railway](https://railway.app) → New Project → Deploy from GitHub
2. Select the `backend` folder
3. Add environment variable: `GEMINI_API_KEY`
4. Railway auto-detects `railway.toml` and deploys

### Database → Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `DATABASE_URL`
3. Run `npm run db:push` from the `frontend` directory

---

## Stripe Plans Setup

Create these products in your Stripe dashboard and add the price IDs to your env:

| Plan | Monthly | Yearly | Credits |
|---|---|---|---|
| Pro | $49/mo | $490/yr | 500 |
| Enterprise | $99/mo | $990/yr | Unlimited |

---

## Credit System

- Each AI generation costs 1 credit
- Credits are deducted before generation in `/api/generate`
- Credits reset on successful Stripe invoice payment (webhook)
- Free plan: 100 credits, Pro: 500, Enterprise: 9999

---

## Security Notes

- All API keys are in environment variables — never committed
- Clerk middleware protects `/dashboard` and `/admin` routes
- Admin routes additionally check `user.role === 'admin'` server-side
- Stripe webhooks are verified with `STRIPE_WEBHOOK_SECRET`
- Clerk webhooks are verified with `CLERK_WEBHOOK_SECRET` via svix
- CORS on the backend is restricted to `ALLOWED_ORIGINS`
