"use server";

import { createClient } from "@/lib/supabase/server";

export async function createAlbum(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { data, error } = await supabase
    .from("albums")
    .insert({
      club_id: clubId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      created_by: user.id,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, album: data };
}

export async function deleteAlbum(albumId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("albums").delete().eq("id", albumId);
  if (error) return { error: error.message };
  return { success: true };
}
