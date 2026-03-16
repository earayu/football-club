# Football Club Portal — MVP Design (v2)

**Date**: 2026-03-17
**Status**: Approved
**Revision**: v2 — redesigned from amateur player's real-world perspective

## 1. Problem

Amateur football clubs (10-50 people) worldwide lack a simple, free tool to present their club online. Existing options are either too complex (full sports management software), too expensive, or require technical skills to set up.

## 2. Solution

A multi-tenant web portal where any amateur FC can create a public club page in minutes. Free to use, zero technical skill required for club admins. Members can join, manage their own profiles, and upload photos — creating a sense of belonging.

## 3. Target Users

- **Primary**: Amateur/private football club managers, captains, and organizers worldwide
- **Secondary**: Club members (players, family, fans) who join and contribute
- **Scale per club**: 20-50 people (players + followers)

## 4. MVP Philosophy

> Build a beautiful club identity card + shared photo album. Keep features minimal but make the experience great. Let members participate. Accumulate users, then expand features.

**What MVP is NOT:**
- Not a sports management tool (no stats, no match records, no scheduling)
- Not a social network (no feeds, no messaging, no comments)

## 5. Architecture

```
Browser (Public / Logged-in User / Admin)
        │
   Next.js on Vercel (SSR/ISR + Server Actions)
        │
   ┌────┼────────────────┐
   │    │                │
Supabase Auth    Supabase DB    Supabase Storage
(all users)      (PostgreSQL)   (avatars, photos)
```

### Key Decisions

- **No separate backend service** — Next.js Server Actions call Supabase directly
- **SSR for public pages** — SEO indexability and fast first load
- **Sub-path multi-tenancy** — `/club/[slug]` instead of subdomains (simpler, better SEO)
- **Management routes under club** — `/club/[slug]/manage/*` not global `/admin/*`
- **Three roles** — visitor (no account), member (logged in + joined club), admin (club creator/manager)

## 6. Data Model

### profiles

User's global identity, 1:1 with Supabase `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, = auth.users.id |
| display_name | text | Display name |
| avatar_url | text | Nullable |
| bio | text | Nullable |
| created_at | timestamptz | |

### clubs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | text | Unique, URL-friendly (e.g. "dragon-fc") |
| name | text | Club display name |
| badge_url | text | Nullable, club badge image |
| founded_date | date | Nullable |
| description | text | Nullable, club bio |
| created_at | timestamptz | |

### memberships

User-to-club relationship. Jersey number and position live here because the same person may have different roles in different clubs.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| club_id | uuid | FK to clubs |
| role | text | 'admin' \| 'member' |
| status | text | 'active' \| 'pending' |
| number | int | Nullable, jersey number |
| position | text | Nullable, GK/DF/MF/FW |
| joined_at | timestamptz | |

Unique constraint: `(user_id, club_id)`

### invitations

Admin-generated invite links.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| club_id | uuid | FK to clubs |
| code | text | Unique, short random code |
| created_by | uuid | FK to profiles |
| expires_at | timestamptz | Nullable |
| max_uses | int | Nullable |
| use_count | int | Default 0 |
| created_at | timestamptz | |

### albums

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| club_id | uuid | FK to clubs |
| title | text | e.g. "2026 Spring League" |
| cover_url | text | Nullable |
| description | text | Nullable |
| created_by | uuid | FK to profiles |
| created_at | timestamptz | |

### photos

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| album_id | uuid | FK to albums |
| url | text | Image URL (Supabase Storage) |
| caption | text | Nullable |
| uploaded_by | uuid | FK to profiles |
| created_at | timestamptz | |

## 7. Row Level Security (RLS)

### profiles
| Operation | Policy |
|-----------|--------|
| SELECT | Anyone can read (public display) |
| INSERT | Auto-created by trigger on auth.users insert |
| UPDATE | Only self: `auth.uid() = id` |

### clubs
| Operation | Policy |
|-----------|--------|
| SELECT | Anyone can read |
| INSERT | Any authenticated user |
| UPDATE | Club admin only (via memberships) |
| DELETE | Club admin only |

### memberships
| Operation | Policy |
|-----------|--------|
| SELECT | Anyone can read (public member list) |
| INSERT | Self-apply (status='pending') or via invitation flow |
| UPDATE | Admin can update any member; member can update own number/position |
| DELETE | Admin can remove member; member can leave |

### invitations
| Operation | Policy |
|-----------|--------|
| SELECT | Club admin |
| INSERT | Club admin |
| UPDATE | Club admin (use_count updated via Server Action) |

### albums
| Operation | Policy |
|-----------|--------|
| SELECT | Anyone can read |
| INSERT | Club active members |
| UPDATE | Creator or club admin |
| DELETE | Club admin |

### photos
| Operation | Policy |
|-----------|--------|
| SELECT | Anyone can read |
| INSERT | Club active members |
| DELETE | Uploader or club admin |

## 8. Pages

### Public Pages (no auth required, SSR)

| Route | Description |
|-------|-------------|
| `/` | Landing page — product intro + "Create Your Club" CTA |
| `/club/[slug]` | Club home — badge, name, description, member preview, recent albums |
| `/club/[slug]/members` | Member list — cards with avatar, name, number, position |
| `/club/[slug]/albums` | Album list — cover grid |
| `/club/[slug]/albums/[id]` | Album detail — photo grid with lightbox |

### User Pages (auth required)

| Route | Description |
|-------|-------------|
| `/register` | Sign up (email + password) |
| `/login` | Log in |
| `/profile` | Edit personal info (display name, avatar, bio) |
| `/join/[code]` | Invitation link — join club (register first if not logged in) |

### Club Management Pages (club admin only)

| Route | Description |
|-------|-------------|
| `/club/[slug]/manage` | Management dashboard |
| `/club/[slug]/manage/info` | Edit club info (name, badge, description) |
| `/club/[slug]/manage/members` | Member management (approve requests, remove, invite links) |
| `/club/[slug]/manage/albums` | Album management (create albums, delete photos) |

### Member Pages (club active member)

| Route | Description |
|-------|-------------|
| `/club/[slug]/my` | My info in this club (edit number, position) |
| `/club/[slug]/albums/[id]/upload` | Upload photos to album |

## 9. Core User Flows

### Flow 1: Create a Club

```
Register/Login → Click "Create Your Club"
→ Fill: club name, slug, badge (optional), description (optional)
→ System creates club + membership (role=admin, status=active)
→ Redirect to club home page
```

### Flow 2: Invite Members

```
Admin → /club/[slug]/manage/members → Generate invite link
→ Copy link, share via WhatsApp/WeChat/etc.
→ Invitee clicks /join/[code]
→ Not logged in? Register/login first, then auto-join (status=active)
→ Already logged in? Join directly
```

### Flow 3: Apply to Join

```
User browses /club/[slug] → Click "Apply to Join"
→ Not logged in? Register/login first
→ System creates membership (status=pending)
→ Admin sees request at /club/[slug]/manage/members
→ Approve → status becomes active
```

### Flow 4: Upload Photos

```
Member logged in → Browse /club/[slug]/albums
→ Select an album
→ Upload photos → Stored in Supabase Storage
→ Photos appear in album, publicly visible
```

### Flow 5: Edit Personal Info

```
Member logged in → /profile for global info (name, avatar, bio)
→ /club/[slug]/my for club-specific info (number, position)
→ Member list updates automatically
```

## 10. Internationalization (i18n)

- Library: `next-intl`
- Languages: English (EN), Chinese (zh-CN), Spanish (ES)
- Route prefix: `/en/club/[slug]`, `/zh/club/[slug]`, `/es/club/[slug]`
- Auto-detect browser language, default to EN
- Only UI text is translated; user-generated content (club names, player names, etc.) is not translated

## 11. Media Strategy

| Media Type | Storage | Cost |
|------------|---------|------|
| Club badges | Supabase Storage (< 500KB each) | Free tier |
| User avatars | Supabase Storage (< 500KB each) | Free tier |
| Album photos | Supabase Storage | Free tier (1GB) |
| Videos | Out of scope for MVP | — |

## 12. Growth / SEO Strategy

- Every club page is publicly indexable (SSR, clean URLs)
- JSON-LD structured data (`SportsTeam` schema) on club pages
- Open Graph meta tags with club badge for social sharing
- "Create Your Club" CTA on every public page footer
- Self-registration with zero friction
- i18n enables organic traffic from EN/CN/ES search queries

## 13. Cost Projection

| Service | Free Tier | Enough For |
|---------|-----------|------------|
| Vercel | 100GB bandwidth/mo | ~hundreds of clubs |
| Supabase DB | 500MB | ~1000+ clubs (text + links only) |
| Supabase Storage | 1GB | ~thousands of photos |
| Supabase Auth | 50K MAU | ~50K monthly active users |
| **Total** | **$0/mo** | **Until significant scale** |

## 14. Out of Scope (MVP)

- Match records / statistics / seasons
- Video embeds (YouTube, Bilibili)
- External photo links (Google Photos, Flickr)
- Club search / directory page
- WeChat Mini Program
- Payment / premium tiers
- Notifications (email / in-app)
- Comments / reactions on photos
- Team chat / messaging
