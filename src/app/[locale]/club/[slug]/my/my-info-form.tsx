"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateMyMembership } from "@/lib/actions/membership";
import { useState } from "react";

export function MyInfoForm({ membership }: { membership: any }) {
  const t = useTranslations("member");
  const tc = useTranslations("common");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setMessage(null);
    const result = await updateMyMembership(membership.id, formData);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Saved!" });
    }
    setIsSaving(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {message && (
        <div className={`rounded-lg p-3 text-sm ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
          {message.text}
        </div>
      )}
      <Input
        id="number"
        name="number"
        type="number"
        label={t("number")}
        defaultValue={membership.number || ""}
        placeholder="10"
        min={1}
        max={99}
      />
      <div className="space-y-1">
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          {t("position")}
        </label>
        <select
          id="position"
          name="position"
          defaultValue={membership.position || ""}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="">—</option>
          <option value="GK">{t("positions.GK")}</option>
          <option value="DF">{t("positions.DF")}</option>
          <option value="MF">{t("positions.MF")}</option>
          <option value="FW">{t("positions.FW")}</option>
        </select>
      </div>
      <Button type="submit" isLoading={isSaving}>
        {tc("save")}
      </Button>
    </form>
  );
}
