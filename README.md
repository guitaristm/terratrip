# 🗺️ TerraTrip

Collaborative travel planner — plan trips, build drag-and-drop itineraries, track expenses, and organize everything with custom categories.

Built with **Next.js 16**, **Prisma**, **Supabase (Postgres)**, **Tailwind CSS**, and **Radix UI**.

## Features

- **Trips** — create/edit trips with destination, dates, budget, and currency.
- **Itinerary** — auto-generated days, drag-and-drop reordering of days *and* items, with dates that always stay continuous. Add/remove days dynamically.
- **Custom categories** — pick from built-ins or create your own with a name, emoji, and color (used consistently across itinerary and expenses).
- **Expenses** — log spending per trip with per-category breakdowns.
- **Collaborators** — invite editors/viewers.
- **Responsive** — works on desktop and mobile (slide-in nav drawer).

## Local development

```bash
npm install
cp .env.example .env   # then fill in your Supabase connection strings
npm run dev
```

Open http://localhost:3000.

To create/update the database schema:

```bash
npx prisma db push      # or: npm run prisma:migrate
npm run prisma:seed     # optional demo data
```

## Environment variables

See [`.env.example`](.env.example). The two **required** at runtime/build:

| Variable       | Purpose                                                       |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | Pooled Postgres connection (PgBouncer, port `6543`) — runtime |
| `DIRECT_URL`   | Direct connection (port `5432`) — used by Prisma migrations   |

## Deploying to Vercel

1. Push this repo to GitHub (already done: `guitaristm/terratrip`).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** the `terratrip` repo.
3. Framework preset is auto-detected as **Next.js**. Leave build/output settings default
   — the `build` script runs `prisma generate` before `next build`.
4. Under **Environment Variables**, add (from your `.env`):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - *(optional)* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`
5. Click **Deploy**.

> **Prisma note:** `prisma generate` runs automatically in both `postinstall` and the
> `build` script, so the Prisma Client is always regenerated on Vercel's build machines.

> **DB region:** the Supabase instance is in `ap-northeast-2` (Seoul). For lowest latency
> you can set Vercel's function region to `icn1` in Project → Settings → Functions.
