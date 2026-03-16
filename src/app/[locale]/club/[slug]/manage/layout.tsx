import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const supabase = await createClient();
  const t = await getTranslations("manage");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, slug, name")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data: membership } = await supabase
    .from("memberships")
    .select("role, status")
    .eq("user_id", user.id)
    .eq("club_id", (club as any).id)
    .eq("role", "admin")
    .eq("status", "active")
    .single();

  if (!membership) {
    redirect({ href: `/club/${slug}`, locale });
    return;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex gap-8">
        <nav className="hidden w-48 shrink-0 md:block">
          <div className="space-y-1">
            <Link
              href={`/club/${slug}/manage/info`}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {t("clubInfo")}
            </Link>
            <Link
              href={`/club/${slug}/manage/members`}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {t("memberManagement")}
            </Link>
            <Link
              href={`/club/${slug}/manage/albums`}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {t("albumManagement")}
            </Link>
          </div>
        </nav>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
