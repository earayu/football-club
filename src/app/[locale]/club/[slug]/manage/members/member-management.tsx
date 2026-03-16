"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { approveMembership, rejectMembership, removeMember } from "@/lib/actions/membership";
import { generateInviteLink } from "@/lib/actions/invitation";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  clubId: string;
  pending: any[];
  active: any[];
}

export function MemberManagement({ clubId, pending, active }: Props) {
  const t = useTranslations("manage");
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerateInvite() {
    const result = await generateInviteLink(clubId);
    if (result.code) {
      setInviteCode(result.code);
    }
  }

  function handleCopy() {
    if (inviteCode) {
      const url = `${window.location.origin}/en/join/${inviteCode}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleApprove(id: string) {
    await approveMembership(id);
    router.refresh();
  }

  async function handleReject(id: string) {
    await rejectMembership(id);
    router.refresh();
  }

  async function handleRemove(id: string) {
    await removeMember(id);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t("inviteLink")}</h2>
        <div className="mt-4 flex items-center gap-3">
          <Button variant="secondary" onClick={handleGenerateInvite}>
            {t("generateInvite")}
          </Button>
          {inviteCode && (
            <>
              <code className="rounded bg-gray-100 px-3 py-2 text-sm">{inviteCode}</code>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? t("copied") : t("copyLink")}
              </Button>
            </>
          )}
        </div>
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t("pendingRequests")}</h3>
          <div className="mt-4 space-y-3">
            {pending.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-3">
                  {m.profiles?.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">👤</div>
                  )}
                  <span className="font-medium text-gray-900">{m.profiles?.display_name || "Unknown"}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(m.id)}>{t("approve")}</Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(m.id)}>{t("reject")}</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-900">{t("activeMembers")}</h3>
        {active.length > 0 ? (
          <div className="mt-4 space-y-3">
            {active.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3">
                  {m.profiles?.avatar_url ? (
                    <img src={m.profiles.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-gray-500">👤</div>
                  )}
                  <div>
                    <span className="font-medium text-gray-900">{m.profiles?.display_name || "Unknown"}</span>
                    {m.role === "admin" && (
                      <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">Admin</span>
                    )}
                  </div>
                </div>
                {m.role !== "admin" && (
                  <Button size="sm" variant="danger" onClick={() => handleRemove(m.id)}>
                    {t("remove")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">{t("noRequests")}</p>
        )}
      </div>
    </div>
  );
}
