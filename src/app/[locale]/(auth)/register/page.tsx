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
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("registerTitle")}
        </h1>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <Input
          id="displayName"
          name="displayName"
          type="text"
          label={t("displayName")}
          placeholder="Your name"
          required
        />
        <Input
          id="email"
          name="email"
          type="email"
          label={t("email")}
          placeholder="you@example.com"
          required
        />
        <Input
          id="password"
          name="password"
          type="password"
          label={t("password")}
          placeholder="••••••••"
          required
          minLength={6}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          {tc("register")}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-green-600 hover:text-green-700"
        >
          {tc("login")}
        </Link>
      </p>
    </div>
  );
}
