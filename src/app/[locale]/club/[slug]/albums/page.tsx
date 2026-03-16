import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export default async function AlbumsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  redirect({ href: `/club/${slug}`, locale });
}
