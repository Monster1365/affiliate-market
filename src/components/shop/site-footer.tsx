import { AffiliateDisclosure } from "./affiliate-disclosure";
import { SITE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-muted">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8">
        <p className="text-sm font-bold text-brand-900">{SITE.name} {SITE.nameKo}</p>
        <AffiliateDisclosure />
        <p className="text-xs text-muted-foreground">
          상품 가격과 배송 정보는 쿠팡 판매 페이지 기준이며, 실제와 다를 수 있습니다.
        </p>
      </div>
    </footer>
  );
}
