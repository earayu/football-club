"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClub } from "@/lib/actions/club";
import { useState } from "react";

export default function CreateClubPage() {
  const t = useTranslations("club");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState("");

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    const generated = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 60);
    setSlug(generated);
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsLoading(true);
    const result = await createClub(formData);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center">
        <span className="text-4xl">⚽</span>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          {t("createClub")}
        </h1>
      </div>

      <form action={handleSubmit} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <Input
          id="name"
          name="name"
          label={t("clubName")}
          placeholder="Dragon FC"
          required
          onChange={handleNameChange}
        />
        <Input
          id="slug"
          name="slug"
          label={t("clubSlug")}
          placeholder="dragon-fc"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        <div className="space-y-1">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            {t("clubDescription")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <Input
          id="foundedDate"
          name="foundedDate"
          type="date"
          label={t("foundedDate")}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          {t("createClub")}
        </Button>
      </form>
    </div>
  );
}
