import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AlbumsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const supabase = await createClient();
  const t = await getTranslations("album");

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data: albums } = await supabase
    .from("albums")
    .select("*, photos(url)")
    .eq("club_id", (club as any).id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {albums && albums.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {(albums as any[]).map((album) => (
            <Link
              key={album.id}
              href={`/club/${slug}/albums/${album.id}`}
              className="group overflow-hidden rounded-lg border border-gray-200 transition-shadow hover:shadow-md"
            >
              {album.cover_url || album.photos?.[0]?.url ? (
                <img
                  src={album.cover_url || album.photos[0].url}
                  alt={album.title}
                  className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-video items-center justify-center bg-gray-100 text-4xl text-gray-400">
                  📷
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-gray-900">{album.title}</h3>
                {album.description && (
                  <p className="mt-1 text-sm text-gray-500">{album.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {album.photos?.length || 0} photos
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t("noAlbums")}</p>
      )}
    </div>
  );
}
