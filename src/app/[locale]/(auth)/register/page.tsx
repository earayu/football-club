"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/actions/auth";
import { useState } from "react";
import { Warning } from "@phosphor-icons/react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);
    const result = await register(formData);
    if (result?.error) { setError(result.error); setIsLoading(false); }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-zinc-900">{t("registerTitle")}</h1>
        <p className="mt-1.5 text-sm text-zinc-500">Create your account — it&apos;s free.</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <Warning size={15} className="shrink-0 fill-red-500" />
            {error}
          </div>
        )}
        <Input id="displayName" name="displayName" type="text" label={t("displayName")} placeholder="Alex Morgan" required autoComplete="name" />
        <Input id="email" name="email" type="email" label={t("email")} placeholder="you@example.com" required autoComplete="email" />
        <Input id="password" name="password" type="password" label={t("password")} placeholder="••••••••" required minLength={6} autoComplete="new-password" hint="At least 6 characters" />
        <Button type="submit" className="w-full" size="md" isLoading={isLoading}>
          {tc("register")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-green-700 hover:text-green-800">
          {tc("login")}
        </Link>
      </p>
    </div>
  );
}
