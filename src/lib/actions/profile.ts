"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: formData.get("displayName") as string,
      bio: (formData.get("bio") as string) || null,
    } as never)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateAvatar(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) {
    return { error: "No file provided" };
  }

  const fileExt = file.name.split(".").pop();
  const filePath = `avatars/${user.id}.${fileExt}`;

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
    .from("profiles")
    .update({ avatar_url: publicUrl } as never)
    .eq("id", user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true, avatarUrl: publicUrl };
}
