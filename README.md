# MoneySimp

MoneySimp is a personal finance workspace. You can log expenses, set monthly budgets, track subscriptions, follow savings goals, and review spending charts. Visitors can open a sample household without creating an account or linking a bank.

Authentication stays on Firebase (email, Google, Microsoft, and X). Bank linking stays on Yodlee and is optional. Tips, chat, and receipt reading use Gemini through Genkit on the server.

## Features

- Dashboard with cash (checking and savings minus card balances), this month’s spending, budget use, and a category chart
- Expenses, including a receipt scan that calls Gemini only after you are signed in
- Budgets, subscriptions with renewal reminders, and savings goals
- One-click demo household (Maya Chen) stored in this browser and labeled as sample data
- Split-screen sign-in and sign-up pages

## Stack

- Next.js 15 App Router and TypeScript
- Tailwind CSS and the existing shadcn-style UI components
- Firebase Authentication and Firestore (goals for signed-in accounts)
- Genkit with Gemini for tips, chat, and receipt parsing
- Yodlee for optional bank linking
- Recharts for spending charts

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use **Try the demo** to explore the sample household. Create an account when you want data tied to Firebase.

The Firebase web config used by the client lives in `src/lib/firebase.ts`. Server routes verify Firebase ID tokens for that project before they call Gemini.

## Environment variables

See `.env.example` for names. The ones that change behavior:

| Name | Role |
| --- | --- |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` or `GOOGLE_GENAI_API_KEY` | Live Gemini calls. Without a key, tips, chat, and receipt scan return a labeled sample response. |
| `GEMINI_MODEL` or `AI_MODEL` | Model id. Defaults to `googleai/gemini-2.0-flash`. |
| `DEMO_SESSION_SECRET` | HMAC secret for the demo and session cookies. |
| `NEXT_PUBLIC_YODLEE_CLIENT_ID`, `YODLEE_SECRET`, `NEXT_PUBLIC_YODLEE_ENV` | Live bank linking. |

## What is real vs sample

- **Real:** Firebase sign-in, expense and budget editing in this browser, subscription reminders, charts from stored expenses, Yodlee linking when credentials are set, Gemini responses when an API key is set.
- **Sample:** The demo household (accounts, expenses, budgets, subscriptions, and goals). It is not a bank feed. Gemini answers are also sample text when no API key is configured, and the UI says so.
- Gemini routes require a signed-in user or an active demo session, validate input with Zod, rate-limit per user, and cap output tokens. Invalid input returns HTTP 400.

## Scripts

```bash
npm run dev
npm run build
npx tsc --noEmit
```

Portfolio images:

- `public/portfolio-screenshot.png` — signed-in dashboard in demo mode, 1440×900
- `public/portfolio-screenshot-landing.png` — marketing page, 1440×900
