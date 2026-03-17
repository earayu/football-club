/**
 * Client-side photo upload utility — uploads directly to Supabase Storage,
 * bypassing Server Actions and their body-size limits entirely.
 */
import { createClient } from "@/lib/supabase/client";

export const MAX_IMAGE_SIZE_MB = 20;
export const MAX_VIDEO_SIZE_MB = 100;
export const MAX_PHOTO_SIZE_MB = MAX_IMAGE_SIZE_MB;

const IMAGE_MAX_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const VIDEO_MAX_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

export type MediaFileKind = "image" | "video" | "unknown";

export type MediaValidationResult =
  | { ok: true; kind: Exclude<MediaFileKind, "unknown">; file: File }
  | { ok: false; kind: MediaFileKind; error: string; file: File };

export type UploadResult = {
  urls: string[];
  sizeErrors: string[];   // files that exceeded the size limit
  uploadErrors: string[]; // files that failed during network upload
};

function getMediaKind(file: File): MediaFileKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "unknown";
}

function getMediaLimitBytes(kind: Exclude<MediaFileKind, "unknown">) {
  return kind === "image" ? IMAGE_MAX_BYTES : VIDEO_MAX_BYTES;
}

function formatOversizeError(file: File, kind: Exclude<MediaFileKind, "unknown">) {
  const limitMb = kind === "image" ? MAX_IMAGE_SIZE_MB : MAX_VIDEO_SIZE_MB;
  const mb = (file.size / 1024 / 1024).toFixed(1);
  const label = kind === "image" ? "图片" : "视频";
  return `「${file.name}」${mb}MB，超过${label} ${limitMb}MB 限制`;
}

export function validateMediaFile(file: File): MediaValidationResult {
  const kind = getMediaKind(file);

  if (kind === "unknown") {
    return {
      ok: false,
      kind,
      file,
      error: `「${file.name}」不是支持的图片或视频格式`,
    };
  }

  if (file.size > getMediaLimitBytes(kind)) {
    return {
      ok: false,
      kind,
      file,
      error: formatOversizeError(file, kind),
    };
  }

  return {
    ok: true,
    kind,
    file,
  };
}

export function validateMediaFiles(files: File[]) {
  const valid: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const result = validateMediaFile(file);
    if (result.ok) {
      valid.push(file);
    } else {
      errors.push(result.error);
    }
  }

  return { valid, errors };
}

export async function uploadMediaFileToStorage(
  file: File,
  basePath: string
): Promise<{ url: string | null; error: string | null; kind: Exclude<MediaFileKind, "unknown"> | null }> {
  const validation = validateMediaFile(file);
  if (!validation.ok) {
    return { url: null, error: validation.error, kind: null };
  }

  const supabase = createClient();
  const ext = (file.name.split(".").pop() ?? (validation.kind === "image" ? "jpg" : "mp4")).toLowerCase();
  const path = `${basePath}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type || (validation.kind === "image" ? "image/jpeg" : "video/mp4") });

  if (error) {
    return {
      url: null,
      error: `「${file.name}」上传失败：${error.message}`,
      kind: validation.kind,
    };
  }

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);

  return {
    url: publicUrl,
    error: null,
    kind: validation.kind,
  };
}

/**
 * Validate files before upload and return friendly error messages.
 * Returns { valid, oversized }.
 */
export function validatePhotoFiles(files: File[]): {
  valid: File[];
  sizeErrors: string[];
} {
  const { valid, errors } = validateMediaFiles(files.filter((file) => file.type.startsWith("image/")));
  return { valid, sizeErrors: errors };
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
  const urls: string[] = [];
  const uploadErrors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadMediaFileToStorage(file, basePath);

    if (result.error) {
      uploadErrors.push(result.error);
    } else if (result.url) {
      urls.push(result.url);
    }

    onProgress?.(i + 1, files.length);
  }

  return { urls, sizeErrors: [], uploadErrors };
}
