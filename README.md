# My Blog

A personal blog built with Next.js, Supabase, Tailwind CSS, and shadcn/ui.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the required Supabase values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

You can find the Supabase URL and anon key in the Supabase dashboard under
Project Settings -> API.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Supabase Setup

The SQL files in `supabase/` define the database schema, storage policy, and
seed data:

- `supabase/schema.sql`
- `supabase/storage.sql`
- `supabase/seed.sql`

Apply them in your Supabase project before running the app against a fresh
database.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Deployment

Set the same environment variables in your deployment platform. For Vercel,
configure them under Project Settings -> Environment Variables.
