import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="1.5"/>
                <path d="M12 4.5l2.5 3.5H9.5L12 4.5zM12 19.5l-2.5-3.5h5l-2.5 3.5zM4.5 12l3.5-2.5v5L4.5 12zM19.5 12l-3.5 2.5v-5l3.5 2.5z" fill="white" opacity="0.8"/>
                <circle cx="12" cy="12" r="2.5" fill="white" opacity="0.9"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700">Football Club Portal</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/register" className="hover:text-gray-900 transition-colors">Get started</Link>
            <Link href="/login" className="hover:text-gray-900 transition-colors">Sign in</Link>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Football Club Portal
          </p>
        </div>
      </div>
    </footer>
  );
}
