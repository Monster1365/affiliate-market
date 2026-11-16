import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/shop/empty-state";
import { Pagination } from "@/components/shop/pagination";
import { ProductGrid } from "@/components/shop/product-card";
import { SearchForm } from "@/components/shop/site-header";
import { PageSkeleton } from "@/components/shop/skeletons";
import { SortTabs } from "@/components/shop/sort-tabs";
import { parsePage, parseSort, searchProducts } from "@/lib/queries/shop";

export const metadata: Metadata = {
  title: "검색",
  // 검색 결과 페이지는 검색엔진 색인에서 제외
  robots: { index: false, follow: true },
};

async function SearchContent({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 50);
  const sort = parseSort(sp.sort);
  const page = parsePage(sp.page);

  if (!q) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="mb-4 text-2xl font-bold">상품 검색</h1>
        <div className="rounded-full bg-primary p-1">
          <SearchForm />
        </div>
      </div>
    );
  }

  const result = await searchProducts(q, sort, page);
  const keep: Record<string, string> = { q, ...(sort === "recommended" ? {} : { sort }) };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">
          <span className="text-primary">&lsquo;{q}&rsquo;</span> 검색 결과
          <span className="ml-2 text-base font-normal text-muted-foreground">{result.total}개</span>
        </h1>
        {result.total > 0 && <SortTabs basePath="/search" current={sort} params={{ q }} />}
      </div>

      {result.items.length ? (
        <>
          <ProductGrid products={result.items} />
          <Pagination basePath="/search" page={result.page} totalPages={result.totalPages} params={keep} />
        </>
      ) : (
        <EmptyState title="검색 결과가 없어요" description="다른 검색어로 다시 찾아보세요." />
      )}
    </div>
  );
}

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchContent {...props} />
    </Suspense>
  );
}
