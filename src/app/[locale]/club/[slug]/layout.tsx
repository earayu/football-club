import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];

export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const supabase = await createClient();
  const t = await getTranslations("club");

  const { data } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  const club = data as ClubRow | null;
  if (!club) notFound();

  const { count: memberCount } = await supabase
    .from("memberships")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .eq("status", "active");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userMembership: MembershipRow | null = null;
  if (user) {
    const { data } = await supabase
      .from("memberships")
      .select("*")
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .single();
    userMembership = data as MembershipRow | null;
  }

  const isAdmin =
    userMembership?.role === "admin" && userMembership?.status === "active";
  const isMember = userMembership?.status === "active";

  return (
    <div>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div className="flex items-start gap-5">
            {/* Badge */}
            <div className="shrink-0">
              {club.badge_url ? (
                <img
                  src={club.badge_url}
                  alt={club.name}
                  className="h-20 w-20 rounded-full object-cover shadow-sm ring-2 ring-gray-100"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl shadow-sm ring-2 ring-green-50">
                  ⚽
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
              {club.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {club.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                {club.founded_date && (
                  <span>
                    {t("founded")} {new Date(club.founded_date).getFullYear()}
                  </span>
                )}
                <span>{t("memberCount", { count: memberCount || 0 })}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {!user && (
                <Link
                  href="/register"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  {t("joinClub")}
                </Link>
              )}
              {isMember && !isAdmin && (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                  Member
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
