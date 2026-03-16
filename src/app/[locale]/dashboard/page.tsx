import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
  const tl = await getTranslations("landing");

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Profile header */}
      <div className="flex items-center gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        {p?.avatar_url ? (
          <img
            src={p.avatar_url}
            alt={p.display_name}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-green-100"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-2xl ring-2 ring-green-200">
            👤
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {p?.display_name || user.email}
          </h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          {p?.bio && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-1">{p.bio}</p>
          )}
        </div>
        <Link
          href="/profile"
          className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          {t("editProfile")}
        </Link>
      </div>

      {/* My admin clubs */}
      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">My Clubs</h2>
          <Link
            href="/create-club"
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            + {tl("cta")}
          </Link>
        </div>

        {adminClubs.length === 0 && memberClubs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-200 py-16 text-center">
            <p className="text-4xl">⚽</p>
            <p className="mt-3 text-sm font-medium text-gray-600">
              You haven&apos;t joined any clubs yet.
            </p>
            <Link
              href="/create-club"
              className="mt-4 inline-block rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              {tl("cta")} →
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {adminClubs.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Admin
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {adminClubs.map((m: any) => (
                    <ClubCard key={m.id} membership={m} locale={locale} isAdmin />
                  ))}
                </div>
              </div>
            )}

            {memberClubs.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Member
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {memberClubs.map((m: any) => (
                    <ClubCard key={m.id} membership={m} locale={locale} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClubCard({
  membership,
  locale,
  isAdmin = false,
}: {
  membership: any;
  locale: string;
  isAdmin?: boolean;
}) {
  const club = membership.clubs;
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-4 p-4">
        {club.badge_url ? (
          <img
            src={club.badge_url}
            alt={club.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">
            ⚽
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{club.name}</p>
          <p className="text-xs text-gray-400">/{club.slug}</p>
        </div>
      </div>
      <div className="flex gap-2 border-t border-gray-100 px-4 py-3">
        <Link
          href={`/club/${club.slug}`}
          className="flex-1 rounded-lg py-1.5 text-center text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          View
        </Link>
        {isAdmin && (
          <Link
            href={`/club/${club.slug}/manage/info`}
            className="flex-1 rounded-lg bg-green-50 py-1.5 text-center text-xs font-medium text-green-700 hover:bg-green-100"
          >
            Manage
          </Link>
        )}
      </div>
    </div>
  );
}
