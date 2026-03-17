alter table public.posts
  add column if not exists updated_at timestamptz not null default now();

drop table if exists public.post_block_items cascade;
drop table if exists public.post_blocks cascade;

create table public.post_entries (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  sort_order int not null,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_post_entries_post_order
  on public.post_entries(post_id, sort_order);

alter table public.post_entries enable row level security;

create policy "post_entries_select" on public.post_entries
  for select
  using (true);

create policy "post_entries_insert" on public.post_entries
  for insert
  with check (
    auth.uid() is not null
    and auth.uid() = author_id
    and exists (
      select 1
      from public.posts p
      where p.id = post_id
        and public.is_club_member(p.club_id)
    )
  );

create policy "post_entries_delete" on public.post_entries
  for delete
  using (
    sort_order > 0
    and (
      auth.uid() = author_id
      or exists (
        select 1
        from public.posts p
        where p.id = post_id
          and public.is_club_admin(p.club_id)
      )
    )
  );

create or replace function public.touch_post_updated_at()
returns trigger
language plpgsql
as $$
begin
  update public.posts
  set updated_at = now()
  where id = coalesce(new.post_id, old.post_id);

  return coalesce(new, old);
end;
$$;

drop trigger if exists touch_post_updated_at_on_entries on public.post_entries;

create trigger touch_post_updated_at_on_entries
after insert or delete on public.post_entries
for each row
execute function public.touch_post_updated_at();
