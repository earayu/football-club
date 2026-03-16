import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { MyInfoForm } from "./my-info-form";

export default async function MyInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const supabase = await createClient();
  const t = await getTranslations("member");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  const { data: membership } = await supabase
    .from("memberships")
    .select("*")
    .eq("user_id", user.id)
    .eq("club_id", (club as any).id)
    .eq("status", "active")
    .single();

  if (!membership) {
    redirect({ href: `/club/${slug}`, locale });
    return;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-xl font-bold text-gray-900">{t("editMyInfo")}</h1>
      <div className="mt-6">
        <MyInfoForm membership={membership} />
      </div>
    </div>
  );
}
