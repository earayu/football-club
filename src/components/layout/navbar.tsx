import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const t = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let clubs: { slug: string; name: string; badge_url: string | null }[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("memberships")
      .select("clubs(slug, name, badge_url)")
      .eq("user_id", user.id)
      .eq("status", "active");
    clubs = (memberships ?? []).map((m: any) => m.clubs).filter(Boolean);
  }

  const displayName: string =
    user?.user_metadata?.display_name ?? user?.email ?? "";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-0 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l7 4.5-7 4.5z"/>
              <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4"/>
              <path d="M12 4.5l2.5 3.5H9.5L12 4.5zM12 19.5l-2.5-3.5h5l-2.5 3.5zM4.5 12l3.5-2.5v5L4.5 12zM19.5 12l-3.5 2.5v-5l3.5 2.5z" fill="white" opacity="0.7"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-gray-900">
            {t("appName")}
          </span>
        </Link>

        {/* Actions */}
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
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="ml-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 active:bg-green-800"
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
