# Football Club Portal

A free, open-source portal platform for amateur football clubs worldwide. Any private FC can create a public-facing club page with player roster, photo albums, and club info — in minutes.

## Features (MVP)

- **Club Profile** — Club name, badge, founding date, description
- **Player Roster** — Player name, number, position, photo, and match stats (appearances, goals, assists)
- **Photo Albums** — Image galleries organized by album, with support for external links (Google Photos, Flickr) and embedded videos (YouTube, Bilibili)
- **Admin Dashboard** — Authenticated admin panel for content management
- **Multi-Tenant** — Each club gets its own page at `/club/[slug]`
- **SEO Optimized** — SSR pages with structured data for organic growth

## Tech Stack

- **Frontend**: Next.js (App Router, SSR/ISR)
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (thumbnails) + external links (full-size media)
- **Deployment**: Vercel (free tier)

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your Supabase credentials

# Run development server
pnpm dev
```

## Project Structure

```
football-club/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── (public)/     # Public-facing club pages
│   │   └── admin/        # Admin dashboard
│   ├── components/       # Shared UI components
│   ├── lib/              # Utilities, Supabase client, types
│   └── styles/           # Global styles
├── public/               # Static assets
├── supabase/             # Database migrations & seed data
└── docs/                 # Design docs & plans
```

## License

MIT
