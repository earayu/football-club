import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { InviteButton, MemberRow } from "./member-actions";

export default async function MembersPage({
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role, status")
      .eq("club_id", (club as any).id)
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .single();
    isAdmin = !!m;
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, profiles(*)")
    .eq("club_id", (club as any).id)
    .in("status", isAdmin ? ["active", "pending"] : ["active"])
    .order("joined_at", { ascending: true });

  const pending = (memberships ?? []).filter((m: any) => m.status === "pending");
  const active = (memberships ?? []).filter((m: any) => m.status === "active");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {isAdmin && (
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {pending.length} pending
              </span>
            )}
          </p>
          <InviteButton clubId={(club as any).id} />
        </div>
      )}

      <div className="space-y-2">
        {pending.map((m: any) => (
          <MemberRow key={m.id} membership={m} isAdmin={isAdmin} />
        ))}
        {active.map((m: any) => (
          <MemberRow key={m.id} membership={m} isAdmin={isAdmin} />
        ))}
        {active.length === 0 && pending.length === 0 && (
          <p className="py-12 text-center text-sm text-gray-400">No members yet.</p>
        )}
      </div>
    </div>
  );
}
