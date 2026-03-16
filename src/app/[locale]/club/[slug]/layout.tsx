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
  params: Promise<{ slug: string; locale: string }>;
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
  if (!club) {
    notFound();
  }

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

  const isAdmin = userMembership?.role === "admin" && userMembership?.status === "active";

  return (
    <div>
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="flex items-center gap-6">
            {club.badge_url ? (
              <img
                src={club.badge_url}
                alt={club.name}
                className="h-20 w-20 rounded-full object-cover shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl shadow-md">
                ⚽
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
              {club.description && (
                <p className="mt-1 text-sm text-gray-600">{club.description}</p>
              )}
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                {club.founded_date && (
                  <span>
                    {t("founded")} {new Date(club.founded_date).getFullYear()}
                  </span>
                )}
                <span>{t("memberCount", { count: memberCount || 0 })}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Link
                  href={`/club/${slug}/manage`}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  {t("manage")}
                </Link>
              )}
            </div>
          </div>

          <nav className="mt-6 flex gap-6 border-t border-gray-100 pt-4">
            <Link
              href={`/club/${slug}`}
              className="text-sm font-medium text-gray-600 hover:text-green-600"
            >
              {t("about")}
            </Link>
            <Link
              href={`/club/${slug}/members`}
              className="text-sm font-medium text-gray-600 hover:text-green-600"
            >
              {t("members")}
            </Link>
            <Link
              href={`/club/${slug}/albums`}
              className="text-sm font-medium text-gray-600 hover:text-green-600"
            >
              {t("albums")}
            </Link>
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
