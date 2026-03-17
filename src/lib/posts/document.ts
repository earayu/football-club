import type { PartialBlock } from "@blocknote/core";

export type PostDocumentBlock = PartialBlock;
export type PostEntryDocument = PartialBlock[];

export type ExternalUrlMatch =
  | { kind: "image"; url: string }
  | { kind: "video"; url: string; provider: "youtube" | "bilibili" | "file" }
  | { kind: "link"; url: string };

const IMAGE_URL_RE = /\.(jpe?g|png|gif|webp|avif|bmp|heic|svg)(\?.*)?$/i;
const VIDEO_FILE_URL_RE = /\.(mp4|webm|mov|m4v|ogg|ogv)(\?.*)?$/i;

function getUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url;
  } catch {
    return null;
  }
}

function isYouTubeUrl(url: URL) {
  return (
    url.hostname === "youtu.be" ||
    url.hostname.endsWith("youtube.com")
  );
}

function isBilibiliUrl(url: URL) {
  return url.hostname.endsWith("bilibili.com");
}

function readInlineText(content: PostDocumentBlock["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content.map((item) => {
    if (typeof item === "string") return item;
    if (!item || typeof item !== "object") return "";
    if ("text" in item && typeof item.text === "string") return item.text;
    if ("content" in item) {
      return readInlineText(item.content as PostDocumentBlock["content"]);
    }
    return "";
  }).join("");
}

function walkBlocks(document: PostEntryDocument, visitor: (block: PostDocumentBlock) => void) {
  for (const block of document) {
    visitor(block);
    if (block.children?.length) walkBlocks(block.children as PostEntryDocument, visitor);
  }
}

function getBlockUrl(block: PostDocumentBlock) {
  const props = block.props;
  if (!props || typeof props !== "object" || !("url" in props)) return "";

  const url = props.url;
  return typeof url === "string" ? url.trim() : "";
}

function blockHasMedia(block: PostDocumentBlock) {
  const url = getBlockUrl(block);
  if (!url) return false;

  const blockType = String(block.type ?? "");
  return blockType === "image" || blockType === "video" || blockType === "linkPreview";
}

export function classifyExternalUrl(raw: string): ExternalUrlMatch | null {
  const url = getUrl(raw.trim());
  if (!url) return null;

  if (IMAGE_URL_RE.test(url.pathname)) {
    return { kind: "image", url: url.toString() };
  }

  if (VIDEO_FILE_URL_RE.test(url.pathname)) {
    return { kind: "video", url: url.toString(), provider: "file" };
  }

  if (isYouTubeUrl(url)) {
    return { kind: "video", url: url.toString(), provider: "youtube" };
  }

  if (isBilibiliUrl(url)) {
    return { kind: "video", url: url.toString(), provider: "bilibili" };
  }

  return { kind: "link", url: url.toString() };
}

export function hasMeaningfulContent(document: PostEntryDocument) {
  let found = false;

  walkBlocks(document, (block) => {
    if (found) return;

    if (blockHasMedia(block)) {
      found = true;
      return;
    }

    if (readInlineText(block.content).trim()) {
      found = true;
    }
  });

  return found;
}

export function summarizeEntryContent(document: PostEntryDocument) {
  let hasText = false;
  let photoCount = 0;
  let videoCount = 0;
  let linkCount = 0;

  walkBlocks(document, (block) => {
    if (!hasText && readInlineText(block.content).trim()) {
      hasText = true;
    }

    const blockType = String(block.type ?? "");
    if (blockType === "image" && blockHasMedia(block)) photoCount += 1;
    if (blockType === "video" && blockHasMedia(block)) videoCount += 1;
    if (blockType === "linkPreview" && blockHasMedia(block)) linkCount += 1;
  });

  const segments: string[] = [];

  if (hasText) segments.push("文字");
  if (photoCount > 0) segments.push(`${photoCount} 张照片`);
  if (videoCount > 0) segments.push(videoCount === 1 && !hasText && photoCount === 0 && linkCount === 0 ? "视频" : `${videoCount} 个视频`);
  if (linkCount > 0) segments.push(linkCount === 1 && !hasText && photoCount === 0 && videoCount === 0 ? "链接" : `${linkCount} 个链接`);

  if (segments.length === 0) return "补充了内容";

  return `补充了${segments.length === 1 && segments[0] !== "文字" ? " " : ""}${segments.join("、")}`;
}
