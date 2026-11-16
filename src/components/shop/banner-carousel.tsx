import Image from "next/image";
import Link from "next/link";
import { isOptimizableImage } from "@/lib/image";

type Banner = { id: number; title: string; imageUrl: string; linkUrl: string | null };

/** 배너가 없을 때 보여줄 기본 히어로 */
function DefaultHero() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 px-6 py-10 text-white sm:px-10 sm:py-14">
      <p className="text-sm font-medium text-brand-100">매일 업데이트되는 쿠팡 추천템</p>
      <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
        꼭 필요한 상품만
        <br />
        골라서 모았어요
      </h1>
      <p className="mt-3 text-sm text-brand-100">가격과 할인율을 한눈에 비교하고, 쿠팡에서 바로 구매하세요.</p>
    </div>
  );
}

/** CSS scroll-snap 기반 가로 슬라이드 (JS 없음) */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) return <DefaultHero />;

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-2xl [scrollbar-width:none]">
      {banners.map((b, i) => {
        const img = (
          <div className="relative aspect-[3/1] w-full overflow-hidden rounded-2xl bg-brand-50">
            <Image
              src={b.imageUrl}
              alt={b.title}
              fill
              sizes="(min-width: 1152px) 1120px, 100vw"
              priority={i === 0}
              unoptimized={!isOptimizableImage(b.imageUrl)}
              className="object-cover"
            />
          </div>
        );
        return (
          <div key={b.id} className="w-full shrink-0 snap-start">
            {b.linkUrl ? <Link href={b.linkUrl}>{img}</Link> : img}
          </div>
        );
      })}
    </div>
  );
}
