"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

type InvitationRow = Database["public"]["Tables"]["invitations"]["Row"];

function generateCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function generateInviteLink(clubId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const code = generateCode();

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      club_id: clubId,
      code,
      created_by: user.id,
    } as never)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { success: true, code: (data as any).code };
}

export async function joinViaInvite(code: string) {
  const supabase = await createClient();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data } = await supabase
    .from("invitations")
    .select("*")
    .eq("code", code)
    .single();

  const rawInvitation = data;
  if (!rawInvitation) {
    return { error: "Invalid invite code" };
  }
  const invitation = rawInvitation as InvitationRow;

  if (
    invitation.expires_at &&
    new Date(invitation.expires_at) < new Date()
  ) {
    return { error: "Invite link expired" };
  }

  if (
    invitation.max_uses &&
    invitation.use_count >= invitation.max_uses
  ) {
    return { error: "Invite link has reached max uses" };
  }

  const { data: existingData } = await supabase
    .from("memberships")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("club_id", invitation.club_id)
    .single();

  const existing = existingData as { id: string; status: string } | null;
  if (existing?.status === "active") {
    return { error: "Already a member" };
  }

  if (existing?.status === "pending") {
    await supabase
      .from("memberships")
      .update({ status: "active" } as never)
      .eq("id", existing.id);
  } else {
    const { error } = await supabase.from("memberships").insert({
      user_id: user.id,
      club_id: invitation.club_id,
      role: "member",
      status: "active",
    } as never);

    if (error) {
      return { error: error.message };
    }
  }

  await supabase
    .from("invitations")
    .update({ use_count: invitation.use_count + 1 } as never)
    .eq("id", invitation.id);

  const { data: clubData } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", invitation.club_id)
    .single();

  const club = clubData as { slug: string } | null;
  redirect({ href: `/club/${club?.slug || ""}`, locale });
}
