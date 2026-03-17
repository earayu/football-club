"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

export function ClubTabs({ slug }: { slug: string }) {
  const pathname = usePathname();
  const isAbout = pathname.includes("/about");

  const tabs = [
    { label: "动态", href: `/club/${slug}`, active: !isAbout },
    { label: "关于", href: `/club/${slug}/about`, active: isAbout },
  ];

  return (
    <nav className="-mb-px inline-flex rounded-full border border-[rgba(15,23,42,0.06)] bg-zinc-50/90 p-1 shadow-[0_20px_40px_-32px_rgba(15,23,42,0.2)]">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`relative rounded-full px-4 py-2 text-[12px] font-semibold tracking-[0.04em] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            tab.active
              ? "bg-white text-zinc-950 shadow-[0_16px_30px_-26px_rgba(15,23,42,0.35)]"
              : "text-zinc-400 hover:text-zinc-700"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
