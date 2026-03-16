"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  approveMembership,
  rejectMembership,
  removeMember,
} from "@/lib/actions/membership";
import { generateInviteLink } from "@/lib/actions/invitation";

export function InviteButton({ clubId }: { clubId: string }) {
  const t = useTranslations("manage");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const result = await generateInviteLink(clubId);
    if (result.code) setCode(result.code);
    setLoading(false);
  }

  function handleCopy() {
    if (!code) return;
    const url = `${window.location.origin}/${window.location.pathname.split("/")[1]}/join/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="secondary" size="sm" onClick={handleGenerate} isLoading={loading}>
        {t("generateInvite")}
      </Button>
      {code && (
        <>
          <code className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            {code}
          </code>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </>
      )}
    </div>
  );
}

export function MemberRow({
  membership,
  isAdmin,
}: {
  membership: any;
  isAdmin: boolean;
}) {
  const t = useTranslations("manage");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const profile = membership.profiles;

  async function handleApprove() {
    setLoading("approve");
    await approveMembership(membership.id);
    router.refresh();
    setLoading(null);
  }

  async function handleReject() {
    setLoading("reject");
    await rejectMembership(membership.id);
    router.refresh();
    setLoading(null);
  }

  async function handleRemove() {
    if (!confirm(`Remove ${profile?.display_name ?? "this member"}?`)) return;
    setLoading("remove");
    await removeMember(membership.id);
    router.refresh();
    setLoading(null);
  }

  const isPending = membership.status === "pending";

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 transition-colors ${
        isPending ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-xl">
            👤
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">
            {profile?.display_name || "—"}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
            {membership.number && <span>#{membership.number}</span>}
            {membership.position && <span>{membership.position}</span>}
            {membership.role === "admin" && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 font-medium">
                Admin
              </span>
            )}
            {isPending && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700 font-medium">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          {isPending ? (
            <>
              <Button
                size="sm"
                onClick={handleApprove}
                isLoading={loading === "approve"}
              >
                {t("approve")}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleReject}
                isLoading={loading === "reject"}
              >
                {t("reject")}
              </Button>
            </>
          ) : membership.role !== "admin" ? (
            <Button
              size="sm"
              variant="danger"
              onClick={handleRemove}
              isLoading={loading === "remove"}
            >
              {t("remove")}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
