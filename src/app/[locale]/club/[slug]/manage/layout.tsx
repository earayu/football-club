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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-2">
        <Link
          href={`/club/${slug}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to club
        </Link>
      </div>
      {children}
    </div>
  );
}
