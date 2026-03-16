import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

export default async function MembersPage({
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
    .select("id")
    .eq("slug", slug)
    .single();

  const club = data as Pick<ClubRow, "id"> | null;
  if (!club) notFound();

  const { data: members } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", club.id)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h2 className="text-lg font-semibold text-gray-900">{t("members")}</h2>
      {members && members.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {members.map((m: any) => (
            <div
              key={m.id}
              className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
            >
              {m.profiles?.avatar_url ? (
                <img
                  src={m.profiles.avatar_url}
                  alt={m.profiles.display_name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-500">
                  👤
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">
                  {m.profiles?.display_name || "—"}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  {m.number && <span>#{m.number}</span>}
                  {m.position && <span>{tm(`positions.${m.position}`)}</span>}
                  {m.role === "admin" && (
                    <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">{t("noMembers")}</p>
      )}
    </div>
  );
}
