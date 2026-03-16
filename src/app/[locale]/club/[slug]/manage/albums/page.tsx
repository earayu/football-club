import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AlbumManager } from "./album-manager";

export default async function ManageAlbumsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

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

  return (
    <AlbumManager
      clubId={(club as any).id}
      clubSlug={slug}
      albums={albums}
    />
  );
}
