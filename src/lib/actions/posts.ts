"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getNextBlockOrder(supabase: Awaited<ReturnType<typeof createClient>>, postId: string) {
  const { data } = await supabase
    .from("post_blocks")
    .select("sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();
  return ((data as any)?.sort_order ?? -1) + 1;
}

export async function createPost(
  clubId: string,
  data: { title?: string; location?: string; eventDate?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      club_id: clubId,
      title: data.title?.trim() || null,
      location: data.location?.trim() || null,
      event_date: data.eventDate || new Date().toISOString(),
      created_by: user.id,
    } as never)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/[locale]/club/[slug]", "page");
  return { post };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}

export async function togglePinPost(postId: string, isPinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ is_pinned: isPinned } as never)
    .eq("id", postId);
  if (error) return { error: error.message };
  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}

export async function appendTextBlock(postId: string, body: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const nextOrder = await getNextBlockOrder(supabase, postId);

  const { data: block, error: blockErr } = await supabase
    .from("post_blocks")
    .insert({ post_id: postId, author_id: user.id, type: "text", sort_order: nextOrder } as never)
    .select()
    .single();
  if (blockErr) return { error: blockErr.message };

  const { error } = await supabase.from("post_block_items").insert({
    block_id: (block as any).id,
    body: body.trim(),
    sort_order: 0,
  } as never);

  if (error) return { error: error.message };
  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}

export async function appendVideoBlock(postId: string, videoUrl: string, caption?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const nextOrder = await getNextBlockOrder(supabase, postId);

  const { data: block, error: blockErr } = await supabase
    .from("post_blocks")
    .insert({ post_id: postId, author_id: user.id, type: "video", sort_order: nextOrder } as never)
    .select()
    .single();
  if (blockErr) return { error: blockErr.message };

  const { error } = await supabase.from("post_block_items").insert({
    block_id: (block as any).id,
    video_url: videoUrl.trim(),
    video_caption: caption?.trim() || null,
    sort_order: 0,
  } as never);

  if (error) return { error: error.message };
  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}

export async function appendPhotosBlock(postId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: post } = await supabase.from("posts").select("club_id").eq("id", postId).single();
  if (!post) return { error: "Post not found" };

  const files = formData.getAll("photos") as File[];
  if (!files.length) return { error: "No photos provided" };

  const nextOrder = await getNextBlockOrder(supabase, postId);

  const { data: block, error: blockErr } = await supabase
    .from("post_blocks")
    .insert({ post_id: postId, author_id: user.id, type: "photos", sort_order: nextOrder } as never)
    .select()
    .single();
  if (blockErr) return { error: blockErr.message };

  const clubId = (post as any).club_id;
  const blockId = (block as any).id;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split(".").pop();
    const path = `posts/${clubId}/${postId}/${blockId}/${Date.now()}-${i}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
    if (uploadError) continue;

    const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
    await supabase.from("post_block_items").insert({
      block_id: blockId,
      url: publicUrl,
      sort_order: i,
    } as never);
  }

  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}

export async function deleteBlock(blockId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("post_blocks").delete().eq("id", blockId);
  if (error) return { error: error.message };
  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}
