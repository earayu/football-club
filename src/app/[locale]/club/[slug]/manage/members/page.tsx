import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MemberManagement } from "./member-management";

export default async function ManageMembersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("manage");

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const clubId = (club as any).id;

  const { data: pending } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", clubId)
    .eq("status", "pending");

  const { data: active } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", clubId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  return (
    <div>
      <MemberManagement
        clubId={clubId}
        pending={pending || []}
        active={active || []}
      />
    </div>
  );
}
