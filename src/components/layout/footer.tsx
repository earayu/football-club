import { Link } from "@/i18n/navigation";

export function Footer() {
  return (
    <footer className="border-t border-slate-900/[0.06] bg-[#f9fafb]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-700">
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5"/>
                <circle cx="12" cy="12" r="2" fill="white" opacity=".9"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-700">Football Club Portal</span>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
            <Link href="/register" className="transition hover:text-zinc-700">Get started</Link>
            <Link href="/login" className="transition hover:text-zinc-700">Sign in</Link>
          </nav>
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} Football Club Portal
          </p>
        </div>
      </div>
    </footer>
  );
}
