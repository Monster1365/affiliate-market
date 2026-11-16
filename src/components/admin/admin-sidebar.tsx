import Link from "next/link";
import { ExternalLink, LogOut, ShoppingBag } from "lucide-react";
import { logout } from "@/lib/actions/auth";
import type { CurrentAdmin } from "@/lib/admin/session";
import { SITE } from "@/lib/site";
import { AdminNav } from "./admin-nav";

export function AdminSidebar({ admin }: { admin: CurrentAdmin }) {
  return (
    <aside className="flex shrink-0 flex-col gap-4 bg-sidebar p-3 text-sidebar-foreground md:sticky md:top-0 md:h-dvh md:w-60 md:gap-6 md:p-4">
      <div className="flex items-center justify-between md:block">
        <Link href="/admin" className="flex items-center gap-2 px-1 text-white">
          <ShoppingBag className="size-5" aria-hidden />
          <span className="text-lg font-bold">{SITE.name}</span>
          <span className="text-xs text-sidebar-foreground/70">관리자</span>
        </Link>
        {/* 모바일: 상단 오른쪽 로그아웃 */}
        <form action={logout} className="md:hidden">
          <button type="submit" className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-sidebar-accent">
            <LogOut className="size-3.5" aria-hidden />
            로그아웃
          </button>
        </form>
      </div>

      <AdminNav />

      <div className="mt-auto hidden flex-col gap-2 border-t border-sidebar-border pt-4 md:flex">
        <div className="px-1">
          <p className="text-sm font-medium text-white">{admin.name}</p>
          <p className="truncate text-xs text-sidebar-foreground/70">{admin.email}</p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
        >
          <ExternalLink className="size-4" aria-hidden />
          쇼핑몰 보기
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" aria-hidden />
            로그아웃
          </button>
        </form>
      </div>
    </aside>
  );
}
