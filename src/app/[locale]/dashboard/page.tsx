import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("profile");
  const tl = await getTranslations("landing");

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, clubs(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("joined_at", { ascending: false });

  const adminClubs = (memberships ?? []).filter((m: any) => m.role === "admin");
  const memberClubs = (memberships ?? []).filter((m: any) => m.role === "member");
  const p = profile as any;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* Profile card */}
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {/* Top gradient strip */}
          <div className="h-2 w-full bg-gradient-to-r from-green-400 via-green-500 to-emerald-600" />
          <div className="flex items-center gap-5 p-6">
            {p?.avatar_url ? (
              <img
                src={p.avatar_url}
                alt={p.display_name}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-white shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-2xl font-bold text-white shadow-md">
                {(p?.display_name || user.email || "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {p?.display_name || user.email}
              </h1>
              <p className="text-sm text-gray-400">{user.email}</p>
              {p?.bio && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">{p.bio}</p>
              )}
            </div>
            <Link
              href="/profile"
              className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300"
            >
              {t("editProfile")}
            </Link>
          </div>
        </div>

        {/* My Clubs */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">My Clubs</h2>
            <Link
              href="/create-club"
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Club
            </Link>
          </div>

          {adminClubs.length === 0 && memberClubs.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-700">No clubs yet</p>
              <p className="mt-1 text-sm text-gray-400">Create your first club to get started.</p>
              <Link
                href="/create-club"
                className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                {tl("cta")} →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-6">
              {adminClubs.length > 0 && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Admin</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {adminClubs.map((m: any) => <ClubCard key={m.id} membership={m} isAdmin />)}
                  </div>
                </div>
              )}
              {memberClubs.length > 0 && (
                <div>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-gray-400">Member</p>
                  <div className="grid gap-3 sm:grid-cols-2">
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
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-4 p-4">
        {club.badge_url ? (
          <img src={club.badge_url} alt={club.name} className="h-12 w-12 rounded-xl object-cover shadow-sm" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-400 to-green-600 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2.5" fill="white"/>
            </svg>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 truncate">{club.name}</p>
          <p className="text-xs text-gray-400 truncate">/{club.slug}</p>
        </div>
        {isAdmin && (
          <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
            Admin
          </span>
        )}
      </div>
      <div className="flex border-t border-gray-50 divide-x divide-gray-50">
        <Link
          href={`/club/${club.slug}`}
          className="flex-1 py-2.5 text-center text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          View Club
        </Link>
        {isAdmin && (
          <Link
            href={`/club/${club.slug}`}
            className="flex-1 py-2.5 text-center text-xs font-semibold text-green-600 hover:bg-green-50 transition-colors"
          >
            Manage →
          </Link>
        )}
      </div>
    </div>
  );
}
