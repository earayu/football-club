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
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        {/* Avatar */}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-xs font-bold text-white shadow-sm">
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <svg
          className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-60 origin-top-right rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-100/80 ring-1 ring-black/[0.04] z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Profile header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
          </div>

          {/* Clubs */}
          {clubs.length > 0 && (
            <div className="border-b border-gray-50 py-1.5">
              <p className="px-4 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
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
                    <img src={club.badge_url} alt={club.name} className="h-6 w-6 rounded-full object-cover ring-1 ring-gray-100" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-[11px] font-bold text-green-700">
                      {club.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <span className="truncate font-medium">{club.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="py-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              {tp("editProfile")}
            </Link>
            {clubs.length > 1 && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                Dashboard
              </Link>
            )}
            <div className="my-1 mx-3 h-px bg-gray-100" />
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
