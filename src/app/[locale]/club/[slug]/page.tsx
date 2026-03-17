import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { generateClubJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostCard, type PostData } from "@/components/posts/post-card";
import { NewPostForm } from "@/components/posts/new-post-form";

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

    const { data: p } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single();
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

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        {/* Compose box */}
        {isMember && (
          <div className="mb-6">
            <NewPostForm
              clubId={clubId}
              userAvatarUrl={profile?.avatar_url}
              userInitial={
                (profile?.display_name || user?.email || "?")[0].toUpperCase()
              }
            />
          </div>
        )}

        {/* Feed */}
        {posts.length > 0 ? (
          <div className="space-y-5">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id ?? null}
                isAdmin={isAdmin}
                clubSlug={slug}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-100 to-green-200 text-4xl shadow-inner">
              ⚽
            </div>
            <h3 className="mt-5 text-lg font-semibold text-gray-800">还没有任何动态</h3>
            {isMember ? (
              <p className="mt-2 text-sm text-gray-400">
                发一条手记，记录你们的故事 👆
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                加入俱乐部后即可发布手记
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
