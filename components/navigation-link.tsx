"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Shared active state for desktop and mobile without moving auth client-side. */
export function NavigationLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
  return <Link href={href} className="nav-link" aria-current={active ? "page" : undefined}>{children}</Link>;
}
