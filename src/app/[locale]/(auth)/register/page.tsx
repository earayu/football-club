"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/actions/auth";
import { useState } from "react";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-green-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" fill="none" stroke="white" strokeWidth="1.5"/>
            <path d="M12 5l2 3h-4l2-3zM12 19l-2-3h4l-2 3zM5 12l3-2v4L5 12zM19 12l-3 2v-4l3 2z" fill="white" opacity="0.8"/>
            <circle cx="12" cy="12" r="2" fill="white"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{t("registerTitle")}</h1>
        <p className="text-sm text-gray-500">Create your account, it&apos;s free</p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-600">
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
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

      <p className="text-center text-sm text-gray-500">
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-semibold text-green-600 hover:text-green-700">
          {tc("login")}
        </Link>
      </p>
    </div>
  );
}
