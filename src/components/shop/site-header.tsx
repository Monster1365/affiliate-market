import Link from "next/link";
import { Search, ShoppingBag } from "lucide-react";
import { getCategories } from "@/lib/queries/shop";
import { SITE } from "@/lib/site";

export function SearchForm({ defaultValue = "", className = "" }: { defaultValue?: string; className?: string }) {
  return (
    <form action="/search" role="search" className={`relative ${className}`}>
      <label htmlFor="site-search" className="sr-only">
        상품 검색
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="찾고 싶은 상품을 검색해 보세요"
        className="h-10 w-full rounded-full border-0 bg-white pr-11 pl-4 text-sm text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-brand-100"
      />
      <button
        type="submit"
        aria-label="검색"
        className="absolute top-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-brand-700"
      >
        <Search className="size-4" aria-hidden />
      </button>
    </form>
  );
}

export async function SiteHeader() {
  const categories = await getCategories();

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:flex-nowrap">
        <Link href="/" className="flex shrink-0 items-center gap-1.5" aria-label={`${SITE.nameKo} 홈`}>
          <ShoppingBag className="size-5" aria-hidden />
          <span className="text-xl font-bold tracking-wide">{SITE.name}</span>
          <span className="text-xs text-brand-100">{SITE.nameKo}</span>
        </Link>
        <SearchForm className="order-last w-full sm:order-none sm:max-w-md sm:flex-1" />
      </div>
      <nav aria-label="카테고리" className="border-t border-white/15 bg-brand-700">
        <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-1.5 text-sm [scrollbar-width:none]">
          {categories.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link
                href={`/category/${c.slug}`}
                className="block rounded-full px-3 py-1 text-white/90 hover:bg-white/15 hover:text-white"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
