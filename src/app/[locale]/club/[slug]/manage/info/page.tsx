import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClubInfoForm } from "./club-info-form";

export default async function ManageInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const t = await getTranslations("manage");

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!club) notFound();

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{t("clubInfo")}</h2>
      <div className="mt-6">
        <ClubInfoForm club={club} />
      </div>
    </div>
  );
}
