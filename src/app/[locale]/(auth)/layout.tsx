import { Link } from "@/i18n/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh]">
      {/* Left — brand panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-zinc-950 px-10 py-10 lg:flex">
        {/* Pitch decoration */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <svg viewBox="0 0 300 500" className="h-full w-full" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="260" height="460" stroke="white" strokeWidth="1.5"/>
            <line x1="20" y1="250" x2="280" y2="250" stroke="white" strokeWidth="1"/>
            <circle cx="150" cy="250" r="50" stroke="white" strokeWidth="1"/>
            <circle cx="150" cy="250" r="2" fill="white"/>
            <rect x="90" y="20" width="120" height="60" stroke="white" strokeWidth="1"/>
            <rect x="90" y="420" width="120" height="60" stroke="white" strokeWidth="1"/>
          </svg>
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-transparent to-zinc-950/80" />

        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
              <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="2" fill="white" opacity=".9"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-white">Football Club Portal</span>
        </Link>

        {/* Quote */}
        <div className="relative">
          <blockquote className="text-2xl font-bold leading-snug text-white">
            &ldquo;Where football<br />stories live.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-zinc-500">
            Build your club&apos;s online home in minutes.
          </p>
        </div>

        {/* Bottom stat */}
        <div className="relative flex items-center gap-4 text-xs text-zinc-600">
          <div>
            <p className="text-lg font-black text-white">Free</p>
            <p>forever</p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <p className="text-lg font-black text-white">No</p>
            <p>credit card</p>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
