"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadPhotos(albumId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const files = formData.getAll("photos") as File[];
  if (!files.length) return { error: "No files provided" };

  const { data: album } = await supabase
    .from("albums")
    .select("club_id")
    .eq("id", albumId)
    .single();

  if (!album) return { error: "Album not found" };

  const results = [];

  for (const file of files) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `photos/${(album as any).club_id}/${albumId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(filePath, file);

    if (uploadError) {
      results.push({ error: uploadError.message, file: file.name });
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(filePath);

    const { error: insertError } = await supabase.from("photos").insert({
      album_id: albumId,
      url: publicUrl,
      uploaded_by: user.id,
    } as never);

    if (insertError) {
      results.push({ error: insertError.message, file: file.name });
    } else {
      results.push({ success: true, file: file.name });
    }
  }

  return { results };
}

export async function deletePhoto(photoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) return { error: error.message };
  return { success: true };
}
