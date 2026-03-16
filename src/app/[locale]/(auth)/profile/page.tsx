import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getLocale();

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("*, clubs(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const t = await getTranslations("profile");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">{t("editProfile")}</h1>

      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-gray-900">{t("myClubs")}</h2>
        {memberships && memberships.length > 0 ? (
          <div className="mt-4 grid gap-4">
            {memberships.map((m: any) => (
              <a
                key={m.id}
                href={`/${locale}/club/${m.clubs.slug}`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                {m.clubs.badge_url ? (
                  <img
                    src={m.clubs.badge_url}
                    alt={m.clubs.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-xl">
                    ⚽
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{m.clubs.name}</p>
                  <p className="text-sm text-gray-500">
                    {m.role === "admin" ? "Admin" : "Member"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">{t("noClubs")}</p>
        )}
      </div>
    </div>
  );
}
