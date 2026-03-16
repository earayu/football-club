"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import type { Database } from "@/lib/types/database";

type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

export async function createClub(formData: FormData) {
  const supabase = await createClient();
  const locale = await getLocale();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const name = formData.get("name") as string;
  const slug = (formData.get("slug") as string) || slugify(name);
  const description = (formData.get("description") as string) || null;
  const foundedDate = (formData.get("foundedDate") as string) || null;

  const clubResult = await supabase
    .from("clubs")
    .insert({
      name,
      slug,
      description,
      founded_date: foundedDate,
    } as never)
    .select()
    .single();

  const club = clubResult.data as ClubRow | null;
  const clubError = clubResult.error;

  if (clubError) {
    if (clubError.code === "23505") {
      return { error: "This club URL is already taken. Please choose another." };
    }
    return { error: clubError.message };
  }
  if (!club) {
    return { error: "Failed to create club" };
  }

  const { error: memberError } = await supabase
    .from("memberships")
    .insert({
      user_id: user.id,
      club_id: club.id,
      role: "admin",
      status: "active",
    } as never);

  if (memberError) {
    return { error: memberError.message };
  }

  redirect({ href: `/club/${club.slug}`, locale });
}

export async function updateClub(clubId: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clubs")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      founded_date: (formData.get("foundedDate") as string) || null,
    } as never)
    .eq("id", clubId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function uploadBadge(clubId: string, formData: FormData) {
  const supabase = await createClient();

  const file = formData.get("badge") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `badges/${clubId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("clubs")
    .update({ badge_url: publicUrl } as never)
    .eq("id", clubId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, badgeUrl: publicUrl };
}
