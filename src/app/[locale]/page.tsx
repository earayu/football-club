import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:py-40">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-green-100 sm:text-xl">
              {t("subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-green-700 shadow-lg transition-all hover:bg-green-50 hover:shadow-xl"
                  >
                    My Dashboard →
                  </Link>
                  <Link
                    href="/create-club"
                    className="inline-block rounded-xl border-2 border-white/60 px-8 py-4 text-lg font-bold text-white transition-all hover:border-white hover:bg-white/10"
                  >
                    + {t("cta")}
                  </Link>
                </>
              ) : (
                <Link
                  href="/create-club"
                  className="inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-green-700 shadow-lg transition-all hover:bg-green-50 hover:shadow-xl"
                >
                  {t("cta")} →
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-shadow hover:shadow-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                🏟️
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">
                {t("features.profile")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t("features.profileDesc")}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-shadow hover:shadow-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                👥
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">
                {t("features.members")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t("features.membersDesc")}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center transition-shadow hover:shadow-md">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                📸
              </div>
              <h3 className="mt-6 text-lg font-bold text-gray-900">
                {t("features.albums")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                {t("features.albumsDesc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            {t("howItWorks")}
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
                1
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {t("step1")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{t("step1Desc")}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
                2
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {t("step2")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{t("step2Desc")}</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-xl font-bold text-white">
                3
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {t("step3")}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{t("step3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-700 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">{t("cta")}</h2>
          <p className="mt-4 text-green-100">{t("subtitle")}</p>
          <Link
            href="/create-club"
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-lg font-bold text-green-700 shadow-lg transition-all hover:bg-green-50 hover:shadow-xl"
          >
            {t("cta")} →
          </Link>
        </div>
      </section>
    </div>
  );
}
