import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: clubs } = await supabase.from("clubs").select("slug, created_at");

  const locales = ["en", "zh", "es"];
  const baseUrl = "https://footballclub.app";

  const staticPages = locales.flatMap((locale) => [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1,
    },
  ]);

  const clubPages = (clubs || []).flatMap((club: { slug: string; created_at: string }) =>
    locales.flatMap((locale) => [
      {
        url: `${baseUrl}/${locale}/club/${club.slug}`,
        lastModified: new Date(club.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${baseUrl}/${locale}/club/${club.slug}/members`,
        lastModified: new Date(club.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      {
        url: `${baseUrl}/${locale}/club/${club.slug}/albums`,
        lastModified: new Date(club.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
    ])
  );

  return [...staticPages, ...clubPages];
}
