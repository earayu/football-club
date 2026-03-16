# Football Club Portal — Roadmap

## Phase 1: MVP (v0.1) 🎯

A beautiful club identity card + shared album with member participation.

- [ ] Project scaffolding (Next.js + Supabase + Tailwind CSS + next-intl)
- [ ] Supabase schema & migrations (profiles, clubs, memberships, invitations, albums, photos)
- [ ] Row Level Security policies
- [ ] i18n setup (EN, zh-CN, ES) with browser auto-detection
- [ ] User registration & login (Supabase Auth)
- [ ] Profile page (edit display name, avatar, bio)
- [ ] Landing page with "Create Your Club" CTA
- [ ] Club creation flow (create club + become admin)
- [ ] Club home page (badge, name, description, member preview, recent albums)
- [ ] Member list page (avatar, name, number, position cards)
- [ ] Invite link system (admin generates link, user joins via /join/[code])
- [ ] Apply to join (user requests, admin approves/rejects)
- [ ] Club management — edit club info
- [ ] Club management — member management (approve, remove, invite)
- [ ] Club management — album management (create albums, delete photos)
- [ ] Member self-service — edit own number/position per club
- [ ] Album list page (cover grid)
- [ ] Album detail page (photo grid + lightbox)
- [ ] Photo upload (members upload to albums, stored in Supabase Storage)
- [ ] SEO: SSR, meta tags, Open Graph, JSON-LD structured data
- [ ] Deploy to Vercel

## Phase 2: Polish & Growth (v0.2)

Improve UX and drive organic growth.

- [ ] Responsive design audit (mobile-first refinement)
- [ ] Image optimization (Next.js Image component, lazy loading, thumbnails)
- [ ] Club search / directory page (browse all clubs)
- [ ] Video embed support (YouTube, Bilibili)
- [ ] External photo link support (Google Photos, Flickr, Imgur)
- [ ] Analytics integration (Vercel Analytics or Plausible)
- [ ] Loading states, error handling, empty states

## Phase 3: Engagement (v0.3)

Features that keep users coming back.

- [ ] Match records (date, opponent, score)
- [ ] Player appearances per match
- [ ] Season / tournament grouping
- [ ] Club announcements / news posts
- [ ] Comments / reactions on photos
- [ ] Notification system (email or in-app)

## Phase 4: Platform & Monetization (v1.0)

Scale into a sustainable platform.

- [ ] Custom domain support for clubs
- [ ] Premium tier (more storage, remove branding, custom themes)
- [ ] WeChat Mini Program (shared API, separate frontend)
- [ ] PWA support (installable on mobile)
- [ ] Public API for third-party integrations

## Future Ideas (Backlog)

- Team chat / group messaging
- Training session scheduling
- Fan / supporter pages
- Inter-club friendly match matchmaking
- AI-powered match highlight clips
- More languages (Portuguese, Arabic, French, etc.)
