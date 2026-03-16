# Football Club Portal — Roadmap

## Phase 1: MVP (v0.1) 🎯

The minimum viable product — a working multi-tenant club portal.

- [ ] Project scaffolding (Next.js + Supabase + Tailwind CSS)
- [ ] Supabase schema & migrations (clubs, players, albums, photos)
- [ ] Row Level Security policies
- [ ] Landing page with "Create Your Club" CTA
- [ ] Club registration flow (create club + admin account)
- [ ] Admin login (Supabase Auth, email/password)
- [ ] Admin dashboard — edit club info (name, badge, description)
- [ ] Admin dashboard — CRUD player roster
- [ ] Admin dashboard — CRUD albums & photos (upload + external link)
- [ ] Public club page (`/club/[slug]`) — club profile
- [ ] Public roster page — player grid with stats
- [ ] Public albums page — album grid + photo detail with lightbox
- [ ] SEO: SSR, meta tags, Open Graph, JSON-LD structured data
- [ ] Deploy to Vercel

## Phase 2: Polish & Growth (v0.2)

Improve UX and drive organic growth.

- [ ] Responsive design audit (mobile-first refinement)
- [ ] Image optimization (Next.js Image component, lazy loading)
- [ ] Club search / directory page (browse all clubs)
- [ ] Player profile detail page
- [ ] Video embed support (YouTube, Bilibili player)
- [ ] "Create Your Club" prompt on every public page footer
- [ ] Analytics integration (Vercel Analytics or Plausible, privacy-friendly)
- [ ] Basic error handling & loading states

## Phase 3: Engagement (v0.3)

Features that keep users coming back.

- [ ] Match records (date, opponent, score, player appearances)
- [ ] Player stats auto-calculated from match records
- [ ] Season/tournament grouping for matches
- [ ] Club announcements / news posts
- [ ] Email notifications for club members (optional)

## Phase 4: Internationalization (v0.4)

Reach more users globally.

- [ ] i18n framework (next-intl or similar)
- [ ] Chinese (zh-CN) translation
- [ ] Spanish (es) translation
- [ ] UI language auto-detection

## Phase 5: Platform & Monetization (v1.0)

Scale into a sustainable platform.

- [ ] Custom domain support for clubs (CNAME mapping)
- [ ] Premium tier (more storage, remove branding, custom themes)
- [ ] WeChat Mini Program (share core API, separate frontend)
- [ ] PWA support (installable on mobile home screen)
- [ ] Public API for third-party integrations

## Future Ideas (Backlog)

- Team chat / group messaging
- Training session scheduling
- Fan / supporter pages
- Inter-club friendly match matchmaking
- AI-powered match highlight clips from uploaded videos
