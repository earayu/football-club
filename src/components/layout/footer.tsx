import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6">
        <p className="text-sm text-gray-600">{t("createYourClub")}</p>
        <Link
          href="/register"
          className="mt-2 inline-block text-sm font-medium text-green-600 transition-colors hover:text-green-700"
        >
          {t("poweredBy")}
        </Link>
      </div>
    </footer>
  );
}
