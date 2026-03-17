# Club Posts (手记) Feature Design

**Date:** 2026-03-17  
**Status:** Approved

---

## Overview

Add a collaborative, block-based "手记" (journal) feed as the primary showcase feature of each club. Replaces the existing Albums system.

---

## Goals

- Any club member can create a journal entry (手记)
- Other members can append new content blocks to any entry
- Public by default — anyone can view, members can contribute
- Strong visual impact — photos dominate, text supports

---

## What We're Removing

- `albums` and `photos` tables
- All album-related pages, actions, and components
- Default album creation on club creation

---

## Navigation Structure

```
/club/[slug]           → Posts feed (new default landing page)
/club/[slug]/about     → Existing page.tsx content (description + members)
/club/[slug]/posts/[id] → Individual post detail page
```

Club header gains two tabs: **[动态]** (default) and **[关于]**.

---

## Database Schema

### `posts` table
```sql
create table public.posts (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  title       text,
  location    text,
  event_date  timestamptz not null default now(),
  is_pinned   boolean not null default false,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

create index idx_posts_club on public.posts(club_id);
```

### `post_blocks` table
```sql
create table public.post_blocks (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  author_id     uuid not null references public.profiles(id),
  type          text not null check (type in ('text', 'photos', 'video')),
  sort_order    int not null default 0,
  body          text,           -- used when type='text'
  video_url     text,           -- used when type='video'
  video_caption text,           -- used when type='video' (optional)
  created_at    timestamptz not null default now()
);

create index idx_post_blocks_post on public.post_blocks(post_id);
```

### `post_block_photos` table
```sql
create table public.post_block_photos (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references public.post_blocks(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0
);

create index idx_post_block_photos_block on public.post_block_photos(block_id);
```

---

## RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| posts | public | active members | created_by or admin | created_by or admin |
| post_blocks | public | active members | author_id | author_id or admin |
| post_block_photos | public | active members | — | via post_blocks cascade |

---

## Permission Model

| Action | Who |
|--------|-----|
| Create post | Any active member |
| Append block to any post | Any active member |
| Edit own block | Block author |
| Delete own block | Block author |
| Delete any block | Admin |
| Delete entire post | Post creator or admin |
| Pin post | Admin only |

---

## Post Feed UI (手记流)

### Feed page (`/club/[slug]`)
- Time-ordered, newest first
- Pinned posts appear at top with visual treatment (colored left border)
- Each post is a full-width card

### Post card visual layout
```
┌──────────────────────────────────────────┐
│ 📌 [Pinned] (if applicable)              │
│ [Avatar] Name  ·  📍 Location  ·  Date   │
│ Title (bold, if set)                     │
├──────────────────────────────────────────┤
│  Block 1 (photos, auto-grid by count)   │
│  Block 2 (text)                         │
│  Block 3 (video embed)                  │
│  ...                                    │
├──────────────────────────────────────────┤
│ [Delete] (author/admin only)            │
└──────────────────────────────────────────┘
```

### Photo grid layouts (by count)
- 1 photo: full width, 16:9
- 2 photos: side-by-side, square
- 3 photos: 1 large left + 2 stacked right
- 4 photos: 2×2 grid
- 5+ photos: first large, 2×2 remaining, last cell shows "+N more"

### Block attribution
Each block shows the author avatar + "追加了文字 / 3张照片 / 视频" header, allowing visual distinction of who contributed what.

---

## Post Creation & Append UI

### Creating a new post
Inline at the top of the feed (member only). A "写一条手记..." prompt expands into:
- Title (optional)
- Location (optional)  
- Event date (defaults to now, editable)
- First block type selector: Text / Photos / Video

### Appending to an existing post
At the bottom of each post detail page, a "+ 追加内容" button opens a block type selector then the relevant form.

### Block forms
- **Text**: textarea
- **Photos**: drag-and-drop upload, preview grid, Supabase Storage
- **Video**: URL input (YouTube/Bilibili), live embed preview

---

## Video Embed Support

Supported platforms: YouTube, Bilibili  
Implementation: Parse URL on client, render `<iframe>` embed  
Storage: Only the URL is stored, not the video itself

---

## Components

| Component | Purpose |
|-----------|---------|
| `PostFeed` | Server component, renders list of PostCards |
| `PostCard` | Shows one post with all blocks (feed view) |
| `PhotoBlockGrid` | Adaptive photo grid by count |
| `VideoEmbed` | YouTube/Bilibili iframe renderer |
| `NewPostForm` | Create a new post (client) |
| `AppendBlockForm` | Add a block to existing post (client) |
| `BlockItem` | Renders a single block with author header |

---

## Out of Scope (Future)

- Reactions / comments
- Native video upload
- Hashtags / search
- Notification on new posts
