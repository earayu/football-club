"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClub, uploadBadge } from "@/lib/actions/club";
import { useState, useRef } from "react";

export function ClubInfoForm({ club }: { club: any }) {
  const t = useTranslations("club");
  const tc = useTranslations("common");
  const [badgeUrl, setBadgeUrl] = useState(club.badge_url || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleBadgeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("badge", file);
    const result = await uploadBadge(club.id, fd);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result.badgeUrl) {
      setBadgeUrl(result.badgeUrl);
    }
    setIsUploading(false);
  }

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    const result = await updateClub(club.id, formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Saved!" });
    }
    setIsSaving(false);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
          {badgeUrl ? (
            <img src={badgeUrl} alt="Badge" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">⚽</div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleBadgeUpload} className="hidden" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">{t("clubBadge")}</p>
          <p className="text-xs text-gray-500">Click to change</p>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {message && (
          <div className={`rounded-lg p-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
            {message.text}
          </div>
        )}
        <Input id="name" name="name" label={t("clubName")} defaultValue={club.name} required />
        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t("clubDescription")}</label>
          <textarea id="description" name="description" rows={3} defaultValue={club.description || ""} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>
        <Input id="foundedDate" name="foundedDate" type="date" label={t("foundedDate")} defaultValue={club.founded_date || ""} />
        <Button type="submit" isLoading={isSaving}>{tc("save")}</Button>
      </form>
    </div>
  );
}
