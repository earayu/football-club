import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Football Club Portal",
    template: "%s | Football Club Portal",
  },
  description: "Create a beautiful online home for your amateur football club — free, in minutes.",
  openGraph: {
    type: "website",
    siteName: "Football Club Portal",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
