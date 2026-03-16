"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAlbum(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;

  if (!title?.trim()) return { error: "Album title is required" };

  const { data, error } = await supabase
    .from("albums")
    .insert({
      club_id: clubId,
      title: title.trim(),
      description,
      created_by: user.id,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/club/[slug]/manage/albums`, "page");
  return { album: data };
}

export async function setCoverPhoto(albumId: string, photoUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("albums")
    .update({ cover_url: photoUrl } as never)
    .eq("id", albumId);

  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]/albums/[id]`, "page");
  return { success: true };
}

export async function updateAlbum(albumId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string) || null;
  if (!title) return { error: "Title is required" };

  const { error } = await supabase
    .from("albums")
    .update({ title, description } as never)
    .eq("id", albumId);

  if (error) return { error: error.message };
  revalidatePath(`/[locale]/club/[slug]/albums/[id]`, "page");
  return { success: true };
}

export async function deleteAlbum(albumId: string, clubSlug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("albums")
    .delete()
    .eq("id", albumId);

  if (error) return { error: error.message };

  revalidatePath(`/[locale]/club/[slug]/manage/albums`, "page");
  return { success: true };
}
