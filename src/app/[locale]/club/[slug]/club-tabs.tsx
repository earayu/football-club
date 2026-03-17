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
    <nav className="flex gap-0 -mb-px">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`relative px-1 mr-6 pb-3 text-[13px] font-semibold tracking-wide transition-colors ${
            tab.active
              ? "text-zinc-900"
              : "text-zinc-400 hover:text-zinc-600"
          }`}
        >
          {tab.label}
          {tab.active && (
            <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-zinc-900" />
          )}
        </Link>
      ))}
    </nav>
  );
}
