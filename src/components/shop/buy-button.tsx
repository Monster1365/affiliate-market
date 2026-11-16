import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 쿠팡 구매 버튼. /go/[id]를 거쳐 클릭을 기록한 뒤 제휴 링크로 이동한다.
 * next/link를 쓰지 않는 이유: 프리페치가 클릭으로 기록되지 않도록.
 */
export function BuyButton({ productId, className }: { productId: number; className?: string }) {
  return (
    <a
      href={`/go/${productId}`}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
    >
      쿠팡에서 구매하기
      <ExternalLink className="size-4" aria-hidden />
    </a>
  );
}
