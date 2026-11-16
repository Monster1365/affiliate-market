import { cn } from "@/lib/utils";

/** 쿠팡 파트너스 필수 고지문 */
export const DISCLOSURE_TEXT =
  "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";

export function AffiliateDisclosure({ className }: { className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{DISCLOSURE_TEXT}</p>;
}
