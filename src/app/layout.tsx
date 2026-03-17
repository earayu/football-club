import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Football Club Portal", template: "%s | Football Club Portal" },
  description: "Build a beautiful home for your amateur football club — free.",
  openGraph: { type: "website", siteName: "Football Club Portal" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body className="font-[family-name:var(--font-outfit)] antialiased">{children}</body>
    </html>
  );
}
