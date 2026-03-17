import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Users, Notebook, Globe } from "@phosphor-icons/react/dist/ssr";

export default async function HomePage() {
  const t = await getTranslations("landing");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      {/* ── HERO — left-aligned split screen ─────────────────────── */}
      <section className="relative min-h-[100dvh] overflow-hidden bg-zinc-950">
        {/* Right side: pitch SVG visual */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-[0.07]">
          <svg viewBox="0 0 400 600" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pitch markings */}
            <rect x="40" y="40" width="320" height="520" stroke="white" strokeWidth="2"/>
            <line x1="40" y1="300" x2="360" y2="300" stroke="white" strokeWidth="1.5"/>
            <circle cx="200" cy="300" r="60" stroke="white" strokeWidth="1.5"/>
            <circle cx="200" cy="300" r="3" fill="white"/>
            <rect x="120" y="40" width="160" height="80" stroke="white" strokeWidth="1.5"/>
            <rect x="160" y="40" width="80" height="40" stroke="white" strokeWidth="1.5"/>
            <rect x="120" y="480" width="160" height="80" stroke="white" strokeWidth="1.5"/>
            <rect x="160" y="520" width="80" height="40" stroke="white" strokeWidth="1.5"/>
            <circle cx="200" cy="120" r="4" fill="white"/>
            <circle cx="200" cy="480" r="4" fill="white"/>
            <path d="M120 120 a80 80 0 0 0 160 0" stroke="white" strokeWidth="1.5" fill="none"/>
            <path d="M120 480 a80 80 0 0 1 160 0" stroke="white" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        {/* Gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/95 to-zinc-950/40" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent" />

        {/* Content — left aligned */}
        <div className="relative flex min-h-[100dvh] flex-col justify-center px-5 py-24 sm:px-8 lg:px-16 xl:px-24">
          <div className="max-w-2xl">
            {/* Pill label */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-green-800/50 bg-green-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Free for every club
            </div>

            <h1 className="text-5xl font-black leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {t("title")}
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
              {t("subtitle")}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-bold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100 active:scale-[0.98]"
                  >
                    My Dashboard
                    <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/create-club"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-7 py-3.5 text-[15px] font-medium text-white/80 transition hover:border-white/30 hover:text-white"
                  >
                    Create club
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[15px] font-bold text-zinc-900 shadow-lg shadow-black/30 transition hover:bg-zinc-100 active:scale-[0.98]"
                  >
                    {t("cta")}
                    <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center rounded-xl px-7 py-3.5 text-[15px] font-medium text-white/50 transition hover:text-white/80"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </div>

            {/* Social proof strip */}
            <div className="mt-14 flex items-center gap-3 text-xs text-zinc-500">
              <div className="flex -space-x-2">
                {["#3b82f6","#8b5cf6","#ec4899","#f59e0b","#10b981"].map((c, i) => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-zinc-950" style={{ background: c }} />
                ))}
              </div>
              <span>Trusted by clubs worldwide</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — asymmetric 2+1 grid ─────────────────────── */}
      <section className="bg-[#f9fafb] py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {/* Left-aligned header */}
          <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-700">
                Features
              </p>
              <h2 className="text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                Built for<br />football culture
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-base leading-relaxed text-zinc-500 max-w-sm">
                Everything a club needs — from a public profile to a shared journal where the whole squad contributes.
              </p>
            </div>
          </div>

          {/* Asymmetric feature grid: 2-col then 1 wide */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Feature 1 — tall */}
            <div className="group rounded-2xl border border-slate-200/60 bg-white p-8 shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]">
              <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-green-50 p-3">
                <Globe size={22} weight="duotone" className="text-green-700" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">01</p>
              <h3 className="text-xl font-bold text-zinc-900">{t("features.profile")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{t("features.profileDesc")}</p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-2xl border border-slate-200/60 bg-white p-8 shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]">
              <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-blue-50 p-3">
                <Users size={22} weight="duotone" className="text-blue-600" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2">02</p>
              <h3 className="text-xl font-bold text-zinc-900">{t("features.members")}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-500">{t("features.membersDesc")}</p>
            </div>

            {/* Feature 3 — full width */}
            <div className="group rounded-2xl border border-slate-200/60 bg-zinc-950 p-8 shadow-card transition hover:-translate-y-0.5 md:col-span-2">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-white/10 p-3">
                    <Notebook size={22} weight="duotone" className="text-green-400" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">03</p>
                  <h3 className="text-xl font-bold text-white">手记动态</h3>
                  <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                    每次比赛、训练、聚餐都值得被记录。多人协作，随时追加文字、照片、视频。
                  </p>
                </div>
                {/* Visual preview */}
                <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-6">
                  <div className="w-full space-y-3">
                    {["主场 3:0 胜利 — 精彩集锦", "训练日记 · 周三下午", "队友生日快乐"].map((label, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                        <div className="h-7 w-7 rounded-full bg-green-700/60 flex-shrink-0" />
                        <span className="text-xs text-zinc-400 truncate">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-white py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-green-700">
            How it works
          </p>
          <h2 className="mb-16 text-4xl font-black tracking-tight text-zinc-900 sm:text-5xl">
            {t("howItWorks")}
          </h2>

          {/* Steps — not 3-col, use bordered-left list */}
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {[
              { n: "01", title: t("step1"), desc: t("step1Desc") },
              { n: "02", title: t("step2"), desc: t("step2Desc") },
              { n: "03", title: t("step3"), desc: t("step3Desc") },
            ].map((s) => (
              <div key={s.n} className="grid grid-cols-[3rem_1fr] items-start gap-6 bg-white px-8 py-7 transition hover:bg-zinc-50/60 sm:grid-cols-[5rem_1fr]">
                <span className="text-3xl font-black text-zinc-200">{s.n}</span>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_30%_50%,rgba(21,128,61,0.2),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Your club,<br />online today.
            </h2>
            <p className="mt-5 text-lg text-zinc-500">Free forever. No credit card.</p>
            <Link
              href={user ? "/create-club" : "/register"}
              className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-[15px] font-bold text-zinc-900 shadow-xl shadow-black/20 transition hover:bg-zinc-100 active:scale-[0.98]"
            >
              {t("cta")}
              <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
