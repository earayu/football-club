"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { logout } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";

type Club = { slug: string; name: string; badge_url: string | null };

export function UserMenu({
  displayName,
  email,
  initial,
  clubs,
}: {
  displayName: string;
  email: string;
  initial: string;
  clubs: Club[];
}) {
  const t = useTranslations("common");
  const tp = useTranslations("profile");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
          {initial}
        </span>
        <span className="hidden sm:inline">{displayName}</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black/5 z-50">
          {/* User info header */}
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{email}</p>
          </div>

          {/* Clubs */}
          {clubs.length > 0 && (
            <div className="border-b border-gray-100 py-1">
              <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                My Clubs
              </p>
              {clubs.map((club) => (
                <Link
                  key={club.slug}
                  href={`/club/${club.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {club.badge_url ? (
                    <img
                      src={club.badge_url}
                      alt={club.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs">
                      ⚽
                    </span>
                  )}
                  <span className="truncate">{club.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="text-base">👤</span>
              {tp("editProfile")}
            </Link>
            {clubs.length > 1 && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-base">🏠</span>
                Dashboard
              </Link>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <span className="text-base">🚪</span>
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
