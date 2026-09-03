import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechOpportunity Tanzania",
  description:
    "Find technology opportunities relevant to Tanzanian students, developers, founders, researchers and professionals.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p>Tech opportunities, presented with their source and known details.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/#opportunities" className="font-semibold hover:text-[var(--accent-strong)]">Browse</Link>
              <Link href="/submit" className="font-semibold hover:text-[var(--accent-strong)]">Submit an opportunity</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
