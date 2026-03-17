"use server";

import { classifyExternalUrl } from "@/lib/posts/document";
import { resolveUrlPreview } from "@/lib/posts/url-preview";

function getHostname(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export async function resolveDroppedUrl(url: string) {
  const match = classifyExternalUrl(url);

  if (!match) {
    return { error: "不支持的链接格式" };
  }

  if (match.kind === "image") {
    return {
      kind: "image" as const,
      url: match.url,
    };
  }

  if (match.kind === "video") {
    return {
      kind: "video" as const,
      url: match.url,
      provider: match.provider,
    };
  }

  try {
    const preview = await resolveUrlPreview(match.url);
    return {
      kind: "link" as const,
      preview,
    };
  } catch {
    return {
      kind: "link" as const,
      preview: {
        url: match.url,
        title: "",
        description: "",
        image: "",
        siteName: getHostname(match.url),
      },
    };
  }
}
