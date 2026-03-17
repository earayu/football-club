/**
 * Client-side photo upload utility — uploads directly to Supabase Storage,
 * bypassing Server Actions and their body-size limits entirely.
 */
import { createClient } from "@/lib/supabase/client";

export const MAX_PHOTO_SIZE_MB = 20;
const MAX_BYTES = MAX_PHOTO_SIZE_MB * 1024 * 1024;

export type UploadResult = {
  urls: string[];
  sizeErrors: string[];   // files that exceeded the size limit
  uploadErrors: string[]; // files that failed during network upload
};

/**
 * Validate files before upload and return friendly error messages.
 * Returns { valid, oversized }.
 */
export function validatePhotoFiles(files: File[]): {
  valid: File[];
  sizeErrors: string[];
} {
  const valid: File[] = [];
  const sizeErrors: string[] = [];
  for (const f of files) {
    if (f.size > MAX_BYTES) {
      const mb = (f.size / 1024 / 1024).toFixed(1);
      sizeErrors.push(`「${f.name}」${mb}MB，超过 ${MAX_PHOTO_SIZE_MB}MB 限制`);
    } else {
      valid.push(f);
    }
  }
  return { valid, sizeErrors };
}

/**
 * Upload an array of image Files to Supabase Storage `media` bucket.
 * @param files   Validated File objects (check with validatePhotoFiles first)
 * @param basePath  Storage path prefix, e.g. "posts/{clubId}/{postId}"
 * @param onProgress  Optional progress callback (uploaded count, total)
 */
export async function uploadPhotosToStorage(
  files: File[],
  basePath: string,
  onProgress?: (done: number, total: number) => void
): Promise<UploadResult> {
  const supabase = createClient();
  const urls: string[] = [];
  const uploadErrors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    // Use a unique path to prevent collisions
    const path = `${basePath}/${Date.now()}-${i}.${ext}`;

    const { error } = await supabase.storage
      .from("media")
      .upload(path, file, { contentType: file.type || "image/jpeg" });

    if (error) {
      uploadErrors.push(`「${file.name}」上传失败：${error.message}`);
    } else {
      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
      urls.push(publicUrl);
    }

    onProgress?.(i + 1, files.length);
  }

  return { urls, sizeErrors: [], uploadErrors };
}
