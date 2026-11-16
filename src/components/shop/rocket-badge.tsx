import { Zap } from "lucide-react";

export function RocketBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-700">
      <Zap className="size-3 fill-current" aria-hidden />
      로켓배송
    </span>
  );
}
