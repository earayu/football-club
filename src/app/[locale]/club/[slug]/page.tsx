import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { generateClubJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { BlockEditor } from "@/components/posts/block-editor";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

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
  const clubId = (club as any).id;

  const { data: { user } } = await supabase.auth.getUser();

  let isMember = false;
  let isAdmin = false;
  let profile: any = null;

  if (user) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();
    isMember = !!m;
    isAdmin = (m as any)?.role === "admin";

    const { data: p } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single();
    profile = p;
  }

  const { data: postsRaw } = await supabase
    .from("posts")
    .select(`
      id, title, location, event_date, is_pinned, created_by, created_at,
      profiles(display_name, avatar_url),
      post_blocks(
        id, type, author_id, sort_order, created_at,
        profiles(display_name, avatar_url),
        post_block_items(id, body, url, video_url, video_caption, sort_order)
      )
    `)
    .eq("club_id", clubId)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const posts = (postsRaw ?? []) as unknown as PostData[];

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

      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">

        {/* Compose box */}
        {isMember && (
          <div className="mb-5 animate-fade-up stagger-1">
            <BlockEditor
              clubId={clubId}
              userAvatarUrl={profile?.avatar_url}
              userInitial={(profile?.display_name || user?.email || "?")[0].toUpperCase()}
            />
          </div>
        )}

        {/* Feed */}
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, i) => (
              <div
                key={post.id}
                className="animate-fade-up"
                style={{ animationDelay: `${(i + (isMember ? 2 : 1)) * 60}ms` }}
              >
                <PostCard
                  post={post}
                  currentUserId={user?.id ?? null}
                  isAdmin={isAdmin}
                  clubSlug={slug}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="animate-fade-up stagger-2 flex flex-col items-center justify-center rounded-[1.25rem] border border-dashed border-[rgba(0,0,0,0.07)] py-20 text-center"
            style={{ background: "rgba(255,255,255,0.6)" }}
          >
            {/* Double-bezel football icon */}
            <div className="bezel-outer mb-5">
              <div className="bezel-inner flex h-14 w-14 items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
                <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
                  <circle cx="12" cy="12" r="9.5" stroke="#15803d" strokeWidth="1.5"/>
                  <path
                    d="M12 4.5L14.5 8h-5L12 4.5zM12 19.5L9.5 16h5L12 19.5zM4.5 12L8 9.5v5L4.5 12zM19.5 12L16 14.5v-5L19.5 12z"
                    fill="#15803d" opacity=".4"
                  />
                  <circle cx="12" cy="12" r="2" fill="#15803d" opacity=".7"/>
                </svg>
              </div>
            </div>
            <p className="text-[15px] font-semibold text-zinc-700">还没有任何手记</p>
            {isMember ? (
              <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-zinc-400">
                点击上方的输入框，记录今天的故事
              </p>
            ) : (
              <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-zinc-400">
                加入俱乐部后即可发布手记
              </p>
            )}
          </div>
        )}

        {/* Bottom padding for mobile comfort */}
        <div className="h-12" />
      </div>
    </>
  );
}
