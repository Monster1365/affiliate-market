import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string>;
};

function pageHref(basePath: string, params: Record<string, string>, page: number) {
  const qs = new URLSearchParams(params);
  if (page > 1) qs.set("page", String(page));
  return qs.size ? `${basePath}?${qs}` : basePath;
}

/** 현재 페이지 주변 최대 5개 번호를 보여주는 페이지네이션 */
export function Pagination({ basePath, page, totalPages, params = {} }: Props) {
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  const linkClass = "flex size-9 items-center justify-center rounded-lg text-sm";

  return (
    <nav aria-label="페이지" className="mt-10 flex justify-center gap-1">
      {page > 1 && (
        <Link href={pageHref(basePath, params, page - 1)} aria-label="이전 페이지" className={cn(linkClass, "hover:bg-brand-50")}>
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={pageHref(basePath, params, p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(linkClass, p === page ? "bg-primary font-bold text-primary-foreground" : "hover:bg-brand-50")}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={pageHref(basePath, params, page + 1)} aria-label="다음 페이지" className={cn(linkClass, "hover:bg-brand-50")}>
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
