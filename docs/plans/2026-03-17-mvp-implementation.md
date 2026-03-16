# Football Club Portal — MVP 实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 构建一个多租户业余足球俱乐部门户网站，支持球队创建、成员管理（邀请+申请）、共享相册、多语言（EN/zh-CN/ES），部署到 Vercel。

**架构：** Next.js App Router（SSR/ISR）+ Supabase（Auth + PostgreSQL + Storage）。所有后端逻辑通过 Next.js Server Actions 直接调用 Supabase，不单独部署后端服务。路由使用 `next-intl` 的 locale 前缀实现多语言，使用 `/club/[slug]` 子路径实现多租户。

**技术栈：** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Supabase (JS SDK v2), next-intl, Vercel

---

## Task 1: 项目脚手架

**文件：**
- 创建: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.js`
- 创建: `src/app/layout.tsx`, `src/app/page.tsx`
- 创建: `.env.example`

**步骤 1: 初始化 Next.js 项目**

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

选择 pnpm 作为包管理器。如果目录非空（已有 docs/README 等），先把它们临时移走再创建，然后移回来。

**步骤 2: 安装核心依赖**

```bash
pnpm add @supabase/supabase-js @supabase/ssr next-intl
pnpm add -D supabase
```

**步骤 3: 创建环境变量模板**

创建 `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**步骤 4: 验证开发服务器启动**

```bash
pnpm dev
```

预期：浏览器打开 `http://localhost:3000` 能看到 Next.js 默认页面。

**步骤 5: 提交**

```bash
git add -A
git commit -m "feat: initialize Next.js project with core dependencies"
```

---

## Task 2: Supabase 本地开发环境 & 数据库 Schema

**文件：**
- 创建: `supabase/config.toml`（由 `supabase init` 生成）
- 创建: `supabase/migrations/00001_initial_schema.sql`
- 创建: `supabase/seed.sql`

**步骤 1: 初始化 Supabase 本地项目**

```bash
pnpm supabase init
```

**步骤 2: 编写初始 migration**

创建 `supabase/migrations/00001_initial_schema.sql`:

```sql
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
```

**步骤 3: 编写种子数据**

创建 `supabase/seed.sql`:

```sql
-- seed data will be added after auth is set up
-- placeholder for now
```

**步骤 4: 启动本地 Supabase 并执行 migration**

```bash
pnpm supabase start
pnpm supabase db reset
```

预期：所有表创建成功，`supabase status` 显示本地 API URL 和 anon key。

**步骤 5: 将本地 Supabase URL 和 key 填入 `.env.local`**

```bash
cp .env.example .env.local
# 编辑 .env.local，填入 supabase start 输出的 URL 和 anon key
```

**步骤 6: 提交**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with profiles, clubs, memberships, invitations, albums, photos"
```

---

## Task 3: Row Level Security (RLS) 策略

**文件：**
- 创建: `supabase/migrations/00002_rls_policies.sql`

**步骤 1: 编写 RLS 策略**

创建 `supabase/migrations/00002_rls_policies.sql`:

```sql
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

-- insert: user can self-apply (pending), or any authenticated user (for invitation flow via server action)
create policy "memberships_insert" on public.memberships
  for insert with check (
    auth.uid() is not null
    and user_id = auth.uid()
  );

-- update: admin can update any member in their club; member can update own record
create policy "memberships_update" on public.memberships
  for update using (
    public.is_club_admin(club_id)
    or (auth.uid() = user_id and status = 'active')
  );

-- delete: admin can remove anyone; member can remove self (leave)
create policy "memberships_delete" on public.memberships
  for delete using (
    public.is_club_admin(club_id)
    or auth.uid() = user_id
  );

-- ============ invitations ============
create policy "invitations_select" on public.invitations
  for select using (public.is_club_admin(club_id));

-- allow anyone to read invitation by code (for joining flow, handled via server action)
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
```

**步骤 2: 应用 migration**

```bash
pnpm supabase db reset
```

预期：所有表和策略创建成功，无错误。

**步骤 3: 提交**

```bash
git add supabase/
git commit -m "feat: add RLS policies for all tables"
```

---

## Task 4: Supabase Storage Bucket

**文件：**
- 创建: `supabase/migrations/00003_storage.sql`

**步骤 1: 创建 Storage bucket 和策略**

创建 `supabase/migrations/00003_storage.sql`:

```sql
-- create storage bucket for public media (avatars, badges, photos)
insert into storage.buckets (id, name, public)
values ('media', 'media', true);

-- anyone can read public bucket
create policy "media_select" on storage.objects
  for select using (bucket_id = 'media');

-- authenticated users can upload
create policy "media_insert" on storage.objects
  for insert with check (
    bucket_id = 'media'
    and auth.uid() is not null
  );

-- users can update/delete their own uploads
create policy "media_update" on storage.objects
  for update using (
    bucket_id = 'media'
    and auth.uid() = owner
  );

create policy "media_delete" on storage.objects
  for delete using (
    bucket_id = 'media'
    and auth.uid() = owner
  );
```

**步骤 2: 应用 migration**

```bash
pnpm supabase db reset
```

**步骤 3: 提交**

```bash
git add supabase/
git commit -m "feat: add Supabase storage bucket for media uploads"
```

---

## Task 5: Supabase 客户端工具 & TypeScript 类型

**文件：**
- 创建: `src/lib/supabase/client.ts`（浏览器端 Supabase 客户端）
- 创建: `src/lib/supabase/server.ts`（Server Action 用的 Supabase 客户端）
- 创建: `src/lib/supabase/middleware.ts`（中间件用的 Supabase 客户端）
- 创建: `src/lib/types/database.ts`（从 Supabase 生成的数据库类型）
- 创建: `src/middleware.ts`（Next.js 中间件，刷新 session）

**步骤 1: 生成数据库 TypeScript 类型**

```bash
pnpm supabase gen types typescript --local > src/lib/types/database.ts
```

**步骤 2: 创建浏览器端 Supabase 客户端**

创建 `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**步骤 3: 创建服务端 Supabase 客户端**

创建 `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from Server Component — ignore
          }
        },
      },
    }
  );
}
```

**步骤 4: 创建中间件 Supabase 客户端**

创建 `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
```

**步骤 5: 创建 Next.js 中间件**（集成 next-intl 和 Supabase session 刷新，下一个 Task 处理 i18n 部分，这里先只做 Supabase session）

创建 `src/middleware.ts`:

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**步骤 6: 验证项目仍能正常构建**

```bash
pnpm build
```

预期：构建成功，无类型错误。

**步骤 7: 提交**

```bash
git add src/lib/ src/middleware.ts
git commit -m "feat: add Supabase client utilities and TypeScript types"
```

---

## Task 6: i18n 配置（next-intl）

**文件：**
- 创建: `src/i18n/request.ts`
- 创建: `src/i18n/routing.ts`
- 创建: `src/i18n/navigation.ts`
- 创建: `src/messages/en.json`
- 创建: `src/messages/zh.json`
- 创建: `src/messages/es.json`
- 修改: `src/middleware.ts`（集成 next-intl）
- 修改: `next.config.ts`（添加 next-intl 插件）
- 创建: `src/app/[locale]/layout.tsx`

**步骤 1: 配置 i18n routing**

创建 `src/i18n/routing.ts`:

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh", "es"],
  defaultLocale: "en",
});
```

创建 `src/i18n/navigation.ts`:

```typescript
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

创建 `src/i18n/request.ts`:

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**步骤 2: 创建翻译文件（先只放少量基础文案，后续 Task 随页面开发逐步补充）**

创建 `src/messages/en.json`:

```json
{
  "common": {
    "appName": "Football Club Portal",
    "login": "Log In",
    "register": "Sign Up",
    "logout": "Log Out",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "error": "Something went wrong",
    "back": "Back"
  },
  "landing": {
    "title": "Your Club, Your Identity",
    "subtitle": "Create a beautiful online home for your amateur football club — free, in minutes.",
    "cta": "Create Your Club",
    "features": {
      "profile": "Club Profile",
      "profileDesc": "Showcase your club with badge, name, and story.",
      "members": "Member Roster",
      "membersDesc": "Everyone on the team, with their own profile card.",
      "albums": "Photo Albums",
      "albumsDesc": "Share match day photos and team memories."
    }
  },
  "auth": {
    "loginTitle": "Welcome Back",
    "registerTitle": "Join the Game",
    "email": "Email",
    "password": "Password",
    "displayName": "Display Name",
    "noAccount": "Don't have an account?",
    "hasAccount": "Already have an account?"
  },
  "club": {
    "members": "Members",
    "albums": "Albums",
    "about": "About",
    "founded": "Founded",
    "joinClub": "Apply to Join",
    "createClub": "Create Your Club",
    "pendingApproval": "Pending Approval",
    "manage": "Manage Club"
  },
  "manage": {
    "clubInfo": "Club Info",
    "memberManagement": "Members",
    "albumManagement": "Albums",
    "inviteLink": "Invite Link",
    "generateInvite": "Generate Invite Link",
    "copyLink": "Copy Link",
    "approve": "Approve",
    "reject": "Reject",
    "remove": "Remove",
    "pendingRequests": "Pending Requests"
  },
  "profile": {
    "editProfile": "Edit Profile",
    "displayName": "Display Name",
    "bio": "Bio",
    "avatar": "Avatar",
    "myClubs": "My Clubs"
  },
  "member": {
    "number": "Jersey #",
    "position": "Position",
    "positions": {
      "GK": "Goalkeeper",
      "DF": "Defender",
      "MF": "Midfielder",
      "FW": "Forward"
    }
  },
  "album": {
    "createAlbum": "Create Album",
    "albumTitle": "Album Title",
    "description": "Description",
    "uploadPhotos": "Upload Photos",
    "noPhotos": "No photos yet",
    "noAlbums": "No albums yet"
  },
  "invitation": {
    "joinViaInvite": "You've been invited to join",
    "joinNow": "Join Now",
    "invalidCode": "This invite link is invalid or expired."
  },
  "footer": {
    "createYourClub": "Create your own club page — it's free!",
    "poweredBy": "Football Club Portal"
  }
}
```

创建 `src/messages/zh.json`:

```json
{
  "common": {
    "appName": "足球俱乐部门户",
    "login": "登录",
    "register": "注册",
    "logout": "退出",
    "save": "保存",
    "cancel": "取消",
    "delete": "删除",
    "edit": "编辑",
    "loading": "加载中...",
    "error": "出错了",
    "back": "返回"
  },
  "landing": {
    "title": "你的球队，你的身份",
    "subtitle": "为你的业余足球俱乐部创建一个漂亮的线上主页——免费，只需几分钟。",
    "cta": "创建球队",
    "features": {
      "profile": "球队主页",
      "profileDesc": "展示你的队徽、队名和故事。",
      "members": "成员列表",
      "membersDesc": "每位队员都有自己的个人卡片。",
      "albums": "照片相册",
      "albumsDesc": "分享比赛日照片和团队记忆。"
    }
  },
  "auth": {
    "loginTitle": "欢迎回来",
    "registerTitle": "加入球场",
    "email": "邮箱",
    "password": "密码",
    "displayName": "显示名称",
    "noAccount": "还没有账号？",
    "hasAccount": "已有账号？"
  },
  "club": {
    "members": "成员",
    "albums": "相册",
    "about": "关于",
    "founded": "成立于",
    "joinClub": "申请加入",
    "createClub": "创建球队",
    "pendingApproval": "等待审批",
    "manage": "管理球队"
  },
  "manage": {
    "clubInfo": "球队信息",
    "memberManagement": "成员管理",
    "albumManagement": "相册管理",
    "inviteLink": "邀请链接",
    "generateInvite": "生成邀请链接",
    "copyLink": "复制链接",
    "approve": "通过",
    "reject": "拒绝",
    "remove": "移除",
    "pendingRequests": "待审批申请"
  },
  "profile": {
    "editProfile": "编辑资料",
    "displayName": "显示名称",
    "bio": "个人简介",
    "avatar": "头像",
    "myClubs": "我的球队"
  },
  "member": {
    "number": "球衣号码",
    "position": "位置",
    "positions": {
      "GK": "守门员",
      "DF": "后卫",
      "MF": "中场",
      "FW": "前锋"
    }
  },
  "album": {
    "createAlbum": "创建相册",
    "albumTitle": "相册标题",
    "description": "描述",
    "uploadPhotos": "上传照片",
    "noPhotos": "还没有照片",
    "noAlbums": "还没有相册"
  },
  "invitation": {
    "joinViaInvite": "你被邀请加入",
    "joinNow": "立即加入",
    "invalidCode": "邀请链接无效或已过期。"
  },
  "footer": {
    "createYourClub": "为你的球队也创建一个主页——完全免费！",
    "poweredBy": "足球俱乐部门户"
  }
}
```

创建 `src/messages/es.json`:

```json
{
  "common": {
    "appName": "Portal de Club de Fútbol",
    "login": "Iniciar Sesión",
    "register": "Registrarse",
    "logout": "Cerrar Sesión",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "loading": "Cargando...",
    "error": "Algo salió mal",
    "back": "Volver"
  },
  "landing": {
    "title": "Tu Club, Tu Identidad",
    "subtitle": "Crea un hermoso hogar en línea para tu club de fútbol amateur — gratis, en minutos.",
    "cta": "Crea Tu Club",
    "features": {
      "profile": "Perfil del Club",
      "profileDesc": "Muestra tu club con escudo, nombre e historia.",
      "members": "Lista de Miembros",
      "membersDesc": "Todos en el equipo, con su propia tarjeta de perfil.",
      "albums": "Álbumes de Fotos",
      "albumsDesc": "Comparte fotos de partidos y recuerdos del equipo."
    }
  },
  "auth": {
    "loginTitle": "Bienvenido de Nuevo",
    "registerTitle": "Únete al Juego",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "displayName": "Nombre para mostrar",
    "noAccount": "¿No tienes cuenta?",
    "hasAccount": "¿Ya tienes cuenta?"
  },
  "club": {
    "members": "Miembros",
    "albums": "Álbumes",
    "about": "Acerca de",
    "founded": "Fundado en",
    "joinClub": "Solicitar Unirse",
    "createClub": "Crea Tu Club",
    "pendingApproval": "Aprobación Pendiente",
    "manage": "Gestionar Club"
  },
  "manage": {
    "clubInfo": "Info del Club",
    "memberManagement": "Miembros",
    "albumManagement": "Álbumes",
    "inviteLink": "Enlace de Invitación",
    "generateInvite": "Generar Enlace de Invitación",
    "copyLink": "Copiar Enlace",
    "approve": "Aprobar",
    "reject": "Rechazar",
    "remove": "Eliminar",
    "pendingRequests": "Solicitudes Pendientes"
  },
  "profile": {
    "editProfile": "Editar Perfil",
    "displayName": "Nombre para mostrar",
    "bio": "Biografía",
    "avatar": "Avatar",
    "myClubs": "Mis Clubes"
  },
  "member": {
    "number": "Dorsal",
    "position": "Posición",
    "positions": {
      "GK": "Portero",
      "DF": "Defensa",
      "MF": "Centrocampista",
      "FW": "Delantero"
    }
  },
  "album": {
    "createAlbum": "Crear Álbum",
    "albumTitle": "Título del Álbum",
    "description": "Descripción",
    "uploadPhotos": "Subir Fotos",
    "noPhotos": "Aún no hay fotos",
    "noAlbums": "Aún no hay álbumes"
  },
  "invitation": {
    "joinViaInvite": "Has sido invitado a unirte a",
    "joinNow": "Unirse Ahora",
    "invalidCode": "Este enlace de invitación no es válido o ha expirado."
  },
  "footer": {
    "createYourClub": "¡Crea la página de tu propio club — es gratis!",
    "poweredBy": "Portal de Club de Fútbol"
  }
}
```

**步骤 3: 更新 Next.js 配置**

修改 `next.config.ts`，添加 next-intl 插件:

```typescript
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig = {};

export default withNextIntl(nextConfig);
```

**步骤 4: 更新中间件，集成 next-intl**

修改 `src/middleware.ts`:

```typescript
import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**步骤 5: 创建 locale layout**

创建 `src/app/[locale]/layout.tsx`:

```tsx
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

更新 `src/app/[locale]/page.tsx`（临时首页，验证 i18n 工作）:

```tsx
import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("landing");

  return (
    <main>
      <h1>{t("title")}</h1>
      <p>{t("subtitle")}</p>
    </main>
  );
}
```

**步骤 6: 验证**

```bash
pnpm dev
```

预期：
- `http://localhost:3000/en` 显示英文 "Your Club, Your Identity"
- `http://localhost:3000/zh` 显示中文 "你的球队，你的身份"
- `http://localhost:3000/es` 显示西班牙文 "Tu Club, Tu Identidad"
- `http://localhost:3000` 自动重定向到 `/en`

**步骤 7: 提交**

```bash
git add -A
git commit -m "feat: add i18n with next-intl (EN/zh-CN/ES)"
```

---

## Task 7: 全局 Layout & UI 基础组件

**文件：**
- 修改: `src/app/layout.tsx`（根 layout，设置 html/body）
- 修改: `src/app/[locale]/layout.tsx`（locale layout，添加导航栏）
- 创建: `src/components/layout/navbar.tsx`
- 创建: `src/components/layout/footer.tsx`
- 创建: `src/components/ui/button.tsx`
- 修改: `src/app/globals.css`（Tailwind 全局样式）

**步骤 1: 设置根 layout**

修改 `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Football Club Portal",
  description:
    "Create a beautiful online home for your amateur football club — free, in minutes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**步骤 2: 创建 Navbar 组件**

创建 `src/components/layout/navbar.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Navbar() {
  const t = useTranslations("common");

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-gray-900">
          {t("appName")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t("register")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
```

**步骤 3: 创建 Footer 组件**

创建 `src/components/layout/footer.tsx`:

```tsx
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center">
        <p className="text-sm text-gray-600">{t("createYourClub")}</p>
        <Link
          href="/register"
          className="mt-2 inline-block text-sm font-medium text-green-600 hover:text-green-700"
        >
          {t("poweredBy")}
        </Link>
      </div>
    </footer>
  );
}
```

**步骤 4: 创建 Button 组件**

创建 `src/components/ui/button.tsx`:

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
  secondary:
    "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-green-500",
  danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  ghost: "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

**步骤 5: 集成到 locale layout**

修改 `src/app/[locale]/layout.tsx`，添加 Navbar 和 Footer。

**步骤 6: 验证**

```bash
pnpm dev
```

预期：首页显示导航栏（应用名 + 登录/注册按钮）和底部栏。

**步骤 7: 提交**

```bash
git add -A
git commit -m "feat: add global layout with navbar, footer, and button component"
```

---

## Task 8: 用户注册 & 登录

**文件：**
- 创建: `src/app/[locale]/(auth)/login/page.tsx`
- 创建: `src/app/[locale]/(auth)/register/page.tsx`
- 创建: `src/app/[locale]/(auth)/layout.tsx`
- 创建: `src/lib/actions/auth.ts`（Server Actions）

**步骤 1: 创建 auth Server Actions**

创建 `src/lib/actions/auth.ts`:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: "/", locale });
}

export async function register(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const displayName = formData.get("displayName") as string;

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect({ href: "/", locale });
}

export async function logout() {
  const supabase = await createClient();
  const locale = await getLocale();
  await supabase.auth.signOut();
  redirect({ href: "/", locale });
}
```

**步骤 2: 创建登录页面和注册页面**

使用表单 + Server Action，样式用 Tailwind 做成简洁的卡片样式。包含邮箱、密码输入框，注册页额外有显示名称输入框。表单底部有链接在登录/注册之间切换。

**步骤 3: 更新 Navbar，根据登录状态显示不同内容**

已登录时显示用户名 + 退出按钮，未登录显示登录/注册按钮。

**步骤 4: 验证**

```bash
pnpm dev
```

预期：
- `/en/register` 可以注册新用户
- `/en/login` 可以登录
- 登录后 Navbar 显示用户名
- Supabase Dashboard（`http://localhost:54323`）中 auth.users 和 profiles 表有对应记录

**步骤 5: 提交**

```bash
git add -A
git commit -m "feat: add user registration and login with Supabase Auth"
```

---

## Task 9: 用户资料页面

**文件：**
- 创建: `src/app/[locale]/(auth)/profile/page.tsx`
- 创建: `src/lib/actions/profile.ts`

**步骤 1: 创建 profile Server Actions**

创建 `src/lib/actions/profile.ts`，包含：
- `updateProfile(formData)`: 更新 display_name, bio
- `updateAvatar(formData)`: 上传头像到 Supabase Storage `media/avatars/{user_id}`，更新 profiles.avatar_url

**步骤 2: 创建 Profile 页面**

展示和编辑：头像（可上传）、显示名称、简介。底部展示"我的球队"列表（从 memberships 查询 status=active 的球队）。

**步骤 3: 验证**

预期：登录后访问 `/en/profile`，可以编辑名称、上传头像、查看已加入的球队。

**步骤 4: 提交**

```bash
git add -A
git commit -m "feat: add user profile page with avatar upload"
```

---

## Task 10: 创建球队

**文件：**
- 创建: `src/app/[locale]/create-club/page.tsx`
- 创建: `src/lib/actions/club.ts`

**步骤 1: 创建 club Server Actions**

创建 `src/lib/actions/club.ts`，包含：
- `createClub(formData)`: 创建 club + 创建 membership(role=admin, status=active)，重定向到球队主页
- `updateClub(formData)`: 更新球队信息
- `uploadBadge(formData)`: 上传队徽到 `media/badges/{club_id}`

**步骤 2: 创建"创建球队"页面**

表单字段：球队名称（必填）、slug（必填，自动从名称生成，可手动改）、队徽（可选上传）、成立日期（可选）、简介（可选）。

**步骤 3: 验证**

预期：登录用户访问 `/en/create-club`，填写信息提交后跳转到 `/en/club/dragon-fc`。数据库中 clubs 和 memberships 表有对应记录。

**步骤 4: 提交**

```bash
git add -A
git commit -m "feat: add club creation flow"
```

---

## Task 11: 球队公开页面

**文件：**
- 创建: `src/app/[locale]/club/[slug]/page.tsx`（球队主页）
- 创建: `src/app/[locale]/club/[slug]/layout.tsx`（球队 layout，导航栏/标签页）
- 创建: `src/app/[locale]/club/[slug]/members/page.tsx`（成员列表）
- 创建: `src/components/club/club-header.tsx`
- 创建: `src/components/club/member-card.tsx`

**步骤 1: 创建球队 layout**

球队页面共享一个 layout，顶部显示队徽+队名+简介，下方有 tabs（主页/成员/相册）。如果当前用户是 admin，显示"管理球队"入口。如果当前用户未加入，显示"申请加入"按钮。

**步骤 2: 创建球队主页**

SSR 页面，通过 slug 查询 clubs 表。显示：球队信息、成员数量预览（前几位成员头像）、最新相册预览。添加 JSON-LD 结构化数据（SportsTeam schema）和 Open Graph meta tags。

**步骤 3: 创建成员列表页**

SSR 页面，查询 memberships(status=active) JOIN profiles。以卡片网格展示：头像、显示名称、号码（如有）、位置（如有）。

**步骤 4: 验证**

预期：
- `/en/club/dragon-fc` 显示球队信息
- `/en/club/dragon-fc/members` 显示成员列表
- 查看页面源码，能看到 JSON-LD 和 OG 标签

**步骤 5: 提交**

```bash
git add -A
git commit -m "feat: add public club page and member list with SEO"
```

---

## Task 12: 邀请链接 & 申请加入

**文件：**
- 创建: `src/lib/actions/membership.ts`
- 创建: `src/app/[locale]/join/[code]/page.tsx`
- 创建: `src/lib/actions/invitation.ts`

**步骤 1: 创建 membership Server Actions**

创建 `src/lib/actions/membership.ts`，包含：
- `applyToJoin(clubId)`: 创建 membership(status=pending)
- `approveMembership(membershipId)`: admin 将 status 改为 active
- `rejectMembership(membershipId)`: admin 删除 pending membership
- `removeMember(membershipId)`: admin 移除成员
- `leaveClub(membershipId)`: 成员自己退出
- `updateMyMembership(formData)`: 成员更新自己的号码/位置

**步骤 2: 创建 invitation Server Actions**

创建 `src/lib/actions/invitation.ts`，包含：
- `generateInviteLink(clubId)`: 生成随机 code，创建 invitations 记录，返回链接
- `joinViaInvite(code)`: 验证邀请码有效性，创建 membership(status=active)，增加 use_count

**步骤 3: 创建邀请链接落地页**

`/join/[code]` 页面：查询邀请码 → 显示球队信息 → 已登录直接加入 / 未登录先注册。

**步骤 4: 在球队主页添加"申请加入"按钮**

根据用户状态显示不同 UI：
- 未登录 → "申请加入"（点击跳转登录）
- 已登录未加入 → "申请加入"
- 已申请待审批 → "等待审批"（灰色）
- 已是成员 → 不显示

**步骤 5: 验证**

预期：
- 管理员生成邀请链接，新用户通过链接注册后自动加入球队
- 新用户在球队页面点击"申请加入"，管理员可以看到待审批申请

**步骤 6: 提交**

```bash
git add -A
git commit -m "feat: add invite link and apply-to-join flows"
```

---

## Task 13: 球队管理后台

**文件：**
- 创建: `src/app/[locale]/club/[slug]/manage/layout.tsx`
- 创建: `src/app/[locale]/club/[slug]/manage/page.tsx`（管理首页/重定向）
- 创建: `src/app/[locale]/club/[slug]/manage/info/page.tsx`
- 创建: `src/app/[locale]/club/[slug]/manage/members/page.tsx`
- 创建: `src/app/[locale]/club/[slug]/manage/albums/page.tsx`

**步骤 1: 创建管理后台 layout**

`/club/[slug]/manage/layout.tsx`: 验证当前用户是该球队 admin，否则 redirect 到球队主页。左侧/顶部导航：球队信息 | 成员管理 | 相册管理。

**步骤 2: 创建球队信息编辑页**

表单：队名、slug、队徽（上传）、成立日期、简介。使用 `updateClub` Server Action。

**步骤 3: 创建成员管理页**

- 待审批列表（status=pending）：通过/拒绝按钮
- 现有成员列表（status=active）：显示角色、移除按钮
- 邀请链接区域：生成链接 + 复制按钮 + 已有链接列表

**步骤 4: 创建相册管理页（先只做创建相册，照片管理在 Task 15）**

- 创建相册表单（标题、描述）
- 已有相册列表 + 删除按钮

**步骤 5: 验证**

预期：admin 可以编辑球队信息、审批成员、生成邀请链接、创建/删除相册。

**步骤 6: 提交**

```bash
git add -A
git commit -m "feat: add club management dashboard (info, members, albums)"
```

---

## Task 14: 成员个人设置页

**文件：**
- 创建: `src/app/[locale]/club/[slug]/my/page.tsx`

**步骤 1: 创建"我在该球队的信息"页面**

`/club/[slug]/my` 页面：验证当前用户是该球队 active member。表单字段：球衣号码（可选）、位置（下拉选择 GK/DF/MF/FW，可选）。使用 `updateMyMembership` Server Action。

**步骤 2: 在球队 layout 中为已登录成员添加"我的信息"入口**

**步骤 3: 验证**

预期：成员可以设置/修改自己在该球队的号码和位置，成员列表页面即时反映变化。

**步骤 4: 提交**

```bash
git add -A
git commit -m "feat: add member self-service page for jersey number and position"
```

---

## Task 15: 相册 & 照片上传

**文件：**
- 创建: `src/app/[locale]/club/[slug]/albums/page.tsx`（相册列表）
- 创建: `src/app/[locale]/club/[slug]/albums/[id]/page.tsx`（相册详情）
- 创建: `src/app/[locale]/club/[slug]/albums/[id]/upload/page.tsx`（上传照片）
- 创建: `src/lib/actions/album.ts`
- 创建: `src/lib/actions/photo.ts`
- 创建: `src/components/album/photo-grid.tsx`
- 创建: `src/components/album/photo-lightbox.tsx`

**步骤 1: 创建 album & photo Server Actions**

`src/lib/actions/album.ts`:
- `createAlbum(formData)`: 创建相册
- `updateAlbum(formData)`: 更新相册信息
- `deleteAlbum(albumId)`: 删除相册（admin only）

`src/lib/actions/photo.ts`:
- `uploadPhotos(formData)`: 上传多张照片到 Supabase Storage `media/photos/{club_id}/{album_id}/`，在 photos 表创建记录
- `deletePhoto(photoId)`: 删除照片（上传者或 admin）

**步骤 2: 创建相册列表页**

SSR 页面，查询该球队的所有相册，以封面网格展示（封面取该相册第一张照片或 cover_url）。

**步骤 3: 创建相册详情页**

SSR 页面，照片网格。点击照片弹出 lightbox（全屏预览，左右翻页）。如果当前用户是成员，显示"上传照片"按钮。

**步骤 4: 创建照片上传页**

`/club/[slug]/albums/[id]/upload` 页面：拖拽或点击选择多张图片，预览后批量上传。上传完成后跳转回相册详情页。

**步骤 5: 验证**

预期：
- 管理员在管理后台创建相册
- 任意成员在相册中上传照片
- 公开用户可以浏览相册和照片
- lightbox 点击预览正常工作

**步骤 6: 提交**

```bash
git add -A
git commit -m "feat: add albums, photo upload, and lightbox viewer"
```

---

## Task 16: 落地页（Landing Page）

**文件：**
- 修改: `src/app/[locale]/page.tsx`

**步骤 1: 设计并实现落地页**

替换临时首页，实现一个漂亮的落地页：

1. **Hero 区域** — 大标题 + 副标题 + "Create Your Club" CTA 按钮
2. **特性展示** — 三栏卡片（球队主页、成员列表、相册）配图标
3. **如何使用** — 三步流程（注册 → 创建球队 → 邀请队友）
4. **Footer** — "为你的球队也创建一个" + 链接

使用 Tailwind 做漂亮的绿色主题（足球场的感觉），确保移动端响应式。

**步骤 2: 验证**

预期：三种语言下落地页文案正确切换，视觉效果美观，CTA 按钮链接到注册页。

**步骤 3: 提交**

```bash
git add -A
git commit -m "feat: add landing page with hero, features, and CTA"
```

---

## Task 17: SEO & Meta Tags

**文件：**
- 修改: `src/app/[locale]/club/[slug]/page.tsx`（添加 generateMetadata）
- 修改: `src/app/[locale]/club/[slug]/layout.tsx`（JSON-LD）
- 创建: `src/lib/seo.ts`（SEO 工具函数）
- 创建: `public/robots.txt`
- 创建: `src/app/sitemap.ts`

**步骤 1: 创建 SEO 工具函数**

`src/lib/seo.ts`: 生成 JSON-LD 结构化数据（SportsTeam schema）和 Open Graph meta tags 的辅助函数。

**步骤 2: 在球队页面添加 generateMetadata**

动态生成 title（球队名）、description（球队简介）、og:image（队徽）。

**步骤 3: 添加 JSON-LD**

在球队 layout 中注入 `<script type="application/ld+json">` SportsTeam 结构化数据。

**步骤 4: 添加 robots.txt 和 sitemap**

`robots.txt`: 允许所有爬虫。`sitemap.ts`: 动态生成，列出所有球队的公开 URL。

**步骤 5: 验证**

使用 Google Rich Results Test 或查看页面源码，确认 JSON-LD 和 meta tags 正确。

**步骤 6: 提交**

```bash
git add -A
git commit -m "feat: add SEO (JSON-LD, OG tags, sitemap, robots.txt)"
```

---

## Task 18: 部署到 Vercel

**文件：**
- 修改: `.env.example`（确保文档完整）

**步骤 1: 在 Supabase 创建线上项目**

1. 登录 https://supabase.com，创建新项目
2. 在 SQL Editor 中执行所有 migration 文件（00001, 00002, 00003）
3. 记录 Project URL 和 anon key

**步骤 2: 在 Vercel 部署**

1. 将代码 push 到 GitHub
2. 在 Vercel 中导入项目
3. 设置环境变量：`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 部署

**步骤 3: 验证**

预期：线上站点可以正常注册、创建球队、邀请成员、上传照片。三种语言正常切换。

**步骤 4: 提交部署配置（如有变化）**

```bash
git add -A
git commit -m "chore: finalize deployment configuration"
```

---

## 任务依赖关系

```
Task 1 (脚手架)
  ├── Task 2 (DB Schema)
  │     └── Task 3 (RLS)
  │           └── Task 4 (Storage)
  ├── Task 5 (Supabase 客户端)
  └── Task 6 (i18n)
        └── Task 7 (Layout & UI)
              ├── Task 8 (注册/登录)
              │     └── Task 9 (用户资料)
              │           └── Task 10 (创建球队)
              │                 ├── Task 11 (球队公开页)
              │                 ├── Task 12 (邀请 & 申请)
              │                 ├── Task 13 (管理后台)
              │                 └── Task 14 (成员设置)
              ├── Task 15 (相册 & 照片) ← 依赖 Task 10, 12
              └── Task 16 (落地页)
Task 17 (SEO) ← 依赖 Task 11
Task 18 (部署) ← 依赖所有
```

## 总估时

| Task | 预估时间（业余开发） |
|------|---------------------|
| Task 1-4 | 1 天 |
| Task 5-6 | 半天 |
| Task 7 | 半天 |
| Task 8-9 | 1 天 |
| Task 10-11 | 1 天 |
| Task 12 | 1 天 |
| Task 13 | 1 天 |
| Task 14 | 半天 |
| Task 15 | 1.5 天 |
| Task 16 | 半天 |
| Task 17 | 半天 |
| Task 18 | 半天 |
| **总计** | **约 9 天（业余时间）** |
