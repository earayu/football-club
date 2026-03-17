import { load } from "cheerio";

export type UrlPreview = {
  url: string;
  title: string;
  description: string;
  image: string;
  siteName: string;
};

function normalizeText(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function toAbsoluteUrl(baseUrl: URL, candidate: string) {
  if (!candidate) return "";

  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return "";
  }
}

function readMeta($: ReturnType<typeof load>, key: string) {
  return normalizeText(
    $(`meta[property="${key}"]`).attr("content") ??
      $(`meta[name="${key}"]`).attr("content")
  );
}

export function parsePreviewFromHtml(rawUrl: string, html: string): UrlPreview {
  const url = new URL(rawUrl);
  const $ = load(html);

  const title =
    readMeta($, "og:title") ||
    readMeta($, "twitter:title") ||
    normalizeText($("title").first().text());

  const description =
    readMeta($, "og:description") ||
    readMeta($, "twitter:description") ||
    readMeta($, "description");

  const image = toAbsoluteUrl(
    url,
    readMeta($, "og:image") || readMeta($, "twitter:image")
  );

  const siteName =
    readMeta($, "og:site_name") ||
    readMeta($, "twitter:site") ||
    url.hostname;

  return {
    url: url.toString(),
    title,
    description,
    image,
    siteName,
  };
}

export async function resolveUrlPreview(rawUrl: string): Promise<UrlPreview> {
  const url = new URL(rawUrl);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("仅支持 http/https 链接");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": "FootballClubBot/1.0 (+https://football-club-eight.vercel.app)",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`链接解析失败：${response.status}`);
  }

  return parsePreviewFromHtml(response.url, await response.text());
}
