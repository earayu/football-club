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
    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Invite Link</span>
      </div>

      {code && !isExpired ? (
        <div className="space-y-3">
          {/* URL display */}
          <div
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition-colors hover:border-green-300"
            onClick={handleCopy}
            title="Click to copy"
          >
            <span className="truncate text-sm text-gray-600 font-mono">
              {typeof window !== "undefined" ? getInviteUrl(code) : `…/join/${code}`}
            </span>
            <span className={`ml-3 shrink-0 text-xs font-medium ${copied ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}>
              {copied ? "✓ Copied" : "Copy"}
            </span>
          </div>

          {/* Meta + actions */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {expiresAt
                ? `Expires ${new Date(expiresAt).toLocaleDateString()}`
                : "Never expires"}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCode(null); setExpiresAt(null); }}
                className="hover:text-gray-600"
              >
                Change expiry
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="text-red-400 hover:text-red-600 disabled:opacity-50"
              >
                {revoking ? "Revoking…" : "Revoke"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isExpired && (
            <p className="text-xs text-amber-600">This invite link has expired.</p>
          )}
          <div className="flex items-center gap-2">
            <select
              value={expiresIn ?? ""}
              onChange={(e) => setExpiresIn((e.target.value || null) as ExpiresIn)}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:border-green-500 focus:outline-none"
            >
              {EXPIRES_OPTIONS.map((o) => (
                <option key={o.label} value={o.value ?? ""}>
                  {o.label}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={handleGenerate} isLoading={loading}>
              Generate
            </Button>
          </div>
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
