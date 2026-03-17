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
    <div className="min-h-[100dvh]" style={{ background: "var(--bg)" }}>
      {/* ── Club Header ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-3xl px-5 pt-7 pb-0 sm:px-8">
          <div className="flex items-start gap-5 pb-5">

            {/* Double-Bezel Badge */}
            <div className="shrink-0 mt-0.5">
              <div className="bezel-outer">
                <div className="bezel-inner h-[64px] w-[64px]">
                  {club.badge_url ? (
                    <img
                      src={club.badge_url}
                      alt={club.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-green-700">
                      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                        <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5"/>
                        <path
                          d="M12 4.5L14.5 8h-5L12 4.5zM12 19.5L9.5 16h5L12 19.5zM4.5 12L8 9.5v5L4.5 12zM19.5 12L16 14.5v-5L19.5 12z"
                          fill="white" opacity=".7"
                        />
                        <circle cx="12" cy="12" r="2" fill="white" opacity=".9"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Club info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {/* Eyebrow tag */}
                  <div className="mb-1.5 inline-flex items-center rounded-full border border-green-200/80 bg-green-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-green-700">
                    Football Club
                  </div>
                  <h1 className="text-[22px] font-black tracking-tight text-zinc-900 leading-tight">
                    {club.name}
                  </h1>
                  {club.description && (
                    <p className="mt-1 text-[13px] text-zinc-500 leading-relaxed line-clamp-2">
                      {club.description}
                    </p>
                  )}
                </div>

                {/* Action button */}
                <div className="shrink-0 flex items-center gap-2 mt-0.5">
                  {!user && (
                    <Link
                      href="/register"
                      className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-green-700 pl-4 pr-1.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(21,128,61,0.28)] transition-all duration-[350ms] cubic-bezier(0.32,0.72,0,1) hover:shadow-[0_4px_20px_rgba(21,128,61,0.38)] active:scale-[0.97]"
                    >
                      <UserPlus size={13} weight="bold" />
                      {t("joinClub")}
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:scale-110">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 12 12">
                          <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </Link>
                  )}
                  {isMember && !isAdmin && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      成员
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                      待审核
                    </span>
                  )}
                  {isAdmin && (
                    <Link
                      href={`/club/${slug}/manage/info`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(0,0,0,0.07)] bg-zinc-50 text-zinc-400 transition-all duration-200 hover:border-zinc-300 hover:bg-white hover:text-zinc-600 hover:shadow-sm"
                      title="管理俱乐部"
                    >
                      <Gear size={14} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Meta stats row */}
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100">
                    <Users size={9} className="text-zinc-500" />
                  </span>
                  {memberCount ?? 0} 名成员
                </span>
                {club.founded_date && (
                  <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100">
                      <CalendarBlank size={9} className="text-zinc-500" />
                    </span>
                    {new Date(club.founded_date).getFullYear()} 年创立
                  </span>
                )}
              </div>
            </div>
          </div>

          <ClubTabs slug={slug} />
        </div>
      </div>

      {children}
    </div>
  );
}
