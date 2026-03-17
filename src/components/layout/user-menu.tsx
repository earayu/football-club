"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { logout } from "@/lib/actions/auth";
import { useTranslations } from "next-intl";
import {
  User,
  SquaresFour,
  SignOut,
  CaretDown,
} from "@phosphor-icons/react";

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
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
      >
        {/* Avatar */}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">{displayName}</span>
        <CaretDown
          size={12}
          weight="bold"
          className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)]">
          {/* Profile header */}
          <div className="flex items-center gap-3 bg-zinc-50/80 px-4 py-3.5 border-b border-slate-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-700 text-sm font-bold text-white">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 leading-tight">{displayName}</p>
              <p className="truncate text-xs text-zinc-400">{email}</p>
            </div>
          </div>

          {/* Clubs */}
          {clubs.length > 0 && (
            <div className="border-b border-slate-100 py-1.5">
              <p className="px-4 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                My Clubs
              </p>
              {clubs.map((club) => (
                <Link
                  key={club.slug}
                  href={`/club/${club.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
                >
                  {club.badge_url ? (
                    <img src={club.badge_url} alt={club.name} className="h-6 w-6 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-green-100 text-[11px] font-bold text-green-700">
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
              className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
            >
              <User size={15} className="text-zinc-400" />
              {tp("editProfile")}
            </Link>
            {clubs.length > 1 && (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                <SquaresFour size={15} className="text-zinc-400" />
                Dashboard
              </Link>
            )}
            <div className="mx-3 my-1 h-px bg-slate-100" />
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
              >
                <SignOut size={15} />
                {t("logout")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
