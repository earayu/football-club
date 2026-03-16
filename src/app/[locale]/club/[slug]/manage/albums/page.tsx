import { getTranslations } from "next-intl/server";

export default async function ManageAlbumsPage() {
  const t = await getTranslations("manage");
  
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900">{t("albumManagement")}</h2>
      <p className="mt-4 text-sm text-gray-500">Album management coming in Task 15.</p>
    </div>
  );
}
