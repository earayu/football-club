import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PhotoGrid } from "./photo-grid";
import { AlbumHeader } from "./album-header";

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const t = await getTranslations("album");

  const { data: album } = await supabase
    .from("albums")
    .select("*, photos(*, profiles(display_name))")
    .eq("id", id)
    .single();

  if (!album) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isMember = false;
  let isAdmin = false;

  if (user) {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (club) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("role, status")
        .eq("user_id", user.id)
        .eq("club_id", (club as any).id)
        .eq("status", "active")
        .single();
      isMember = !!membership;
      isAdmin = (membership as any)?.role === "admin";
    }
  }

  const a = album as any;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <AlbumHeader
          albumId={id}
          title={a.title}
          description={a.description}
          isAdmin={isAdmin}
        />
        {isMember && (
          <Link
            href={`/club/${slug}/albums/${id}/upload`}
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t("uploadPhotos")}
          </Link>
        )}
      </div>
      <div className="mt-6">
        <PhotoGrid photos={a.photos || []} />
      </div>
    </div>
  );
}
