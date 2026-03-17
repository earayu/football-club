import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const t = await getTranslations("common");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let clubs: { slug: string; name: string; badge_url: string | null }[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("memberships")
      .select("clubs(slug, name, badge_url)")
      .eq("user_id", user.id)
      .eq("status", "active");
    clubs = (memberships ?? []).map((m: any) => m.clubs).filter(Boolean);
  }

  const displayName = user?.user_metadata?.display_name ?? user?.email ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-900/[0.06] bg-[#f9fafb]/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-0 sm:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-700 shadow-sm shadow-green-900/20">
            <svg viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9.5" stroke="white" strokeWidth="1.5"/>
              <path d="M12 4.5L14.5 8h-5L12 4.5zM12 19.5L9.5 16h5L12 19.5zM4.5 12L8 9.5v5L4.5 12zM19.5 12L16 14.5v-5L19.5 12z" fill="white" opacity=".75"/>
              <circle cx="12" cy="12" r="2" fill="white" opacity=".9"/>
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-zinc-900">
            Football Club Portal
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-1">
          {user ? (
            <UserMenu
              displayName={displayName}
              email={user.email ?? ""}
              initial={initial}
              clubs={clubs}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="ml-1 rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-green-900/20 transition hover:bg-green-800 active:scale-[0.98]"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
