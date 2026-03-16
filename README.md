# Football Club Portal

A free, open-source portal platform for amateur football clubs worldwide. Any private FC can create a public-facing club page with member profiles, photo albums, and club info — in minutes. Members can join, manage their own profiles, and share photos.

## Features (MVP)

- **Club Profile** — Club name, badge, founding date, description
- **Member System** — Users register accounts, join clubs via invite links or apply to join
- **Member Profiles** — Avatar, name, jersey number, position (all optional, per-club)
- **Photo Albums** — Shared photo galleries, any member can upload
- **Admin Dashboard** — Club management (info, members, albums)
- **Multi-Tenant** — Each club gets its own page at `/club/[slug]`
- **i18n** — English, Chinese, Spanish
- **SEO Optimized** — SSR pages with structured data for organic growth

## Tech Stack

- **Frontend**: Next.js (App Router, SSR/ISR)
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (avatars, photos)
- **i18n**: next-intl
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
│   ├── app/
│   │   ├── [locale]/         # i18n locale prefix
│   │   │   ├── (public)/     # Public-facing pages
│   │   │   ├── club/[slug]/  # Club pages (public + manage)
│   │   │   ├── profile/      # User profile
│   │   │   └── join/[code]/  # Invitation link
│   ├── components/           # Shared UI components
│   ├── lib/                  # Utilities, Supabase client, types
│   ├── messages/             # i18n translation files (en, zh, es)
│   └── styles/               # Global styles
├── public/                   # Static assets
├── supabase/                 # Database migrations & seed data
└── docs/                     # Design docs & plans
```

## License

MIT
