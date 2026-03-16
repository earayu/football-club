import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const t = await getTranslations("landing");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-b from-green-950 via-green-900 to-green-800">
        {/* Pitch lines decoration */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white" />
          <div className="absolute left-1/2 inset-y-0 w-px bg-white" />
          <div className="absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white" />
          <div className="absolute top-0 inset-x-0 h-px bg-white" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-white" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-700 bg-green-900/60 px-4 py-1.5 text-xs font-medium text-green-300 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Free for amateur clubs
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-green-200/80">
              {t("subtitle")}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-green-900 shadow-lg shadow-black/20 transition hover:bg-green-50 active:scale-[0.98]"
                  >
                    My Dashboard →
                  </Link>
                  <Link
                    href="/create-club"
                    className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                  >
                    + {t("cta")}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-green-900 shadow-lg shadow-black/20 transition hover:bg-green-50 active:scale-[0.98]"
                  >
                    {t("cta")} →
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-xl border border-white/20 px-7 py-3.5 text-base font-medium text-white/80 transition hover:text-white hover:border-white/40"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything your club needs
            </h2>
            <p className="mt-3 text-gray-500">One place for your squad, stories and memories.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                ),
                title: t("features.profile"),
                desc: t("features.profileDesc"),
                color: "text-green-600 bg-green-50",
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                ),
                title: t("features.members"),
                desc: t("features.membersDesc"),
                color: "text-blue-600 bg-blue-50",
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                ),
                title: t("features.albums"),
                desc: t("features.albumsDesc"),
                color: "text-purple-600 bg-purple-50",
              },
            ].map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
                <div className={`mb-5 inline-flex rounded-xl p-2.5 ${f.color}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {t("howItWorks")}
            </h2>
          </div>
          <div className="relative grid gap-8 md:grid-cols-3">
            {/* connector lines */}
            <div className="absolute top-6 hidden h-px w-full bg-gradient-to-r from-transparent via-gray-200 to-transparent md:block" />
            {[
              { n: "1", title: t("step1"), desc: t("step1Desc") },
              { n: "2", title: t("step2"), desc: t("step2Desc") },
              { n: "3", title: t("step3"), desc: t("step3Desc") },
            ].map((s) => (
              <div key={s.n} className="relative text-center">
                <div className="relative mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white shadow-md shadow-green-200">
                  {s.n}
                </div>
                <h3 className="text-base font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-green-950 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to build your club page?
          </h2>
          <p className="mt-4 text-green-300/80">Free, forever. No credit card required.</p>
          <Link
            href={user ? "/create-club" : "/register"}
            className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-base font-semibold text-green-900 shadow-lg shadow-black/20 transition hover:bg-green-50 active:scale-[0.98]"
          >
            {t("cta")} →
          </Link>
        </div>
      </section>
    </div>
  );
}
