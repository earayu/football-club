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
      <div className="relative overflow-hidden border-b border-[rgba(0,0,0,0.04)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,255,255,0.84))]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_26%)]" />
        <div className="mx-auto max-w-[88rem] px-4 pt-8 pb-0 sm:px-6 lg:px-8 lg:pt-10">
          <div className="bezel-outer rounded-[2.15rem]">
            <div className="bezel-inner rounded-[calc(2.15rem-3px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(250,251,250,0.92))] px-5 pt-6 pb-0 sm:px-7 sm:pt-7">
              <div className="flex flex-col gap-6 pb-6 lg:flex-row lg:items-start lg:justify-between">

                <div className="flex min-w-0 flex-1 items-start gap-5">
                  <div className="shrink-0 mt-0.5">
                    <div className="bezel-outer rounded-[1.75rem]">
                      <div className="bezel-inner h-[78px] w-[78px] rounded-[calc(1.75rem-3px)]">
                        {club.badge_url ? (
                          <img
                            src={club.badge_url}
                            alt={club.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-green-700">
                            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
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

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      Football Club
                    </div>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 max-w-3xl">
                        <h1 className="text-[28px] font-black leading-[0.95] tracking-[-0.05em] text-zinc-950 sm:text-[38px]">
                          {club.name}
                        </h1>
                        {club.description && (
                          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-zinc-500 sm:text-[15px]">
                            {club.description}
                          </p>
                        )}
                        <div className="mt-5 flex flex-wrap items-center gap-4">
                          <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100">
                              <Users size={10} className="text-zinc-600" />
                            </span>
                            {memberCount ?? 0} 名成员
                          </span>
                          {club.founded_date && (
                            <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100">
                                <CalendarBlank size={10} className="text-zinc-600" />
                              </span>
                              {new Date(club.founded_date).getFullYear()} 年创立
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {isAdmin ? "Admin View" : isMember ? "Member View" : isPending ? "Pending" : "Public View"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 mt-0.5">
                        {!user && (
                          <Link
                            href="/register"
                            className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-green-700 pl-4 pr-1.5 py-1.5 text-[13px] font-semibold text-white shadow-[0_2px_10px_rgba(21,128,61,0.28)] transition-all duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_4px_20px_rgba(21,128,61,0.38)] active:scale-[0.97]"
                          >
                            <UserPlus size={13} weight="bold" />
                            {t("joinClub")}
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:scale-110 group-hover:translate-x-0.5">
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
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(0,0,0,0.07)] bg-zinc-50 text-zinc-400 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-zinc-300 hover:bg-white hover:text-zinc-600 hover:shadow-sm"
                            title="管理俱乐部"
                          >
                            <Gear size={15} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <ClubTabs slug={slug} />
            </div>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}
