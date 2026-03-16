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
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">⚽</span>
          <span className="text-lg font-bold text-gray-900">
            {t("appName")}
          </span>
        </Link>
        <div className="flex items-center gap-3">
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
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
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
