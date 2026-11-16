"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, FolderTree, Image as ImageIcon, LayoutDashboard, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, ready: true },
  { href: "/admin/products", label: "상품 관리", icon: Package, ready: true },
  { href: "/admin/products/import", label: "쿠팡 상품 가져오기", icon: Download, ready: true },
  { href: "/admin/categories", label: "카테고리", icon: FolderTree, ready: true },
  { href: "/admin/banners", label: "배너", icon: ImageIcon, ready: true },
];

export function AdminNav() {
  const pathname = usePathname();
  // 가장 길게 일치하는 메뉴 하나만 강조 (/admin/products/import에서 '상품 관리'까지 켜지지 않게)
  const activeHref = NAV.map((n) => n.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav aria-label="관리자 메뉴">
      <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
        {NAV.map(({ href, label, icon: Icon, ready }) => {
          const active = href === activeHref;
          const base = "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm";
          return (
            <li key={href} className="shrink-0">
              {ready ? (
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    base,
                    active
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {label}
                </Link>
              ) : (
                <span className={cn(base, "cursor-not-allowed text-sidebar-foreground/40")} aria-disabled>
                  <Icon className="size-4" aria-hidden />
                  {label}
                  <span className="rounded bg-white/10 px-1.5 text-[10px]">준비 중</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
