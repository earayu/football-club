-- profiles: global user identity, 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

-- auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- clubs
create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  badge_url text,
  founded_date date,
  description text,
  created_at timestamptz not null default now()
);

-- memberships: user <-> club many-to-many
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('active', 'pending')),
  number int,
  position text check (position in ('GK', 'DF', 'MF', 'FW', null)),
  joined_at timestamptz not null default now(),
  unique(user_id, club_id)
);

-- invitations
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  code text unique not null,
  created_by uuid not null references public.profiles(id),
  expires_at timestamptz,
  max_uses int,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

-- albums
create table public.albums (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  title text not null,
  cover_url text,
  description text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- photos
create table public.photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  url text not null,
  caption text,
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- indexes
create index idx_memberships_club on public.memberships(club_id);
create index idx_memberships_user on public.memberships(user_id);
create index idx_albums_club on public.albums(club_id);
create index idx_photos_album on public.photos(album_id);
create index idx_invitations_code on public.invitations(code);
create index idx_clubs_slug on public.clubs(slug);
