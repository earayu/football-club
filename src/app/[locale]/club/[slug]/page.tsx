import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { generateClubJsonLd } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

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

export default async function ClubHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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

  const { data: members } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", club.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(6);

  const { data: albums } = await supabase
    .from("albums")
    .select("*")
    .eq("club_id", club.id)
    .order("created_at", { ascending: false })
    .limit(4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateClubJsonLd(club)),
        }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section>
        <h2 className="text-lg font-semibold text-gray-900">{t("members")}</h2>
        {members && members.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
            {members.map((m: any) => (
              <div key={m.id} className="text-center">
                {m.profiles?.avatar_url ? (
                  <img
                    src={m.profiles.avatar_url}
                    alt={m.profiles.display_name}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-500">
                    👤
                  </div>
                )}
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {m.profiles?.display_name || "—"}
                </p>
                {m.position && (
                  <p className="text-xs text-gray-500">
                    {tm(`positions.${m.position}`)}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">{t("noMembers")}</p>
        )}
      </section>

      {albums && albums.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-gray-900">{t("albums")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {albums.map((album: any) => (
              <a
                key={album.id}
                href={`albums/${album.id}`}
                className="group overflow-hidden rounded-lg border border-gray-200"
              >
                {album.cover_url ? (
                  <img
                    src={album.cover_url}
                    alt={album.title}
                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center bg-gray-100 text-3xl text-gray-400">
                    📷
                  </div>
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900">
                    {album.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
    </>
  );
}
