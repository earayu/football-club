import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ClubTabs } from "./club-tabs";

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

  const { data: { user } } = await supabase.auth.getUser();

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
  const isMember = userMembership?.status === "active";

  return (
    <div>
      {/* Club header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6">
          <div className="flex items-start gap-5">
            {/* Badge */}
            <div className="shrink-0">
              {club.badge_url ? (
                <img
                  src={club.badge_url}
                  alt={club.name}
                  className="h-[72px] w-[72px] rounded-2xl object-cover shadow-md ring-1 ring-black/5"
                />
              ) : (
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-700 shadow-md shadow-green-200">
                  <svg viewBox="0 0 24 24" className="h-9 w-9" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="1.5"/>
                    <path d="M12 5l2 3h-4l2-3zM12 19l-2-3h4l-2 3zM5 12l3-2v4L5 12zM19 12l-3 2v-4l3 2z" fill="white" opacity="0.8"/>
                    <circle cx="12" cy="12" r="2" fill="white"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">{club.name}</h1>
              {club.description && (
                <p className="mt-1 line-clamp-1 text-sm text-gray-500">{club.description}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {club.founded_date && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                    </svg>
                    {t("founded")} {new Date(club.founded_date).getFullYear()}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  {t("memberCount", { count: memberCount || 0 })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              {!user && (
                <Link
                  href="/register"
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700"
                >
                  {t("joinClub")}
                </Link>
              )}
              {isMember && !isAdmin && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-100">
                  <svg className="h-3 w-3 fill-green-500" viewBox="0 0 12 12">
                    <circle cx="6" cy="6" r="6"/>
                  </svg>
                  Member
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <ClubTabs slug={slug} />
      {children}
    </div>
  );
}
