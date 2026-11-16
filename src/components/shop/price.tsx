import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  price: number;
  originalPrice: number | null;
  discountRate: number | null;
  size?: "sm" | "lg";
};

export function Price({ price, originalPrice, discountRate, size = "sm" }: Props) {
  const hasDiscount = !!originalPrice && originalPrice > price;
  return (
    <div className="flex flex-col">
      {hasDiscount && (
        <span className={cn("text-muted-foreground line-through", size === "lg" ? "text-sm" : "text-xs")}>
          {formatPrice(originalPrice)}
        </span>
      )}
      <div className="flex items-baseline gap-1.5">
        {hasDiscount && discountRate ? (
          <span className={cn("font-bold text-sale", size === "lg" ? "text-2xl" : "text-base")}>
            {discountRate}%
          </span>
        ) : null}
        <span className={cn("font-bold text-foreground", size === "lg" ? "text-3xl" : "text-base")}>
          {formatPrice(price)}
        </span>
      </div>
    </div>
  );
}
