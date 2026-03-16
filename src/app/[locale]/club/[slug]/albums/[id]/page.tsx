import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PhotoGrid } from "./photo-grid";

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const locale = await getLocale();
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
  if (user) {
    const { data: club } = await supabase
      .from("clubs")
      .select("id")
      .eq("slug", slug)
      .single();

    if (club) {
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("club_id", (club as any).id)
        .eq("status", "active")
        .single();
      isMember = !!membership;
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">{(album as any).title}</h2>
        {isMember && (
          <Link
            href={`/club/${slug}/albums/${id}/upload`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            {t("uploadPhotos")}
          </Link>
        )}
      </div>
      {(album as any).description && (
        <p className="mt-2 text-sm text-gray-600">{(album as any).description}</p>
      )}
      <div className="mt-6">
        <PhotoGrid photos={(album as any).photos || []} />
      </div>
    </div>
  );
}
