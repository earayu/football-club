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
import { generateInviteLink, revokeInviteLink } from "@/lib/actions/invitation";

type ExpiresIn = "1d" | "7d" | "30d" | null;

const EXPIRES_OPTIONS: { value: ExpiresIn; label: string }[] = [
  { value: null, label: "No expiry" },
  { value: "1d", label: "1 day" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
];

export function InviteButton({
  clubId,
  existingCode,
  existingExpiresAt,
}: {
  clubId: string;
  existingCode?: string | null;
  existingExpiresAt?: string | null;
}) {
  const t = useTranslations("manage");
  const router = useRouter();
  const [code, setCode] = useState<string | null>(existingCode ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(existingExpiresAt ?? null);
  const [expiresIn, setExpiresIn] = useState<ExpiresIn>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [revoking, setRevoking] = useState(false);

  function getInviteUrl(c: string) {
    const locale = window.location.pathname.split("/")[1];
    return `${window.location.origin}/${locale}/join/${c}`;
  }

  async function handleGenerate() {
    setLoading(true);
    const result = await generateInviteLink(clubId, expiresIn);
    if (result.code) {
      setCode(result.code);
      setExpiresAt(result.expires_at ?? null);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleRevoke() {
    if (!confirm("Revoke this invite link?")) return;
    setRevoking(true);
    await revokeInviteLink(clubId);
    setCode(null);
    setExpiresAt(null);
    setRevoking(false);
    router.refresh();
  }

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(getInviteUrl(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  return (
    <div className="flex flex-col items-end gap-2">
      {code && !isExpired ? (
        // Existing valid invite
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex flex-col">
            <code className="text-sm font-mono text-gray-700">{code}</code>
            {expiresAt ? (
              <span className="text-xs text-gray-400">
                Expires {new Date(expiresAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="text-xs text-gray-400">No expiry</span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : t("copyLink")}
          </Button>
          <button
            onClick={handleRevoke}
            disabled={revoking}
            className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50"
          >
            Revoke
          </button>
        </div>
      ) : (
        // No invite or expired — show generate controls
        <div className="flex items-center gap-2">
          <select
            value={expiresIn ?? ""}
            onChange={(e) => setExpiresIn((e.target.value || null) as ExpiresIn)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 focus:border-green-500 focus:outline-none"
          >
            {EXPIRES_OPTIONS.map((o) => (
              <option key={o.label} value={o.value ?? ""}>
                {o.label}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={handleGenerate} isLoading={loading}>
            {t("generateInvite")}
          </Button>
        </div>
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
