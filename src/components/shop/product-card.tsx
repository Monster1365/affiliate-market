import Link from "next/link";
import type { ProductCardData } from "@/lib/queries/shop";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { RocketBadge } from "./rocket-badge";

export function ProductCard({ product, priority }: { product: ProductCardData; priority?: boolean }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col gap-2 rounded-xl p-2 transition-colors hover:bg-brand-50"
    >
      <ProductImage
        src={product.imageUrl}
        alt={product.title}
        sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 45vw"
        priority={priority}
        className="transition-transform group-hover:scale-[1.02]"
      />
      <h3 className="line-clamp-2 min-h-10 text-sm leading-5 text-foreground group-hover:text-brand-700">
        {product.title}
      </h3>
      <Price price={product.price} originalPrice={product.originalPrice} discountRate={product.discountRate} />
      {product.isRocket && (
        <div>
          <RocketBadge />
        </div>
      )}
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
