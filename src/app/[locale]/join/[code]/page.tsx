import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JoinButton } from "./join-button";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];
type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

type InvitationWithClub = InvitationRow & { clubs: ClubRow | null };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const locale = await getLocale();
  const t = await getTranslations("invitation");

  const { data } = await supabase
    .from("invitations")
    .select("*, clubs(*)")
    .eq("code", code)
    .single();

  const invitation = data as InvitationWithClub | null;

  if (!invitation) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">{t("invalidCode")}</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-green-600 hover:text-green-700"
          >
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const club = invitation.clubs;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let alreadyMember = false;
  if (user) {
    const { data } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", user.id)
      .eq("club_id", invitation.club_id)
      .eq("status", "active")
      .single();
    alreadyMember = !!data;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {club?.badge_url ? (
          <img
            src={club.badge_url}
            alt={club.name}
            className="mx-auto h-24 w-24 rounded-full object-cover shadow-md"
          />
        ) : (
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-4xl shadow-md">
            ⚽
          </div>
        )}
        <h1 className="mt-6 text-xl font-bold text-gray-900">
          {t("joinViaInvite")}
        </h1>
        <p className="mt-2 text-2xl font-bold text-green-600">{club?.name}</p>

        {alreadyMember ? (
          <div className="mt-6">
            <p className="text-sm text-gray-500">{t("alreadyMember")}</p>
            <Link
              href={`/club/${club?.slug}`}
              className="mt-4 inline-block rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Visit Club
            </Link>
          </div>
        ) : user ? (
          <div className="mt-6">
            <JoinButton code={code} />
          </div>
        ) : (
          <div className="mt-6">
            <Link
              href={`/register`}
              className="inline-block rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Sign up to join
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
