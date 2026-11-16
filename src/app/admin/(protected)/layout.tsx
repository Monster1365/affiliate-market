import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/admin/session";

/** 세션을 읽어 권한을 확인한 뒤 사이드바와 페이지를 그린다 */
async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <>
      <AdminSidebar admin={admin} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </>
  );
}

function AdminShellSkeleton() {
  return (
    <>
      <div className="h-24 bg-sidebar md:h-dvh md:w-60" aria-hidden />
      <div className="flex-1 p-4 md:p-8" aria-hidden>
        <div className="h-8 w-40 animate-pulse rounded bg-background" />
      </div>
    </>
  );
}

export default function ProtectedAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* 세션(쿠키)은 요청 시점에만 읽을 수 있으므로 Suspense 안에서 확인 */}
      <Suspense fallback={<AdminShellSkeleton />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
