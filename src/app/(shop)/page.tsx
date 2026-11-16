import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BannerCarousel } from "@/components/shop/banner-carousel";
import { JsonLd } from "@/components/shop/json-ld";
import { ProductGrid } from "@/components/shop/product-card";
import { getActiveBanners, getFeaturedProducts, getHomeSections } from "@/lib/queries/shop";
import { SITE, siteUrl } from "@/lib/site";

export default async function HomePage() {
  const [banners, featured, sections] = await Promise.all([
    getActiveBanners(),
    getFeaturedProducts(10),
    getHomeSections(5),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.nameKo,
          alternateName: SITE.name,
          url: `${siteUrl()}/`,
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl()}/search?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <BannerCarousel banners={banners} />

      {featured.length > 0 && (
        <section aria-labelledby="featured-title">
          <h2 id="featured-title" className="mb-4 text-xl font-bold">
            <span className="text-primary">MD</span> 추천 상품
          </h2>
          <ProductGrid products={featured} priorityCount={banners.length ? 0 : 5} />
        </section>
      )}

      {sections.map(({ category, items }) => (
        <section key={category.id} aria-labelledby={`cat-${category.id}`}>
          <div className="mb-4 flex items-center justify-between">
            <h2 id={`cat-${category.id}`} className="text-xl font-bold">
              {category.name}
            </h2>
            <Link
              href={`/category/${category.slug}`}
              className="flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              더보기
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
          <ProductGrid products={items} />
        </section>
      ))}
    </div>
  );
}
