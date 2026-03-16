-- enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.albums enable row level security;
alter table public.photos enable row level security;

-- helper function: check if user is admin of a club
create or replace function public.is_club_admin(p_club_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships
    where club_id = p_club_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$ language sql security definer stable;

-- helper function: check if user is active member of a club
create or replace function public.is_club_member(p_club_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.memberships
    where club_id = p_club_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$ language sql security definer stable;

-- ============ profiles ============
create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- ============ clubs ============
create policy "clubs_select" on public.clubs
  for select using (true);

create policy "clubs_insert" on public.clubs
  for insert with check (auth.uid() is not null);

create policy "clubs_update" on public.clubs
  for update using (public.is_club_admin(id));

create policy "clubs_delete" on public.clubs
  for delete using (public.is_club_admin(id));

-- ============ memberships ============
create policy "memberships_select" on public.memberships
  for select using (true);

create policy "memberships_insert" on public.memberships
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

create policy "memberships_update" on public.memberships
  for update using (
    public.is_club_admin(club_id)
    or (auth.uid() = user_id and status = 'active')
  );

create policy "memberships_delete" on public.memberships
  for delete using (
    public.is_club_admin(club_id)
    or auth.uid() = user_id
  );

-- ============ invitations ============
create policy "invitations_select" on public.invitations
  for select using (public.is_club_admin(club_id));

create policy "invitations_select_by_code" on public.invitations
  for select using (auth.uid() is not null);

create policy "invitations_insert" on public.invitations
  for insert with check (public.is_club_admin(club_id));

create policy "invitations_update" on public.invitations
  for update using (public.is_club_admin(club_id));

-- ============ albums ============
create policy "albums_select" on public.albums
  for select using (true);

create policy "albums_insert" on public.albums
  for insert with check (public.is_club_member(club_id));

create policy "albums_update" on public.albums
  for update using (
    auth.uid() = created_by
    or public.is_club_admin(club_id)
  );

create policy "albums_delete" on public.albums
  for delete using (public.is_club_admin(club_id));

-- ============ photos ============
create policy "photos_select" on public.photos
  for select using (true);

create policy "photos_insert" on public.photos
  for insert with check (
    exists (
      select 1 from public.albums a
      where a.id = album_id
        and public.is_club_member(a.club_id)
    )
  );

create policy "photos_delete" on public.photos
  for delete using (
    auth.uid() = uploaded_by
    or exists (
      select 1 from public.albums a
      where a.id = album_id
        and public.is_club_admin(a.club_id)
    )
  );
