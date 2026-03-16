# Football Club Portal — MVP Design

**Date**: 2026-03-17
**Status**: Approved

## 1. Problem

Amateur football clubs (10-50 people) worldwide lack a simple, free tool to present their club online. Existing options are either too complex (full sports management software), too expensive, or require technical skills to set up.

## 2. Solution

A multi-tenant web portal where any amateur FC can create a public club page in minutes. Free to use, zero technical skill required for club admins.

## 3. Target Users

- **Primary**: Amateur/private football club managers, captains, and organizers worldwide
- **Secondary**: Club members (players, family, fans) who view the pages
- **Scale per club**: 20-50 people (players + followers)

## 4. Architecture

```
Browser (Public / Admin)
        │
   Next.js on Vercel (SSR/ISR + Server Actions)
        │
   ┌────┼────────────────┐
   │    │                │
Supabase Auth    Supabase DB    Supabase Storage
(admin login)    (PostgreSQL)   (thumbnails)

External: YouTube/Bilibili (video embeds), Google Photos/Flickr (photo links)
```

### Key Decisions

- **No separate backend service** — Next.js Server Actions call Supabase directly
- **SSR for public pages** — SEO indexability and fast first load
- **Sub-path multi-tenancy** — `/club/[slug]` instead of subdomains (simpler, better SEO)
- **Admin routes at `/admin`** — Same Next.js app, auth-gated

## 5. Data Model

### clubs
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | Unique, URL-friendly (e.g. "dragon-fc") |
| name | text | Display name |
| badge_url | text | Club badge image URL |
| founded_date | date | Nullable |
| description | text | Club bio / about |
| created_at | timestamptz | |
| admin_user_id | uuid | FK to auth.users |

### players
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| club_id | uuid | FK to clubs |
| name | text | |
| number | int | Jersey number |
| position | text | GK, DF, MF, FW |
| avatar_url | text | Nullable |
| appearances | int | Default 0 |
| goals | int | Default 0 |
| assists | int | Default 0 |
| is_active | boolean | Default true |
| created_at | timestamptz | |

### albums
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| club_id | uuid | FK to clubs |
| title | text | e.g. "2026 Spring League" |
| cover_url | text | Album cover image |
| description | text | Nullable |
| created_at | timestamptz | |

### photos
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| album_id | uuid | FK to albums |
| url | text | Image URL (external or Supabase Storage) |
| thumbnail_url | text | Nullable, smaller version |
| caption | text | Nullable |
| source_type | text | "upload", "external_link", "youtube", "bilibili" |
| created_at | timestamptz | |

### Row Level Security (RLS)

- **Public read**: All tables allow SELECT without auth
- **Write requires auth**: INSERT/UPDATE/DELETE only when `auth.uid() = club.admin_user_id`

## 6. Pages

### Public Pages (SSR, no auth)

| Route | Description |
|-------|-------------|
| `/` | Landing page — what is this, "Create Your Club" CTA |
| `/club/[slug]` | Club home — badge, name, description, quick links |
| `/club/[slug]/roster` | Player roster — grid/list of all players with stats |
| `/club/[slug]/albums` | Album listing — grid of album covers |
| `/club/[slug]/albums/[id]` | Album detail — photo grid with lightbox |

### Admin Pages (auth required)

| Route | Description |
|-------|-------------|
| `/admin/login` | Email/password login |
| `/admin/dashboard` | Overview, quick stats |
| `/admin/club` | Edit club info (name, badge, description) |
| `/admin/players` | CRUD player roster |
| `/admin/albums` | CRUD albums and photos |

### Registration

| Route | Description |
|-------|-------------|
| `/register` | Create new club — club name, slug, admin email/password |

## 7. Media Strategy

| Media Type | Storage | Cost |
|------------|---------|------|
| Club badges | Supabase Storage (small files, < 500KB each) | Free tier |
| Player avatars | Supabase Storage (small files) | Free tier |
| Album thumbnails | Supabase Storage | Free tier |
| Full-size photos | External links preferred (Google Photos, Flickr, Imgur). Upload to Supabase Storage as fallback | Minimal |
| Videos | Embed YouTube / Bilibili via iframe | $0 |

## 8. Growth / SEO Strategy

- Every club page is publicly indexable (SSR, clean URLs)
- JSON-LD structured data (`SportsTeam` schema) on club pages
- Open Graph meta tags with club badge for social sharing
- "Create Your Club" CTA on every public page footer
- Self-registration with zero friction (name + email + password)

## 9. Cost Projection

| Service | Free Tier | Enough For |
|---------|-----------|------------|
| Vercel | 100GB bandwidth/mo | ~hundreds of clubs |
| Supabase DB | 500MB | ~1000+ clubs (text + links only) |
| Supabase Storage | 1GB | ~thousands of thumbnails |
| Supabase Auth | 50K MAU | ~50K monthly active users |
| **Total** | **$0/mo** | **Until significant scale** |

## 10. Out of Scope (MVP)

- Match scheduling / results
- Announcements / news feed
- WeChat Mini Program
- Payment / premium tiers
- Team chat / messaging
- Multi-language i18n (English only for MVP, i18n architecture can be added later)
