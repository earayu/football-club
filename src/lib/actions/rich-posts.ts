"use server";

import { revalidatePath } from "next/cache";
import { validateCreatePostPayload, validateEntryPayload } from "@/lib/actions/post-payloads";
import type { PostEntryDocument } from "@/lib/posts/document";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type PostInsert = Database["public"]["Tables"]["posts"]["Insert"];
type PostEntryContent = Database["public"]["Tables"]["post_entries"]["Row"]["content"];
type PostEntryInsert = Database["public"]["Tables"]["post_entries"]["Insert"];

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请求失败";
}

async function getNextEntryOrder(supabase: SupabaseClient, postId: string) {
  const { data, error } = await supabase
    .from("post_entries")
    .select("sort_order")
    .eq("post_id", postId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const row = data as Pick<Database["public"]["Tables"]["post_entries"]["Row"], "sort_order"> | null;
  return (row?.sort_order ?? -1) + 1;
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
  const updateValues: Database["public"]["Tables"]["posts"]["Update"] = {
    is_pinned: isPinned,
  };
  const { error } = await supabase
    .from("posts")
    .update(updateValues as never)
    .eq("id", postId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}

export async function createRichPost(
  clubId: string,
  input: {
    title?: string | null;
    location?: string | null;
    eventDate?: string | null;
    content: PostEntryDocument;
  }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const payload = validateCreatePostPayload(input);

    const postValues: PostInsert = {
      club_id: clubId,
      title: payload.title,
      location: payload.location,
      event_date: payload.eventDate,
      created_by: user.id,
    };

    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert(postValues as never)
      .select()
      .single();

    const createdPost = post as Database["public"]["Tables"]["posts"]["Row"] | null;

    if (postError || !createdPost) {
      return { error: postError?.message ?? "创建手记失败" };
    }

    const entryValues: PostEntryInsert = {
      post_id: createdPost.id,
      author_id: user.id,
      sort_order: 0,
      content: payload.content as PostEntryContent,
    };

    const { error: entryError } = await supabase.from("post_entries").insert(entryValues as never);

    if (entryError) {
      await supabase.from("posts").delete().eq("id", createdPost.id);
      return { error: entryError.message };
    }

    revalidatePath("/[locale]/club/[slug]", "page");
    return { post: createdPost };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function appendPostEntry(postId: string, content: PostEntryDocument) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  try {
    const payload = validateEntryPayload(content);
    const sortOrder = await getNextEntryOrder(supabase, postId);

    const entryValues: PostEntryInsert = {
      post_id: postId,
      author_id: user.id,
      sort_order: sortOrder,
      content: payload as PostEntryContent,
    };

    const { error } = await supabase.from("post_entries").insert(entryValues as never);

    if (error) return { error: error.message };

    revalidatePath("/[locale]/club/[slug]", "page");
    return { success: true };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function deletePostEntry(entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("post_entries").delete().eq("id", entryId);

  if (error) return { error: error.message };

  revalidatePath("/[locale]/club/[slug]", "page");
  return { success: true };
}
