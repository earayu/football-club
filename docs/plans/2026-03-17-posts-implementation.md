# Club Posts (手记) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a block-based collaborative journal feed (手记) as the primary club showcase, replacing the Albums system.

**Architecture:** Three new DB tables (`posts`, `post_blocks`, `post_block_photos`). Club's `/club/[slug]` becomes the posts feed; existing content moves to `/club/[slug]/about`. Members append typed blocks (text/photos/video) to any post.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + Storage), TypeScript, Tailwind CSS v4.

---

## Context: Key Files to Know

- `src/app/[locale]/club/[slug]/page.tsx` — current club home (will become posts feed)
- `src/app/[locale]/club/[slug]/layout.tsx` — club header (badge, name, stats)
- `src/lib/supabase/server.ts` — server-side Supabase client factory
- `src/lib/actions/album.ts` — example of how server actions are structured
- `src/components/ui/button.tsx` and `input.tsx` — shared UI primitives
- `supabase/migrations/` — SQL files; apply via Supabase dashboard SQL Editor

---

## Task 1: Database Migration — Add Posts Tables

**Files:**
- Create: `supabase/migrations/00005_posts.sql`

**Step 1: Write the migration SQL**

```sql
-- posts table
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

-- post_blocks table
create table public.post_blocks (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  author_id     uuid not null references public.profiles(id),
  type          text not null check (type in ('text', 'photos', 'video')),
  sort_order    int not null default 0,
  body          text,
  video_url     text,
  video_caption text,
  created_at    timestamptz not null default now()
);
create index idx_post_blocks_post on public.post_blocks(post_id);

-- post_block_photos table
create table public.post_block_photos (
  id          uuid primary key default gen_random_uuid(),
  block_id    uuid not null references public.post_blocks(id) on delete cascade,
  url         text not null,
  sort_order  int not null default 0
);
create index idx_post_block_photos_block on public.post_block_photos(block_id);

-- RLS
alter table public.posts enable row level security;
alter table public.post_blocks enable row level security;
alter table public.post_block_photos enable row level security;

-- posts policies
create policy "posts_select" on public.posts for select using (true);
create policy "posts_insert" on public.posts for insert
  with check (auth.uid() is not null and public.is_club_member(club_id));
create policy "posts_delete" on public.posts for delete
  using (auth.uid() = created_by or public.is_club_admin(club_id));
create policy "posts_update" on public.posts for update
  using (public.is_club_admin(club_id));

-- post_blocks policies
create policy "post_blocks_select" on public.post_blocks for select using (true);
create policy "post_blocks_insert" on public.post_blocks for insert
  with check (
    auth.uid() is not null
    and exists (
      select 1 from public.posts p where p.id = post_id
      and public.is_club_member(p.club_id)
    )
  );
create policy "post_blocks_delete" on public.post_blocks for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.posts p where p.id = post_id
      and public.is_club_admin(p.club_id)
    )
  );

-- post_block_photos policies
create policy "post_block_photos_select" on public.post_block_photos for select using (true);
create policy "post_block_photos_insert" on public.post_block_photos for insert
  with check (auth.uid() is not null);
create policy "post_block_photos_delete" on public.post_block_photos for delete
  using (
    exists (
      select 1 from public.post_blocks pb where pb.id = block_id
      and pb.author_id = auth.uid()
    )
  );
```

**Step 2: Apply in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste the SQL above → Run.

**Step 3: Verify tables exist**

In SQL Editor: `select * from public.posts limit 1;` — should return empty result set without error.

**Step 4: Commit the migration file**

```bash
git add supabase/migrations/00005_posts.sql
git commit -m "feat: add posts, post_blocks, post_block_photos tables with RLS"
```

---

## Task 2: Remove Albums — Files & Database

**Files:**
- Delete: `src/app/[locale]/club/[slug]/albums/` (entire directory)
- Delete: `src/app/[locale]/club/[slug]/manage/albums/album-manager.tsx`
- Delete: `src/app/[locale]/club/[slug]/manage/albums/` (directory)
- Delete: `src/lib/actions/album.ts`
- Modify: `src/lib/actions/club.ts` — remove default album creation
- Create: `supabase/migrations/00006_remove_albums.sql`

**Step 1: Write removal migration**

```sql
drop table if exists public.photos cascade;
drop table if exists public.albums cascade;
```

**Step 2: Apply in Supabase Dashboard**

Paste and run in SQL Editor.

**Step 3: Delete album files**

```bash
rm -rf src/app/\[locale\]/club/\[slug\]/albums
rm -rf src/app/\[locale\]/club/\[slug\]/manage/albums
rm src/lib/actions/album.ts
```

**Step 4: Remove default album creation from `src/lib/actions/club.ts`**

Find and delete this block (around line 76):
```ts
await supabase.from("albums").insert({
  club_id: club.id,
  title: "Photos",
  created_by: user.id,
} as never);
```

**Step 5: Fix any remaining imports**

Search for `album` imports in club page.tsx and manage files, remove them.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove albums system, replaced by posts"
```

---

## Task 3: Server Actions — Posts & Blocks

**Files:**
- Create: `src/lib/actions/posts.ts`

**Step 1: Write the file**

```ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPost(
  clubId: string,
  data: {
    title?: string;
    location?: string;
    eventDate?: string;
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      club_id: clubId,
      title: data.title || null,
      location: data.location || null,
      event_date: data.eventDate || new Date().toISOString(),
      created_by: user.id,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { post };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { success: true };
}

export async function togglePinPost(postId: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ is_pinned: isPinned } as never)
    .eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { success: true };
}

export async function appendTextBlock(postId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("post_blocks")
    .select("sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((existing as any)?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("post_blocks").insert({
    post_id: postId,
    author_id: user.id,
    type: "text",
    body,
    sort_order: nextOrder,
  } as never);

  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { success: true };
}

export async function appendVideoBlock(
  postId: string,
  videoUrl: string,
  caption?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("post_blocks")
    .select("sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((existing as any)?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("post_blocks").insert({
    post_id: postId,
    author_id: user.id,
    type: "video",
    video_url: videoUrl,
    video_caption: caption || null,
    sort_order: nextOrder,
  } as never);

  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { success: true };
}

export async function appendPhotosBlock(postId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: post } = await supabase
    .from("posts")
    .select("club_id")
    .eq("id", postId)
    .single();
  if (!post) return { error: "Post not found" };

  const files = formData.getAll("photos") as File[];
  if (!files.length) return { error: "No photos provided" };

  const { data: existing } = await supabase
    .from("post_blocks")
    .select("sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = ((existing as any)?.sort_order ?? -1) + 1;

  // Create the photos block
  const { data: block, error: blockError } = await supabase
    .from("post_blocks")
    .insert({
      post_id: postId,
      author_id: user.id,
      type: "photos",
      sort_order: nextOrder,
    } as never)
    .select()
    .single();

  if (blockError) return { error: blockError.message };

  // Upload each photo and insert photo rows
  const clubId = (post as any).club_id;
  const blockId = (block as any).id;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop();
    const path = `posts/${clubId}/${postId}/${blockId}/${Date.now()}-${i}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(path, file);

    if (uploadError) continue;

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

    await supabase.from("post_block_photos").insert({
      block_id: blockId,
      url: publicUrl,
      sort_order: i,
    } as never);
  }

  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { success: true };
}

export async function deleteBlock(blockId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("post_blocks").delete().eq("id", blockId);
  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]`, "page");
  return { success: true };
}
```

**Step 2: Verify no linter errors**

```bash
# Check for TS errors
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/lib/actions/posts.ts
git commit -m "feat: add server actions for posts and blocks"
```

---

## Task 4: Move Existing Club Page to `/about`

**Files:**
- Create: `src/app/[locale]/club/[slug]/about/page.tsx`
- Replace: `src/app/[locale]/club/[slug]/page.tsx` (will become posts feed in Task 6)

**Step 1: Create `/about/page.tsx`**

Copy the CURRENT content of `src/app/[locale]/club/[slug]/page.tsx` into the new file at `src/app/[locale]/club/[slug]/about/page.tsx` with this change — add `params` to get `slug`:

```tsx
// The file is largely the same as the current page.tsx
// Just ensure it accepts params: Promise<{ slug: string }>
// Remove generateMetadata (it stays in page.tsx)
// The component is named AboutPage instead of ClubPage
export default async function AboutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ... same content as current page.tsx body ...
}
```

**Step 2: Update layout.tsx to add tab navigation**

In `src/app/[locale]/club/[slug]/layout.tsx`, add tabs after the header info block and before `{children}`:

```tsx
{/* Tab navigation */}
<div className="border-t border-gray-100">
  <div className="mx-auto max-w-4xl px-4 sm:px-6">
    <nav className="flex gap-1 py-2">
      <Link
        href={`/club/${slug}`}
        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        动态
      </Link>
      <Link
        href={`/club/${slug}/about`}
        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        关于
      </Link>
    </nav>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: move club overview to /about, add tab navigation"
```

---

## Task 5: Video Embed Component

**Files:**
- Create: `src/components/posts/video-embed.tsx`

**Step 1: Write the component**

```tsx
"use client";

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

  // Bilibili
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (biliMatch) return `https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&autoplay=0`;

  return null;
}

export function VideoEmbed({ url, caption }: { url: string; caption?: string | null }) {
  const embedUrl = getEmbedUrl(url);

  if (!embedUrl) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm text-green-600 hover:bg-gray-50"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        {caption || url}
      </a>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl">
      <div className="relative aspect-video w-full">
        <iframe
          src={embedUrl}
          className="absolute inset-0 h-full w-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      {caption && <p className="mt-2 text-sm text-gray-500">{caption}</p>}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/posts/video-embed.tsx
git commit -m "feat: add VideoEmbed component for YouTube/Bilibili"
```

---

## Task 6: Photo Grid Component

**Files:**
- Create: `src/components/posts/post-photo-grid.tsx`

**Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";

type Photo = { id: string; url: string };

const GRID_LAYOUTS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2",
};

export function PostPhotoGrid({ photos }: { photos: Photo[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const count = photos.length;
  const shown = photos.slice(0, Math.min(count, 5));
  const overflow = count - 5;

  const gridClass =
    count === 1 ? "grid-cols-1" :
    count === 2 ? "grid-cols-2" :
    count === 3 ? "grid-cols-3" :
    "grid-cols-2";

  return (
    <>
      <div className={`grid gap-0.5 overflow-hidden rounded-xl ${gridClass}`}>
        {shown.map((photo, i) => {
          const isLast = i === 4 && overflow > 0;
          const isFirst3 = count === 3 && i === 0;

          return (
            <div
              key={photo.id}
              className={`relative cursor-pointer overflow-hidden bg-gray-100 ${
                count === 1 ? "aspect-video" :
                isFirst3 ? "row-span-2 aspect-auto" :
                "aspect-square"
              }`}
              onClick={() => setLightbox(i)}
            >
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
              {isLast && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <span className="text-2xl font-bold text-white">+{overflow + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute right-4 top-4 text-3xl text-white/80 hover:text-white"
            onClick={() => setLightbox(null)}
          >
            ✕
          </button>
          {lightbox > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-5xl text-white/60 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
            >
              ‹
            </button>
          )}
          {lightbox < photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl text-white/60 hover:text-white"
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
            >
              ›
            </button>
          )}
          <img
            src={photos[lightbox].url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-sm text-white/50">
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/posts/post-photo-grid.tsx
git commit -m "feat: add PostPhotoGrid with adaptive layout and lightbox"
```

---

## Task 7: Post Card Component

**Files:**
- Create: `src/components/posts/post-card.tsx`

**Step 1: Write the component**

```tsx
import { Link } from "@/i18n/navigation";
import { PostPhotoGrid } from "./post-photo-grid";
import { VideoEmbed } from "./video-embed";
import { deletePost, togglePinPost, deleteBlock } from "@/lib/actions/posts";

type Block = {
  id: string;
  type: "text" | "photos" | "video";
  author_id: string;
  body: string | null;
  video_url: string | null;
  video_caption: string | null;
  sort_order: number;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  post_block_photos: { id: string; url: string; sort_order: number }[];
};

type Post = {
  id: string;
  title: string | null;
  location: string | null;
  event_date: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null };
  post_blocks: Block[];
};

export function PostCard({
  post,
  currentUserId,
  isAdmin,
  clubSlug,
}: {
  post: Post;
  currentUserId: string | null;
  isAdmin: boolean;
  clubSlug: string;
}) {
  const canDeletePost = isAdmin || post.created_by === currentUserId;

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
      post.is_pinned ? "border-green-200 ring-1 ring-green-100" : "border-gray-100"
    }`}>
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="flex items-center gap-1.5 border-b border-green-100 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700">
          <svg className="h-3.5 w-3.5 fill-green-600" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Pinned
        </div>
      )}

      {/* Post header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-3">
          {post.profiles.avatar_url ? (
            <img src={post.profiles.avatar_url} className="h-9 w-9 rounded-full object-cover" alt="" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
              {post.profiles.display_name[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{post.profiles.display_name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span>{new Date(post.event_date).toLocaleDateString()}</span>
              {post.location && (
                <>
                  <span>·</span>
                  <span>📍 {post.location}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Post actions */}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <form action={async () => {
              "use server";
              await togglePinPost(post.id, !post.is_pinned);
            }}>
              <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-yellow-500" title={post.is_pinned ? "Unpin" : "Pin"}>
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            </form>
          )}
          {canDeletePost && (
            <form action={async () => {
              "use server";
              await deletePost(post.id);
            }}>
              <button className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500" title="Delete post">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Title */}
      {post.title && (
        <h2 className="mt-3 px-5 text-lg font-bold text-gray-900">{post.title}</h2>
      )}

      {/* Blocks */}
      <div className="mt-4 space-y-4">
        {post.post_blocks
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              showAuthor={post.post_blocks.length > 1}
            />
          ))}
      </div>

      {/* Append link */}
      {currentUserId && (
        <div className="border-t border-gray-50 px-5 py-3">
          <Link
            href={`/club/${clubSlug}/posts/${post.id}#append`}
            className="text-sm font-medium text-green-600 hover:text-green-700"
          >
            + 追加内容
          </Link>
        </div>
      )}
    </article>
  );
}

function BlockItem({
  block,
  currentUserId,
  isAdmin,
  showAuthor,
}: {
  block: Block;
  currentUserId: string | null;
  isAdmin: boolean;
  showAuthor: boolean;
}) {
  const canDelete = isAdmin || block.author_id === currentUserId;
  const typeLabel = block.type === "text" ? "追加了文字" : block.type === "photos" ? `追加了 ${block.post_block_photos.length} 张照片` : "追加了视频";

  return (
    <div className="relative">
      {showAuthor && (
        <div className="flex items-center gap-2 border-t border-gray-50 px-5 py-2.5">
          {block.profiles.avatar_url ? (
            <img src={block.profiles.avatar_url} className="h-6 w-6 rounded-full object-cover" alt="" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
              {block.profiles.display_name[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-400">
            <span className="font-medium text-gray-600">{block.profiles.display_name}</span> {typeLabel}
          </span>
          {canDelete && (
            <form className="ml-auto" action={async () => {
              "use server";
              await deleteBlock(block.id);
            }}>
              <button className="text-xs text-gray-300 hover:text-red-500">删除</button>
            </form>
          )}
        </div>
      )}

      <div className={showAuthor ? "px-0" : "px-5"}>
        {block.type === "text" && block.body && (
          <p className="px-5 pb-1 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{block.body}</p>
        )}
        {block.type === "photos" && block.post_block_photos.length > 0 && (
          <PostPhotoGrid
            photos={block.post_block_photos.sort((a, b) => a.sort_order - b.sort_order)}
          />
        )}
        {block.type === "video" && block.video_url && (
          <div className="px-5 pb-1">
            <VideoEmbed url={block.video_url} caption={block.video_caption} />
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/posts/post-card.tsx
git commit -m "feat: add PostCard component with blocks, pin, delete"
```

---

## Task 8: New Post Form Component

**Files:**
- Create: `src/components/posts/new-post-form.tsx`

**Step 1: Write the component**

```tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createPost,
  appendTextBlock,
  appendPhotosBlock,
  appendVideoBlock,
} from "@/lib/actions/posts";

type BlockType = "text" | "photos" | "video";

export function NewPostForm({
  clubId,
  userAvatarUrl,
  userInitial,
}: {
  clubId: string;
  userAvatarUrl?: string | null;
  userInitial: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockType, setBlockType] = useState<BlockType>("text");
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const location = fd.get("location") as string;
    const eventDate = fd.get("eventDate") as string;

    const postResult = await createPost(clubId, { title, location, eventDate });
    if (postResult.error || !postResult.post) {
      setError(postResult.error ?? "Failed to create post");
      setSaving(false);
      return;
    }

    const postId = (postResult.post as any).id;
    let blockError: string | null = null;

    if (blockType === "text") {
      const body = fd.get("body") as string;
      if (body?.trim()) {
        const r = await appendTextBlock(postId, body);
        if (r.error) blockError = r.error;
      }
    } else if (blockType === "video") {
      const url = fd.get("videoUrl") as string;
      const caption = fd.get("videoCaption") as string;
      if (url?.trim()) {
        const r = await appendVideoBlock(postId, url, caption);
        if (r.error) blockError = r.error;
      }
    } else if (blockType === "photos") {
      const r = await appendPhotosBlock(postId, fd);
      if (r.error) blockError = r.error;
    }

    if (blockError) setError(blockError);
    setSaving(false);
    setOpen(false);
    setPreviews([]);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-400 shadow-sm hover:border-green-300 hover:text-green-600 transition"
      >
        {userAvatarUrl ? (
          <img src={userAvatarUrl} className="h-8 w-8 rounded-full object-cover" alt="" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
            {userInitial}
          </div>
        )}
        写一条手记...
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input name="title" placeholder="标题（可选）" />
          <Input name="location" placeholder="📍 地点（可选）" />
        </div>
        <Input name="eventDate" type="datetime-local" label="时间" defaultValue={new Date().toISOString().slice(0, 16)} />

        {/* Block type selector */}
        <div className="flex gap-2">
          {(["text", "photos", "video"] as BlockType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setBlockType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                blockType === t
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t === "text" ? "📝 文字" : t === "photos" ? "📷 照片" : "🎬 视频"}
            </button>
          ))}
        </div>

        {blockType === "text" && (
          <textarea
            name="body"
            rows={4}
            placeholder="写下今天的故事..."
            required
            className="block w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
        )}

        {blockType === "photos" && (
          <div>
            <div
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-8 hover:border-green-400"
              onClick={() => fileRef.current?.click()}
            >
              <span className="text-3xl">📷</span>
              <p className="mt-2 text-sm text-gray-500">点击或拖拽上传照片</p>
              <input
                ref={fileRef}
                name="photos"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setPreviews(files.map((f) => URL.createObjectURL(f)));
                }}
              />
            </div>
            {previews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-1.5">
                {previews.map((url, i) => (
                  <img key={i} src={url} className="aspect-square rounded-lg object-cover" alt="" />
                ))}
              </div>
            )}
          </div>
        )}

        {blockType === "video" && (
          <div className="space-y-3">
            <Input name="videoUrl" placeholder="YouTube 或 Bilibili 链接" required />
            <Input name="videoCaption" placeholder="标题说明（可选）" />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => { setOpen(false); setPreviews([]); }}>
            取消
          </Button>
          <Button type="submit" isLoading={saving}>
            发布
          </Button>
        </div>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/posts/new-post-form.tsx
git commit -m "feat: add NewPostForm component"
```

---

## Task 9: Posts Feed Page (New Club Home)

**Files:**
- Replace: `src/app/[locale]/club/[slug]/page.tsx`

**Step 1: Write the new page**

```tsx
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { generateClubJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/posts/post-card";
import { NewPostForm } from "@/components/posts/new-post-form";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("*").eq("slug", slug).single();
  if (!club) return { title: "Club Not Found" };
  const row = club as ClubRow;
  return {
    title: `${row.name} | Football Club Portal`,
    description: row.description || `${row.name} on Football Club Portal`,
    openGraph: { title: row.name, images: row.badge_url ? [{ url: row.badge_url }] : [] },
  };
}

export default async function ClubPostsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  let isMember = false;
  let isAdmin = false;
  let profile: any = null;

  if (user) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("club_id", (club as any).id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    isMember = !!m;
    isAdmin = (m as any)?.role === "admin";

    const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    profile = p;
  }

  // Fetch posts with all blocks
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles(display_name, avatar_url),
      post_blocks(
        *,
        profiles(display_name, avatar_url),
        post_block_photos(id, url, sort_order)
      )
    `)
    .eq("club_id", (club as any).id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 space-y-5">
      {isMember && (
        <NewPostForm
          clubId={(club as any).id}
          userAvatarUrl={profile?.avatar_url}
          userInitial={(profile?.display_name || user?.email || "?")[0].toUpperCase()}
        />
      )}

      {posts && posts.length > 0 ? (
        posts.map((post: any) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
            clubSlug={slug}
          />
        ))
      ) : (
        <div className="py-16 text-center">
          <p className="text-5xl">⚽</p>
          <p className="mt-4 text-base font-semibold text-gray-700">还没有任何动态</p>
          {isMember ? (
            <p className="mt-2 text-sm text-gray-400">发一条手记，记录你们的故事</p>
          ) : (
            <p className="mt-2 text-sm text-gray-400">加入俱乐部后可以发布动态</p>
          )}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/\[locale\]/club/\[slug\]/page.tsx
git commit -m "feat: replace club home with posts feed"
```

---

## Task 10: Final Verification & Cleanup

**Step 1: Check for stray album references**

```bash
grep -r "album" src/ --include="*.tsx" --include="*.ts" -l
```

Remove or fix any remaining references.

**Step 2: Check lints**

```bash
npx tsc --noEmit
```

Fix any type errors.

**Step 3: Test manually**

- Visit `/club/[slug]` → should show empty feed with "写一条手记..." prompt (if logged in as member)
- Create a post with text block → should appear in feed
- Create a post with photos → photo grid shows correctly
- Create a post with video URL → embed shows
- Admin can pin a post → appears at top with green border
- Author can delete their post
- Non-member sees empty state with "加入俱乐部后可以发布动态"
- Visit `/club/[slug]/about` → shows members + description

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete posts (手记) feature — feed, blocks, media, admin actions"
git push
```
