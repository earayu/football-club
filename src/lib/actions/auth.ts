"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();

  // Smart redirect based on club count
  const { data: memberships } = await supabase
    .from("memberships")
    .select("clubs(slug)")
    .eq("user_id", authData.user.id)
    .eq("status", "active");

  if (!memberships || memberships.length === 0) {
    redirect({ href: "/create-club", locale });
  } else if (memberships.length === 1) {
    const slug = (memberships[0].clubs as any)?.slug;
    redirect({ href: `/club/${slug}`, locale });
  } else {
    redirect({ href: "/dashboard", locale });
  }
}

export async function register(formData: FormData) {
  const supabase = await createClient();

  const displayName = formData.get("displayName") as string;

  const { error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const locale = await getLocale();
  redirect({ href: "/", locale });
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const locale = await getLocale();
  redirect({ href: "/", locale });
}
