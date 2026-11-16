import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { count, sql } from "drizzle-orm";
import { ArrowDownRight, ArrowUpRight, FolderTree, MousePointerClick, Package } from "lucide-react";
import { ClicksChart } from "@/components/admin/clicks-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { isOptimizableImage } from "@/lib/image";
import {
  STAT_RANGES,
  getCategoryClicks,
  getDailyClicks,
  getTopClickedProducts,
  parseRange,
} from "@/lib/queries/admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "대시보드" };

async function getCatalogSummary() {
  const [[productStats], [categoryStats]] = await Promise.all([
    db
      .select({
        total: count(),
        visible: sql<number>`count(*) filter (where ${products.isVisible})`.mapWith(Number),
      })
      .from(products),
    db.select({ total: count() }).from(categories),
  ]);
  return { productStats, categoryStats };
}

function Change({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="text-muted-foreground">직전 기간 클릭 없음</span>;
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground">
      <Icon className={cn("size-3.5", up ? "text-primary" : "text-sale")} aria-hidden />
      직전 기간 대비 {up ? "+" : ""}
      {pct}% ({previous.toLocaleString("ko-KR")}회)
    </span>
  );
}

/** 순위 목록용 얇은 막대 (단일 색, 최댓값 대비 길이) */
function InlineBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-muted" aria-hidden>
      <div className="h-2 rounded-full bg-primary" style={{ width: `${max ? Math.max(2, (value / max) * 100) : 0}%` }} />
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);

  const [{ productStats, categoryStats }, daily, top, byCategory] = await Promise.all([
    getCatalogSummary(),
    getDailyClicks(range),
    getTopClickedProducts(range, 10),
    getCategoryClicks(range),
  ]);
  const topMax = top[0]?.clicks ?? 0;
  const catMax = byCategory[0]?.clicks ?? 0;
  const catTotal = byCategory.reduce((sum, c) => sum + c.clicks, 0);
  const avg = daily.total / range;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        {/* 기간 선택: 차트 위 한 줄 */}
        <nav aria-label="기간" className="flex gap-1 rounded-lg bg-background p-1">
          {STAT_RANGES.map((r) => (
            <Link
              key={r}
              href={r === 30 ? "/admin" : `/admin?range=${r}`}
              aria-current={r === range ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1 text-sm",
                r === range ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
            >
              최근 {r}일
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">최근 {range}일 클릭</CardTitle>
            <MousePointerClick className="size-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{daily.total.toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs">
              <Change current={daily.total} previous={daily.previousTotal} />
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">전체 상품</CardTitle>
            <Package className="size-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{productStats.total.toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs text-muted-foreground">노출 중 {productStats.visible.toLocaleString("ko-KR")}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">카테고리</CardTitle>
            <FolderTree className="size-4 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{categoryStats.total.toLocaleString("ko-KR")}</p>
            <p className="mt-1 text-xs text-muted-foreground">쇼핑몰 메뉴에 표시</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-baseline justify-between">
          <CardTitle>일별 클릭 수</CardTitle>
          <p className="text-xs text-muted-foreground">하루 평균 {avg.toFixed(1)}회 · 한국 시간 기준 · 봇 제외</p>
        </CardHeader>
        <CardContent>
          {daily.total === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              아직 클릭이 없습니다. 쇼핑몰에서 &lsquo;쿠팡에서 구매하기&rsquo;를 누르면 여기에 집계됩니다.
            </p>
          ) : (
            <ClicksChart data={daily.series} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>많이 클릭된 상품</CardTitle>
          </CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">이 기간에 클릭된 상품이 없습니다.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {top.map((p, i) => (
                  <li key={p.id} className="grid grid-cols-[20px_40px_1fr_auto] items-center gap-3">
                    <span className="text-center text-sm font-bold text-muted-foreground tabular-nums">{i + 1}</span>
                    <div className="relative size-10 overflow-hidden rounded-md bg-muted">
                      <Image src={p.imageUrl} alt="" fill sizes="40px" unoptimized={!isOptimizableImage(p.imageUrl)} className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <Link href={`/admin/products/${p.id}`} className="truncate text-sm hover:text-primary">
                        {p.title}
                      </Link>
                      <div className="flex items-center gap-2">
                        <InlineBar value={p.clicks} max={topMax} />
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {p.categoryName ?? "미분류"}
                          {!p.isVisible && " · 숨김"}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums">{p.clicks.toLocaleString("ko-KR")}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>카테고리별 클릭</CardTitle>
          </CardHeader>
          <CardContent>
            {byCategory.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">데이터가 없습니다.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {byCategory.map((c) => (
                  <li key={c.name} className="flex flex-col gap-1">
                    <div className="flex justify-between text-sm">
                      <span>{c.name}</span>
                      <span className="font-medium tabular-nums">
                        {c.clicks.toLocaleString("ko-KR")}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          ({Math.round((c.clicks / catTotal) * 100)}%)
                        </span>
                      </span>
                    </div>
                    <InlineBar value={c.clicks} max={catMax} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
