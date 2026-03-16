import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { generateClubJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ClubInfoForm } from "./manage/info/club-info-form";
import { AlbumManager } from "./manage/albums/album-manager";
import { InviteButton, MemberRow } from "./members/member-actions";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

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

export default async function ClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { slug } = await params;
  const { edit } = await searchParams;
  const supabase = await createClient();
  const t = await getTranslations("club");
  const tm = await getTranslations("member");

  const { data } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  const club = data as ClubRow | null;
  if (!club) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("club_id", club.id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .single();
    isAdmin = !!m;
  }

  const isEditMode = isAdmin && edit === "1";

  // Fetch members
  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", club.id)
    .in("status", isAdmin ? ["active", "pending"] : ["active"])
    .order("joined_at", { ascending: true });

  const pending = (memberships ?? []).filter((m: any) => m.status === "pending");
  const activeMembers = (memberships ?? []).filter((m: any) => m.status === "active");

  // Fetch albums
  const { data: albumsRaw } = await supabase
    .from("albums")
    .select("id, title, description, cover_url, created_at, photos(id)")
    .eq("club_id", club.id)
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateClubJsonLd(club)),
        }}
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 space-y-10">

        {/* Edit mode banner */}
        {isEditMode && (
          <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <span className="text-sm font-medium text-green-700">Editing club</span>
            <Link
              href={`/club/${slug}`}
              className="text-sm font-medium text-green-700 hover:text-green-900"
            >
              ✕ Done editing
            </Link>
          </div>
        )}

        {/* Club info: view or edit */}
        {isEditMode ? (
          <section>
            <h2 className="mb-5 text-lg font-bold text-gray-900">Club Info</h2>
            <ClubInfoForm club={club} />
          </section>
        ) : (
          club.description && (
            <section>
              <p className="text-gray-600">{club.description}</p>
            </section>
          )
        )}

        {/* Members section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              {t("members")}
              {pending.length > 0 && isEditMode && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {pending.length} pending
                </span>
              )}
            </h2>
            {isEditMode && <InviteButton clubId={club.id} />}
          </div>

          {isEditMode ? (
            <div className="space-y-2">
              {pending.map((m: any) => (
                <MemberRow key={m.id} membership={m} isAdmin />
              ))}
              {activeMembers.map((m: any) => (
                <MemberRow key={m.id} membership={m} isAdmin />
              ))}
              {activeMembers.length === 0 && pending.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">{t("noMembers")}</p>
              )}
            </div>
          ) : (
            activeMembers.length > 0 ? (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                {activeMembers.map((m: any) => (
                  <div key={m.id} className="text-center">
                    {m.profiles?.avatar_url ? (
                      <img
                        src={m.profiles.avatar_url}
                        alt={m.profiles.display_name}
                        className="mx-auto h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">
                        👤
                      </div>
                    )}
                    <p className="mt-2 text-xs font-medium text-gray-700 truncate">
                      {m.profiles?.display_name || "—"}
                    </p>
                    {m.position && (
                      <p className="text-xs text-gray-400">
                        {tm(`positions.${m.position}`)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{t("noMembers")}</p>
            )
          )}
        </section>

        {/* Albums section */}
        <section>
          {isEditMode ? (
            <AlbumManager
              clubId={club.id}
              clubSlug={slug}
              albums={albums}
            />
          ) : (
            <>
              <h2 className="mb-4 text-lg font-bold text-gray-900">{t("albums")}</h2>
              {albums.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/club/${slug}/albums/${album.id}`}
                      className="group overflow-hidden rounded-xl border border-gray-100 transition-shadow hover:shadow-md"
                    >
                      {album.cover_url ? (
                        <img
                          src={album.cover_url}
                          alt={album.title}
                          className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex aspect-square items-center justify-center bg-gray-50 text-3xl text-gray-300">
                          📷
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {album.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {album.photoCount} photo{album.photoCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No albums yet.</p>
              )}
            </>
          )}
        </section>

      </div>
    </>
  );
}
