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

-- post_blocks table (structural metadata only)
create table public.post_blocks (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid not null references public.profiles(id),
  type        text not null check (type in ('text', 'photos', 'video')),
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);
create index idx_post_blocks_post on public.post_blocks(post_id);

-- post_block_items table (all content — 1 row for text/video, N rows for photos)
create table public.post_block_items (
  id            uuid primary key default gen_random_uuid(),
  block_id      uuid not null references public.post_blocks(id) on delete cascade,
  body          text,
  url           text,
  video_url     text,
  video_caption text,
  sort_order    int not null default 0
);
create index idx_post_block_items_block on public.post_block_items(block_id);

-- RLS
alter table public.posts enable row level security;
alter table public.post_blocks enable row level security;
alter table public.post_block_items enable row level security;

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

-- post_block_items policies
create policy "post_block_items_select" on public.post_block_items for select using (true);
create policy "post_block_items_insert" on public.post_block_items for insert
  with check (auth.uid() is not null);
create policy "post_block_items_delete" on public.post_block_items for delete
  using (
    exists (
      select 1 from public.post_blocks pb where pb.id = block_id
      and pb.author_id = auth.uid()
    )
  );
