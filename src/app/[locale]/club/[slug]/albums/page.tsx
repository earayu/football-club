import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AlbumManager } from "../manage/albums/album-manager";
import { Link } from "@/i18n/navigation";

export default async function AlbumsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("album");

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role")
      .eq("club_id", (club as any).id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .single();
    isAdmin = !!m;
  }

  const { data: albumsRaw } = await supabase
    .from("albums")
    .select("id, title, description, cover_url, created_at, photos(id)")
    .eq("club_id", (club as any).id)
    .order("created_at", { ascending: false });

  const albums = (albumsRaw ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    cover_url: a.cover_url,
    created_at: a.created_at,
    photoCount: a.photos?.length ?? 0,
  }));

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <AlbumManager
          clubId={(club as any).id}
          clubSlug={slug}
          albums={albums}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {albums.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          <p className="text-4xl">📷</p>
          <p className="mt-3">{t("noAlbums")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/club/${slug}/albums/${album.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 transition-shadow hover:shadow-md"
            >
              {album.cover_url ? (
                <img
                  src={album.cover_url}
                  alt={album.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gray-50 text-5xl text-gray-300">
                  📷
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{album.title}</h3>
                {album.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {album.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
