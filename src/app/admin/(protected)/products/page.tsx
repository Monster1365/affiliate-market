import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DeleteForm } from "@/components/admin/delete-form";
import { selectClass } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleForm } from "@/components/admin/toggle-form";
import { Pagination } from "@/components/shop/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct, toggleProduct } from "@/lib/actions/products";
import { requireAdmin } from "@/lib/admin/session";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import { getAdminCategories, getAdminProducts } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "상품 관리" };

const SAVED_MESSAGES: Record<string, string> = {
  created: "상품을 등록했습니다.",
  updated: "상품을 저장했습니다.",
  deleted: "상품을 삭제했습니다.",
};

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v.trim() : "");

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const filter = {
    q: str(sp.q).slice(0, 100),
    category: str(sp.category),
    status: str(sp.status),
    page: Math.max(1, Number(str(sp.page)) || 1),
  };

  const [result, categories] = await Promise.all([getAdminProducts(filter), getAdminCategories()]);
  const keep = Object.fromEntries(
    Object.entries({ q: filter.q, category: filter.category, status: filter.status }).filter(([, v]) => v),
  );
  const saved = SAVED_MESSAGES[str(sp.saved)];

  return (
    <div>
      <PageHeader title="상품 관리" description={`전체 ${result.total.toLocaleString("ko-KR")}개`}>
        <Button asChild size="lg" className="h-9">
          <Link href="/admin/products/new">
            <Plus aria-hidden />
            상품 등록
          </Link>
        </Button>
      </PageHeader>

      {saved && (
        <p role="status" className="mb-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-700">
          {saved}
        </p>
      )}

      <form className="mb-4 grid gap-2 rounded-xl border bg-background p-3 sm:grid-cols-[1fr_160px_140px_auto]">
        <Input name="q" defaultValue={filter.q} placeholder="상품명 검색" aria-label="상품명 검색" />
        <select name="category" defaultValue={filter.category} className={selectClass} aria-label="카테고리">
          <option value="">전체 카테고리</option>
          <option value="none">미분류</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filter.status} className={selectClass} aria-label="상태">
          <option value="">전체 상태</option>
          <option value="visible">노출 중</option>
          <option value="hidden">숨김</option>
          <option value="featured">MD 추천</option>
        </select>
        <Button type="submit" variant="secondary">
          검색
        </Button>
      </form>

      <div className="overflow-x-auto rounded-xl border bg-background">
        <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">상품</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead className="text-right">판매가</TableHead>
              <TableHead className="text-right" title="최근 30일 쿠팡 이동 클릭">클릭(30일)</TableHead>
              <TableHead>노출</TableHead>
              <TableHead>추천</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  조건에 맞는 상품이 없습니다.
                </TableCell>
              </TableRow>
            )}
            {result.items.map((p) => (
              <TableRow key={p.id} className={p.isVisible ? undefined : "bg-muted/50"}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                      <Image
                        src={p.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        unoptimized={!isOptimizableImage(p.imageUrl)}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="line-clamp-2 font-medium whitespace-normal hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <div className="mt-1 flex gap-1">
                        <Badge variant={p.source === "api" ? "default" : "outline"} className="h-4 px-1.5 text-[10px]">
                          {p.source === "api" ? "API" : "직접 등록"}
                        </Badge>
                        {p.isRocket && (
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                            로켓
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.categoryName ?? "미분류"}</TableCell>
                <TableCell className="text-right">
                  {p.discountRate ? <span className="mr-1 text-xs font-bold text-sale">{p.discountRate}%</span> : null}
                  {formatPrice(p.price)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{p.clicks30d.toLocaleString("ko-KR")}</TableCell>
                <TableCell>
                  <ToggleForm
                    action={toggleProduct}
                    fields={{ id: p.id, field: "isVisible" }}
                    on={p.isVisible}
                    onLabel="노출"
                    offLabel="숨김"
                  />
                </TableCell>
                <TableCell>
                  <ToggleForm
                    action={toggleProduct}
                    fields={{ id: p.id, field: "isFeatured" }}
                    on={p.isFeatured}
                    onLabel="추천"
                    offLabel="일반"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/product/${p.id}`} target="_blank" className="rounded-md px-2 py-1 text-xs hover:bg-muted">
                      보기
                    </Link>
                    <Link href={`/admin/products/${p.id}`} className="rounded-md px-2 py-1 text-xs text-primary hover:bg-brand-50">
                      수정
                    </Link>
                    <DeleteForm
                      action={deleteProduct}
                      id={p.id}
                      message={`'${p.title}' 상품을 삭제할까요?\n클릭 기록도 함께 삭제됩니다. 잠시 숨기려면 '노출'을 끄세요.`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination basePath="/admin/products" page={result.page} totalPages={result.totalPages} params={keep} />
    </div>
  );
}
