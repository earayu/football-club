"use client";

import { Button } from "@/components/ui/button";
import { joinViaInvite } from "@/lib/actions/invitation";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function JoinButton({ code }: { code: string }) {
  const t = useTranslations("invitation");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setIsLoading(true);
    setError(null);
    const result = await joinViaInvite(code);
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 text-sm text-red-600">{error}</p>
      )}
      <Button onClick={handleJoin} isLoading={isLoading} size="lg">
        {t("joinNow")}
      </Button>
    </div>
  );
}
