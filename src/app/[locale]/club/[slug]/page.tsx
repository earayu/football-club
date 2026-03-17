import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { generateClubJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Globe,
  ImageSquare,
  NotePencil,
  Sparkle,
  UsersThree,
  VideoCamera,
} from "@phosphor-icons/react/dist/ssr";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { PostComposer } from "@/components/posts/post-composer";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
type ProfileSummary = Pick<Database["public"]["Tables"]["profiles"]["Row"], "display_name" | "avatar_url">;
type MembershipSummary = Pick<Database["public"]["Tables"]["memberships"]["Row"], "role" | "status">;

const POST_FEED_SELECT = `
  id,
  title,
  location,
  event_date,
  is_pinned,
  created_by,
  created_at,
  updated_at,
  profiles:profiles!posts_created_by_fkey(
    display_name,
    avatar_url
  ),
  post_entries(
    id,
    post_id,
    author_id,
    sort_order,
    created_at,
    content,
    profiles:profiles!post_entries_author_id_fkey(
      display_name,
      avatar_url
    )
  )
`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase.from("clubs").select("*").eq("slug", slug).single();
  if (!club) return { title: "Club Not Found" };
  const row = club as ClubRow;
  return {
    title: `${row.name} | Football Club Portal`,
    description: row.description || `${row.name} on Football Club Portal`,
    openGraph: {
      title: row.name,
      description: row.description || undefined,
      images: row.badge_url ? [{ url: row.badge_url }] : [],
    },
  };
}

export default async function ClubPostsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();
  if (!club) notFound();
  const clubId = (club as Pick<ClubRow, "id">).id;

  const { data: { user } } = await supabase.auth.getUser();

  let isMember = false;
  let isAdmin = false;
  let profile: ProfileSummary | null = null;

  if (user) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    isMember = !!m;
    isAdmin = (m as MembershipSummary | null)?.role === "admin";

    const { data: p } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = p as ProfileSummary | null;
  }

  const { data: postsRaw, error: postsError } = await supabase
    .from("posts")
    .select(POST_FEED_SELECT)
    .eq("club_id", clubId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const posts = (postsRaw ?? []) as unknown as PostData[];
  if (postsError) {
    console.error("[club feed query]", postsError.message);
  }

  const clubRaw = await supabase.from("clubs").select("*").eq("id", clubId).single();
  const clubData = clubRaw.data as ClubRow | null;

  return (
    <>
      {clubData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateClubJsonLd(clubData)) }}
        />
      )}

      <div className="relative mx-auto max-w-[88rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(21,128,61,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0))]" />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_21rem] xl:gap-10">
          <main className="min-w-0">
            <section className="animate-fade-up stagger-1 mb-8">
              <div className="bezel-outer rounded-[2rem]">
                <div className="bezel-inner rounded-[calc(2rem-3px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.9))] px-5 py-5 sm:px-7 sm:py-7">
                  <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="mb-3 inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">
                        Club Feed
                      </div>
                      <h2 className="max-w-2xl text-[28px] font-black leading-[1.05] tracking-[-0.04em] text-zinc-950 sm:text-[38px]">
                        让每次训练、比赛和临场瞬间，都像在 Notion 里写一条有质感的社交动态。
                      </h2>
                      <p className="mt-4 max-w-2xl text-[14px] leading-7 text-zinc-500 sm:text-[15px]">
                        现在支持拖入图片与视频、粘贴截图、直接贴媒体或网页链接自动展开。发布入口和补充入口也已经统一成同一套编辑体验。
                      </p>
                    </div>

                    <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[24rem]">
                      {[
                        { label: "当前手记", value: String(posts.length).padStart(2, "0") },
                        { label: "俱乐部成员", value: isMember ? "已加入" : "公开可见" },
                        { label: "内容模型", value: "统一块编辑" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-[1.35rem] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)]"
                        >
                          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                            {item.label}
                          </div>
                          <div className="mt-2 text-[14px] font-semibold text-zinc-900">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {isMember ? (
                    <PostComposer
                      mode="create"
                      clubId={clubId}
                      initialOpen
                      userAvatarUrl={profile?.avatar_url}
                      userInitial={(profile?.display_name || user?.email || "?")[0].toUpperCase()}
                    />
                  ) : (
                    <div className="rounded-[1.65rem] border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center">
                      <p className="text-[18px] font-semibold tracking-[-0.02em] text-zinc-900">还不能发布手记</p>
                      <p className="mx-auto mt-2 max-w-md text-[14px] leading-7 text-zinc-500">
                        页面现在会公开展示动态，但只有俱乐部成员能发布、补充和管理内容。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {postsError ? (
              <section className="animate-fade-up stagger-2 mb-8">
                <div className="rounded-[2rem] border border-red-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(254,242,242,0.96))] px-6 py-5 shadow-[0_20px_50px_-30px_rgba(220,38,38,0.24)]">
                  <div className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-600">
                    Feed Error
                  </div>
                  <p className="mt-4 text-[18px] font-semibold tracking-[-0.02em] text-zinc-950">
                    动态内容加载失败
                  </p>
                  <p className="mt-2 text-[14px] leading-7 text-zinc-500">
                    这次不是没有内容，而是查询没有成功返回结果。当前错误：
                    {" "}
                    <span className="font-medium text-red-600">{postsError.message}</span>
                  </p>
                </div>
              </section>
            ) : null}

            {posts.length > 0 ? (
              <section className="space-y-5">
                {posts.map((post, i) => (
                  <div
                    key={post.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${(i + 2) * 70}ms` }}
                  >
                    <PostCard
                      post={post}
                      currentUserId={user?.id ?? null}
                      isAdmin={isAdmin}
                      clubId={clubId}
                      currentUserAvatarUrl={profile?.avatar_url}
                      currentUserInitial={(profile?.display_name || user?.email || "?")[0].toUpperCase()}
                    />
                  </div>
                ))}
              </section>
            ) : !postsError ? (
              <section className="animate-fade-up stagger-2">
                <div className="bezel-outer rounded-[2rem]">
                  <div className="bezel-inner rounded-[calc(2rem-3px)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,247,245,0.92))] px-6 py-16 sm:px-10 sm:py-20">
                    <div className="mx-auto max-w-xl text-center">
                      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.95),rgba(220,252,231,0.95))] shadow-[0_25px_60px_-28px_rgba(21,128,61,0.35)] ring-1 ring-emerald-200/80">
                        <Sparkle size={24} className="text-emerald-700" />
                      </div>
                      <h3 className="text-[28px] font-black tracking-[-0.04em] text-zinc-950">
                        这里还没有任何手记
                      </h3>
                      <p className="mt-4 text-[14px] leading-7 text-zinc-500 sm:text-[15px]">
                        {isMember
                          ? "把编辑器当成一个 Notion 风格的动态输入区：写字、拖图、贴视频、贴网页链接，都可以直接开始。"
                          : "动态页已经准备好了。加入俱乐部后，成员就可以像社交产品一样持续补充内容。"}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            <div className="h-14" />
          </main>

          <aside className="hidden xl:block">
            <div className="sticky top-8 space-y-4">
              <div className="bezel-outer rounded-[1.85rem]">
                <div className="bezel-inner rounded-[calc(1.85rem-3px)] bg-white/92 px-5 py-5">
                  <div className="mb-3 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Publishing Flow
                  </div>
                  <p className="text-[20px] font-black tracking-[-0.03em] text-zinc-950">
                    更像内容社区，而不是表单。
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      { icon: NotePencil, title: "统一发布与补充", body: "顶部发布和帖子补充现在走同一套块编辑模型。" },
                      { icon: ImageSquare, title: "拖拽与粘贴媒体", body: "本地图片、截图、图片 URL 都可以直接进入编辑器。" },
                      { icon: VideoCamera, title: "视频与网页链接", body: "视频链接会识别为媒体块，普通网页会展开成链接卡片。" },
                      { icon: Globe, title: "更稳定的查询", body: "动态列表查询改成显式关系查询，并且不再静默吞错。" },
                    ].map(({ icon: Icon, title, body }) => (
                      <div key={title} className="rounded-[1.2rem] bg-zinc-50/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.35)] ring-1 ring-zinc-200/80">
                            <Icon size={18} className="text-zinc-700" />
                          </div>
                          <div>
                            <p className="text-[13px] font-semibold text-zinc-900">{title}</p>
                            <p className="mt-1 text-[12px] leading-6 text-zinc-500">{body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bezel-outer rounded-[1.85rem]">
                <div className="bezel-inner rounded-[calc(1.85rem-3px)] bg-[linear-gradient(180deg,rgba(236,253,245,0.88),rgba(255,255,255,0.96))] px-5 py-5">
                  <div className="mb-3 inline-flex items-center rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
                    Creator Notes
                  </div>
                  <p className="text-[18px] font-black tracking-[-0.03em] text-zinc-950">
                    动态区建议这样用
                  </p>
                  <ul className="mt-4 space-y-3 text-[13px] leading-7 text-zinc-600">
                    <li className="flex gap-2"><UsersThree size={16} className="mt-1 shrink-0 text-emerald-700" /> 发帖写“事件”，补充写“过程”，整个帖子就会越来越像时间线。</li>
                    <li className="flex gap-2"><Sparkle size={16} className="mt-1 shrink-0 text-emerald-700" /> 一段话后直接贴图或视频链接，系统会尽量识别成结构化内容，而不是一团原始文本。</li>
                    <li className="flex gap-2"><NotePencil size={16} className="mt-1 shrink-0 text-emerald-700" /> 编辑区现在更大，更适合写比赛复盘、训练记录和现场补充。</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
