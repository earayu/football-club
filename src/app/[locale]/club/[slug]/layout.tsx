import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ClubTabs } from "./club-tabs";
import { Users, CalendarBlank, UserPlus, Gear } from "@phosphor-icons/react/dist/ssr";

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

  const { data } = await supabase.from("clubs").select("*").eq("slug", slug).single();
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
      .from("memberships").select("*")
      .eq("club_id", club.id).eq("user_id", user.id).single();
    userMembership = data as MembershipRow | null;
  }

  const isAdmin = userMembership?.role === "admin" && userMembership?.status === "active";
  const isMember = userMembership?.status === "active";
  const isPending = userMembership?.status === "pending";

  return (
    <div className="min-h-[100dvh] bg-[#f9fafb]">
      {/* Club header — editorial, minimal */}
      <div className="bg-white border-b border-slate-900/[0.06]">
        <div className="mx-auto max-w-3xl px-5 pt-8 pb-0 sm:px-8">

          <div className="flex items-start gap-5 pb-6">
            {/* Badge */}
            <div className="shrink-0 mt-0.5">
              {club.badge_url ? (
                <img
                  src={club.badge_url}
                  alt={club.name}
                  className="h-16 w-16 rounded-2xl object-cover shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-700 shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
                    <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5"/>
                    <path d="M12 4.5L14.5 8h-5L12 4.5zM12 19.5L9.5 16h5L12 19.5zM4.5 12L8 9.5v5L4.5 12zM19.5 12L16 14.5v-5L19.5 12z" fill="white" opacity=".7"/>
                    <circle cx="12" cy="12" r="2" fill="white" opacity=".9"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-[22px] font-black tracking-tight text-zinc-900 leading-tight">
                    {club.name}
                  </h1>
                  {club.description && (
                    <p className="mt-1 text-sm text-zinc-500 leading-relaxed line-clamp-2">
                      {club.description}
                    </p>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0 flex items-center gap-2">
                  {!user && (
                    <Link
                      href="/register"
                      className="flex items-center gap-1.5 rounded-xl bg-green-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-green-900/20 transition hover:bg-green-800 active:scale-[0.98]"
                    >
                      <UserPlus size={14} weight="bold" />
                      {t("joinClub")}
                    </Link>
                  )}
                  {isMember && !isAdmin && (
                    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      成员
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                      待审核
                    </span>
                  )}
                  {isAdmin && (
                    <Link
                      href={`/club/${slug}/manage/info`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-zinc-400 transition hover:border-zinc-300 hover:text-zinc-600"
                      title="管理俱乐部"
                    >
                      <Gear size={15} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Meta row */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Users size={12} className="text-zinc-300" />
                  {memberCount ?? 0} 名成员
                </span>
                {club.founded_date && (
                  <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <CalendarBlank size={12} className="text-zinc-300" />
                    创立于 {new Date(club.founded_date).getFullYear()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <ClubTabs slug={slug} />
        </div>
      </div>

      {/* Page content */}
      {children}
    </div>
  );
}
