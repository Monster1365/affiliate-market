import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/shop/empty-state";
import { Pagination } from "@/components/shop/pagination";
import { ProductGrid } from "@/components/shop/product-card";
import { PageSkeleton } from "@/components/shop/skeletons";
import { SortTabs } from "@/components/shop/sort-tabs";
import {
  getCategories,
  getCategoryBySlug,
  getCategoryProducts,
  parsePage,
  parseSort,
} from "@/lib/queries/shop";

export async function generateStaticParams() {
  const categories = await getCategories();
  // Cache Components에서는 최소 1개가 필요. 카테고리가 없으면 placeholder (페이지에서 404)
  return categories.length ? categories.map((c) => ({ slug: c.slug })) : [{ slug: "__placeholder__" }];
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "카테고리를 찾을 수 없습니다" };
  return {
    title: category.name,
    description: `쿠팡 ${category.name} 인기 상품을 가격·할인율순으로 비교해 보세요.`,
    alternates: { canonical: `/category/${category.slug}` },
  };
}

async function CategoryContent({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const sort = parseSort(sp.sort);
  const page = parsePage(sp.page);
  const result = await getCategoryProducts(category.id, sort, page);
  const basePath = `/category/${category.slug}`;
  const keep: Record<string, string> = sort === "recommended" ? {} : { sort };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-bold">
          {category.name}
          <span className="ml-2 text-base font-normal text-muted-foreground">{result.total}개</span>
        </h1>
        <SortTabs basePath={basePath} current={sort} />
      </div>

      {result.items.length ? (
        <>
          <ProductGrid products={result.items} priorityCount={5} />
          <Pagination basePath={basePath} page={result.page} totalPages={result.totalPages} params={keep} />
        </>
      ) : (
        <EmptyState title="아직 등록된 상품이 없어요" description="곧 좋은 상품으로 채워둘게요." />
      )}
    </div>
  );
}

export default function CategoryPage(props: PageProps<"/category/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <CategoryContent {...props} />
    </Suspense>
  );
}
