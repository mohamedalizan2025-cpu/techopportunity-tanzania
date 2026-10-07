import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { BottomNavigation } from "@/components/bottom-navigation";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://techopportunity-tanzania.vercel.app"),
  title: "Tech Opportunity",
  description:
    "Opportunities worth acting on for Tanzania’s emerging talent. Check source evidence, find relevant opportunities and track your application progress.",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Tech Opportunity" },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1F33",
};

// Explicit prop type: LayoutProps<"/"> is a build-generated global from
// .next/types/routes.d.ts, which does not exist on a fresh CI checkout —
// using it makes tsc pass locally but fail in the Discovery sync workflow.
interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
        >
          Skip to content
        </a>
        <SiteHeader />
        {children}
        <footer className="border-t border-[var(--line)] bg-[var(--surface)]">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 text-sm sm:grid-cols-2 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="font-semibold text-[var(--foreground)]">
                Tech Opportunity
              </p>
              <p className="mt-2 leading-6 text-[var(--muted)]">
                Opportunities worth acting on — for Tanzania’s emerging talent.
              </p>
            </div>
            <nav aria-label="Product">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                Product
              </p>
              <ul className="mt-3 space-y-1">
                <li><Link href="/#opportunities" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Explore</Link></li>
                <li><Link href="/for-you" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">AI Match</Link></li>
                <li><Link href="/activity" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Activity</Link></li>
                <li><Link href="/ask" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Ask AI</Link></li>
              </ul>
            </nav>
            <nav aria-label="For organizations">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                For organizations
              </p>
              <ul className="mt-3 space-y-1">
                <li><Link href="/submit" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Submit opportunity</Link></li>
                <li><Link href="/organizations" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Organizations</Link></li>
              </ul>
            </nav>
            <nav aria-label="Trust">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                Trust
              </p>
              <ul className="mt-3 space-y-1">
                <li><Link href="/#trust-heading" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">How evidence works</Link></li>
                <li><Link href="/privacy" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Privacy</Link></li>
                <li><Link href="/terms" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Terms</Link></li>
                <li><Link href="/contact" className="inline-flex min-h-11 items-center font-medium text-[var(--muted)] hover:text-[var(--primary-text)]">Contact</Link></li>
              </ul>
            </nav>
          </div>
        </footer>
        <BottomNavigation />
        <PwaRegister />
      </body>
    </html>
  );
}
