import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, PencilSimple, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("profile");
  const tl = await getTranslations("landing");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { redirect({ href: "/login", locale }); return; }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, clubs(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false });

  const adminClubs = (memberships ?? []).filter((m: any) => m.role === "admin");
  const memberClubs = (memberships ?? []).filter((m: any) => m.role === "member");
  const p = profile as any;
  const name = p?.display_name || user.email || "?";

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">

        {/* Profile row — borderless, no card */}
        <div className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {p?.avatar_url ? (
              <img src={p.avatar_url} alt={name} className="h-14 w-14 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-xl font-black text-white shadow-sm">
                {name[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight text-zinc-900">{name}</h1>
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
          </div>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition hover:bg-zinc-50"
          >
            <PencilSimple size={14} />
            {t("editProfile")}
          </Link>
        </div>

        {/* Clubs section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">My Clubs</h2>
            <Link
              href="/create-club"
              className="flex items-center gap-1.5 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-green-900/20 transition hover:bg-green-800"
            >
              <Plus size={14} weight="bold" />
              New Club
            </Link>
          </div>

          {adminClubs.length === 0 && memberClubs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 py-20 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                  <circle cx="12" cy="12" r="9.5" stroke="#15803d" strokeWidth="1.5"/>
                  <circle cx="12" cy="12" r="2.5" fill="#15803d" opacity=".7"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-700">No clubs yet</p>
              <p className="mt-1 text-sm text-zinc-400">Create your first club to get started.</p>
              <Link
                href="/create-club"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                {tl("cta")}
                <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {adminClubs.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Admin</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {adminClubs.map((m: any) => <ClubCard key={m.id} membership={m} isAdmin />)}
                  </div>
                </div>
              )}
              {memberClubs.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Member</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {memberClubs.map((m: any) => <ClubCard key={m.id} membership={m} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ClubCard({ membership, isAdmin = false }: { membership: any; isAdmin?: boolean }) {
  const club = membership.clubs;
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-4 p-5">
        {club.badge_url ? (
          <img src={club.badge_url} alt={club.name} className="h-11 w-11 rounded-xl object-cover shadow-sm" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-700 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="white" opacity=".85"/>
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-zinc-900">{club.name}</p>
          <p className="text-xs text-zinc-400">/{club.slug}</p>
        </div>
        {isAdmin && (
          <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-700">
            Admin
          </span>
        )}
      </div>
      <div className="flex border-t border-slate-100">
        <Link href={`/club/${club.slug}`} className="flex-1 py-2.5 text-center text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900">
          View
        </Link>
        {isAdmin && (
          <Link href={`/club/${club.slug}`} className="flex-1 border-l border-slate-100 py-2.5 text-center text-xs font-semibold text-green-700 transition hover:bg-green-50">
            Manage
          </Link>
        )}
      </div>
    </div>
  );
}
