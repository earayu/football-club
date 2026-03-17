import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const t = await getTranslations("landing");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="overflow-hidden">

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative min-h-[88vh] overflow-hidden bg-[#0a2e1a]">
        {/* Pitch texture overlay */}
        <div className="pointer-events-none absolute inset-0">
          {/* Subtle grass stripes */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-y-0"
              style={{
                left: `${i * 10}%`,
                width: "10%",
                backgroundColor: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
              }}
            />
          ))}
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full border border-white/5" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[900px] w-[900px] rounded-full border border-white/[0.03]" />
          {/* Center spot */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white/10" />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0a2e1a]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a2e1a]/60 via-transparent to-[#0a2e1a]/60" />
        </div>

        <div className="relative flex min-h-[88vh] flex-col items-center justify-center px-4 py-24 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-800/60 bg-green-900/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-green-400 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Free for amateur clubs
          </div>

          <h1 className="max-w-4xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
            {t("title")}
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-white/60 sm:text-xl">
            {t("subtitle")}
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#0a2e1a] shadow-2xl shadow-black/30 transition hover:bg-green-50 active:scale-[0.98]"
                >
                  My Dashboard
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/create-club"
                  className="rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
                >
                  + {t("cta")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="group flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#0a2e1a] shadow-2xl shadow-black/30 transition hover:bg-green-50 active:scale-[0.98]"
                >
                  {t("cta")}
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl px-8 py-4 text-base font-medium text-white/60 transition hover:text-white"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/20">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────── */}
      <section className="bg-[#fafaf9] py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 max-w-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">功能特色</p>
            <h2 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Everything your<br />club needs
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                number: "01",
                title: t("features.profile"),
                desc: t("features.profileDesc"),
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                ),
                accent: "text-green-600 bg-green-50",
              },
              {
                number: "02",
                title: t("features.members"),
                desc: t("features.membersDesc"),
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                ),
                accent: "text-blue-600 bg-blue-50",
              },
              {
                number: "03",
                title: "手记动态",
                desc: "记录每一场比赛、每一次训练、每一个球队瞬间。文字、照片、视频自由混合。",
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
                  </svg>
                ),
                accent: "text-purple-600 bg-purple-50",
              },
            ].map((f) => (
              <div
                key={f.number}
                className="group rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className={`rounded-xl p-2.5 ${f.accent}`}>{f.icon}</div>
                  <span className="text-4xl font-black text-gray-100 group-hover:text-gray-200 transition">{f.number}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-600">步骤</p>
            <h2 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              {t("howItWorks")}
            </h2>
          </div>
          <div className="grid gap-px bg-gray-100 sm:grid-cols-3 rounded-2xl overflow-hidden shadow-sm">
            {[
              { n: "1", title: t("step1"), desc: t("step1Desc") },
              { n: "2", title: t("step2"), desc: t("step2Desc") },
              { n: "3", title: t("step3"), desc: t("step3Desc") },
            ].map((s) => (
              <div key={s.n} className="bg-white px-8 py-10">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#0a2e1a] text-lg font-black text-white">
                  {s.n}
                </div>
                <h3 className="text-base font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0a2e1a] py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_100%,rgba(34,197,94,0.15),transparent)]" />
        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Ready to build<br />your club?
          </h2>
          <p className="mt-5 text-lg text-white/50">Free forever. No credit card required.</p>
          <Link
            href={user ? "/create-club" : "/register"}
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-9 py-4 text-base font-bold text-[#0a2e1a] shadow-xl shadow-black/20 transition hover:bg-green-50 active:scale-[0.98]"
          >
            {t("cta")}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

    </div>
  );
}
