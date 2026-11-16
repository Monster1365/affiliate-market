import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { CoupangImport } from "@/components/admin/coupang-import";
import { PageHeader } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/admin/session";
import { getHourlyUsage, isCoupangConfigured } from "@/lib/coupang";
import { getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "쿠팡 상품 가져오기" };

function NotConfigured() {
  return (
    <div className="flex max-w-2xl flex-col gap-3 rounded-xl border bg-background p-6">
      <div className="flex items-center gap-2 font-bold">
        <KeyRound className="size-5 text-primary" aria-hidden />
        쿠팡 파트너스 API 키가 필요합니다
      </div>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
        <li>쿠팡 파트너스 → 도움말 → Open API에서 Access Key와 Secret Key를 발급받습니다.</li>
        <li>
          환경변수 <code className="rounded bg-muted px-1">COUPANG_ACCESS_KEY</code>,{" "}
          <code className="rounded bg-muted px-1">COUPANG_SECRET_KEY</code>에 넣습니다 (로컬은 .env.local, 배포는 Vercel 환경변수).
        </li>
        <li>서버를 다시 시작하거나 다시 배포하면 이 화면에서 쿠팡 상품을 검색할 수 있습니다.</li>
      </ol>
      <p className="text-sm">
        키가 없는 동안에는{" "}
        <Link href="/admin/products/new" className="text-primary underline">
          상품 직접 등록
        </Link>
        으로 쿠팡 파트너스 링크를 넣어 등록할 수 있습니다.
      </p>
    </div>
  );
}

export default async function CoupangImportPage() {
  await requireAdmin();
  const configured = isCoupangConfigured();
  const [categories, usage] = await Promise.all([
    getAdminCategories(),
    configured ? getHourlyUsage() : Promise.resolve(null),
  ]);

  return (
    <div>
      <PageHeader title="쿠팡 상품 가져오기" description="쿠팡 파트너스 API로 상품을 검색해 골라서 등록합니다." />
      {configured && usage ? <CoupangImport categories={categories} initialUsage={usage} /> : <NotConfigured />}
    </div>
  );
}
