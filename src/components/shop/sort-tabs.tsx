import Link from "next/link";
import { SORT_OPTIONS, type SortKey } from "@/lib/queries/shop";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  current: SortKey;
  /** 정렬 외에 유지할 쿼리 (예: 검색어) */
  params?: Record<string, string>;
};

export function SortTabs({ basePath, current, params = {} }: Props) {
  return (
    <nav aria-label="정렬" className="flex flex-wrap gap-1">
      {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => {
        const qs = new URLSearchParams(params);
        if (key !== "recommended") qs.set("sort", key);
        const href = qs.size ? `${basePath}?${qs}` : basePath;
        const active = key === current;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-sm transition-colors",
              active ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:bg-brand-50 hover:text-brand-700",
            )}
          >
            {SORT_OPTIONS[key]}
          </Link>
        );
      })}
    </nav>
  );
}
