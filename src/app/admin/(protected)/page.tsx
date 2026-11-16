import type { Metadata } from "next";
import { count, gte, sql } from "drizzle-orm";
import { FolderTree, MousePointerClick, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { categories, clickLogs, products } from "@/lib/db/schema";

export const metadata: Metadata = { title: "대시보드" };

async function getSummary() {
  const [[productStats], [categoryStats], [clickStats]] = await Promise.all([
    db
      .select({
        total: count(),
        visible: sql<number>`count(*) filter (where ${products.isVisible})`.mapWith(Number),
      })
      .from(products),
    db.select({ total: count() }).from(categories),
    db
      .select({ total: count() })
      .from(clickLogs)
      .where(gte(clickLogs.clickedAt, sql`now() - interval '7 days'`)),
  ]);
  return { productStats, categoryStats, clickStats };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const { productStats, categoryStats, clickStats } = await getSummary();

  const cards = [
    {
      title: "전체 상품",
      value: productStats.total,
      sub: `노출 중 ${productStats.visible}개`,
      icon: Package,
    },
    { title: "카테고리", value: categoryStats.total, sub: "쇼핑몰 메뉴에 표시", icon: FolderTree },
    { title: "최근 7일 클릭", value: clickStats.total, sub: "쿠팡 이동 버튼 (봇 제외)", icon: MousePointerClick },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">대시보드</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ title, value, sub, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="size-4 text-primary" aria-hidden />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{value.toLocaleString("ko-KR")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        클릭 추이와 인기 상품 통계는 7단계에서 추가됩니다.
      </p>
    </div>
  );
}
