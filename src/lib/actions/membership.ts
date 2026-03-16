"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export async function applyToJoin(clubId: string) {
  const supabase = await createClient();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: existing } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("club_id", clubId)
    .single();

  if (existing) {
    return { error: "Already applied or member" };
  }

  const { error } = await supabase.from("memberships").insert({
    user_id: user.id,
    club_id: clubId,
    role: "member",
    status: "pending",
  } as never);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function approveMembership(membershipId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("memberships")
    .update({ status: "active" } as never)
    .eq("id", membershipId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function rejectMembership(membershipId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function removeMember(membershipId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function leaveClub(membershipId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateMyMembership(
  membershipId: string,
  formData: FormData
) {
  const supabase = await createClient();

  const number = formData.get("number")
    ? parseInt(formData.get("number") as string)
    : null;
  const position = (formData.get("position") as string) || null;

  const { error } = await supabase
    .from("memberships")
    .update({ number, position } as never)
    .eq("id", membershipId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
