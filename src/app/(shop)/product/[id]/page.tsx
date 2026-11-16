import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChevronRight } from "lucide-react";
import { AffiliateDisclosure } from "@/components/shop/affiliate-disclosure";
import { BuyButton } from "@/components/shop/buy-button";
import { Price } from "@/components/shop/price";
import { ProductGrid } from "@/components/shop/product-card";
import { ProductImage } from "@/components/shop/product-image";
import { RocketBadge } from "@/components/shop/rocket-badge";
import { ProductGridSkeleton } from "@/components/shop/skeletons";
import { getPrerenderProductIds, getProduct, getRelatedProducts } from "@/lib/queries/shop";

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function loadProduct(raw: string) {
  const id = parseId(raw);
  const product = id ? await getProduct(id) : null;
  if (!product) notFound();
  return product;
}

export async function generateStaticParams() {
  const ids = await getPrerenderProductIds();
  // Cache Components에서는 최소 1개가 필요. 없으면 placeholder (페이지에서 404)
  return ids.length ? ids.map((id) => ({ id: String(id) })) : [{ id: "0" }];
}

export async function generateMetadata({ params }: PageProps<"/product/[id]">): Promise<Metadata> {
  const { id } = await params;
  const parsed = parseId(id);
  const product = parsed ? await getProduct(parsed) : null;
  if (!product) return { title: "상품을 찾을 수 없습니다" };
  return {
    title: product.title,
    description: `${product.title} - 쿠팡 최저가와 할인 정보를 확인하세요.`,
    alternates: { canonical: `/product/${product.id}` },
    openGraph: { title: product.title, images: [product.imageUrl] },
  };
}

async function ProductDetail({ params }: Pick<PageProps<"/product/[id]">, "params">) {
  const { id } = await params;
  const product = await loadProduct(id);

  return (
    <>
      {product.categoryName && product.categorySlug && (
        <nav aria-label="경로" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <Link href={`/category/${product.categorySlug}`} className="hover:text-primary">
            {product.categoryName}
          </Link>
        </nav>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <ProductImage src={product.imageUrl} alt={product.title} sizes="(min-width: 768px) 560px, 100vw" priority />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            {product.isRocket && (
              <div>
                <RocketBadge />
              </div>
            )}
            <h1 className="text-xl leading-snug font-bold sm:text-2xl">{product.title}</h1>
          </div>

          <div className="rounded-xl bg-brand-50 p-5">
            <Price
              price={product.price}
              originalPrice={product.originalPrice}
              discountRate={product.discountRate}
              size="lg"
            />
          </div>

          <BuyButton productId={product.id} className="w-full" />

          <div className="flex flex-col gap-1.5 rounded-lg border p-4">
            <AffiliateDisclosure />
            <p className="text-xs text-muted-foreground">
              가격·재고·배송 정보는 변동될 수 있으며, 정확한 정보는 쿠팡 판매 페이지에서 확인해 주세요.
            </p>
          </div>
        </div>
      </div>

      {product.categoryId && (
        <section aria-labelledby="related-title" className="mt-14">
          <h2 id="related-title" className="mb-4 text-xl font-bold">
            같은 카테고리 상품
          </h2>
          <Suspense fallback={<ProductGridSkeleton count={5} />}>
            <RelatedProducts productId={product.id} categoryId={product.categoryId} />
          </Suspense>
        </section>
      )}
    </>
  );
}

async function RelatedProducts({ productId, categoryId }: { productId: number; categoryId: number }) {
  const items = await getRelatedProducts(productId, categoryId, 5);
  if (!items.length) return <p className="text-sm text-muted-foreground">같은 카테고리의 다른 상품이 아직 없어요.</p>;
  return <ProductGrid products={items} />;
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2" aria-hidden>
      <div className="aspect-square animate-pulse rounded-lg bg-muted" />
      <div className="flex flex-col gap-4">
        <div className="h-8 w-4/5 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function ProductPage(props: PageProps<"/product/[id]">) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <Suspense fallback={<DetailSkeleton />}>
        <ProductDetail params={props.params} />
      </Suspense>
    </div>
  );
}
