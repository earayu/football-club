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
    <div className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <nav className="flex gap-0">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                tab.active
                  ? "text-green-600"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {tab.label}
              {tab.active && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-green-600" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
