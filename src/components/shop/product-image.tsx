import Image from "next/image";
import { isOptimizableImage } from "@/lib/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** 정사각형 상품 이미지. 허용 호스트가 아니면 최적화 없이 원본을 표시 */
export function ProductImage({ src, alt, sizes, priority, className }: Props) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-lg bg-muted", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={!isOptimizableImage(src)}
        className="object-cover"
      />
    </div>
  );
}
