/**
 * 사용자(쇼핑) 페이지용 조회 함수.
 *
 * 모두 'use cache'로 캐시되어 정적 셸에 포함되고, 관리자가 데이터를 바꾸면
 * 아래 태그로 무효화한다 (5단계 Server Action에서 updateTag 호출).
 *   - "products"   : 모든 상품 조회
 *   - "categories" : 카테고리 조회
 *   - "banners"    : 배너 조회
 */
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, count, desc, eq, ilike, ne, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { banners, categories, products } from "@/lib/db/schema";

export const CACHE_TAGS = {
  products: "products",
  categories: "categories",
  banners: "banners",
} as const;

export const PAGE_SIZE = 20;

export const SORT_OPTIONS = {
  recommended: "추천순",
  latest: "최신순",
  price_asc: "낮은 가격순",
  price_desc: "높은 가격순",
  discount: "할인율순",
} as const;

export type SortKey = keyof typeof SORT_OPTIONS;

export function parseSort(value: unknown): SortKey {
  return typeof value === "string" && value in SORT_OPTIONS ? (value as SortKey) : "recommended";
}

export function parsePage(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

/** 카드/목록에 필요한 컬럼만 조회 (캐시 크기 절약) */
const cardColumns = {
  id: products.id,
  title: products.title,
  imageUrl: products.imageUrl,
  price: products.price,
  originalPrice: products.originalPrice,
  discountRate: products.discountRate,
  isRocket: products.isRocket,
};

export type ProductCardData = {
  id: number;
  title: string;
  imageUrl: string;
  price: number;
  originalPrice: number | null;
  discountRate: number | null;
  isRocket: boolean;
};

export type ProductPage = {
  items: ProductCardData[];
  total: number;
  page: number;
  totalPages: number;
};

function orderBy(sort: SortKey): SQL[] {
  switch (sort) {
    case "latest":
      return [desc(products.createdAt), desc(products.id)];
    case "price_asc":
      return [asc(products.price), desc(products.id)];
    case "price_desc":
      return [desc(products.price), desc(products.id)];
    case "discount":
      // 할인 없는 상품(NULL)은 맨 뒤로 (Postgres DESC 기본값은 NULLS FIRST)
      return [sql`${products.discountRate} desc nulls last`, desc(products.id)];
    default:
      return [desc(products.isFeatured), asc(products.sortOrder), desc(products.id)];
  }
}

async function pagedProducts(where: SQL | undefined, sort: SortKey, page: number): Promise<ProductPage> {
  const [items, [{ total }]] = await Promise.all([
    db
      .select(cardColumns)
      .from(products)
      .where(where)
      .orderBy(...orderBy(sort))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

// ── 카테고리 ────────────────────────────────────────────

export async function getCategories() {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.categories);

  return db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAGS.categories);

  const [row] = await db
    .select({ id: categories.id, name: categories.name, slug: categories.slug })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row ?? null;
}

// ── 상품 ───────────────────────────────────────────────

export async function getFeaturedProducts(limit = 10) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  return db
    .select(cardColumns)
    .from(products)
    .where(and(eq(products.isVisible, true), eq(products.isFeatured, true)))
    .orderBy(asc(products.sortOrder), desc(products.id))
    .limit(limit);
}

/** 홈 화면 카테고리별 섹션: 카테고리마다 상위 N개 */
export async function getHomeSections(perCategory = 5) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const cats = await getCategories();
  const sections = await Promise.all(
    cats.map(async (category) => ({
      category,
      items: await db
        .select(cardColumns)
        .from(products)
        .where(and(eq(products.isVisible, true), eq(products.categoryId, category.id)))
        .orderBy(...orderBy("recommended"))
        .limit(perCategory),
    })),
  );
  return sections.filter((s) => s.items.length > 0);
}

export async function getCategoryProducts(categoryId: number, sort: SortKey, page: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  return pagedProducts(
    and(eq(products.isVisible, true), eq(products.categoryId, categoryId)),
    sort,
    page,
  );
}

/** LIKE 패턴의 와일드카드(% _ \)를 문자 그대로 검색되게 이스케이프 */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function searchProducts(query: string, sort: SortKey, page: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  return pagedProducts(
    and(eq(products.isVisible, true), ilike(products.title, `%${escapeLike(query)}%`)),
    sort,
    page,
  );
}

export async function getProduct(id: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  const [row] = await db
    .select({
      ...cardColumns,
      affiliateUrl: products.affiliateUrl,
      categoryId: products.categoryId,
      categoryName: categories.name,
      categorySlug: categories.slug,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.id, id), eq(products.isVisible, true)))
    .limit(1);
  return row ?? null;
}

export async function getRelatedProducts(productId: number, categoryId: number, limit = 5) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  return db
    .select(cardColumns)
    .from(products)
    .where(
      and(
        eq(products.isVisible, true),
        eq(products.categoryId, categoryId),
        ne(products.id, productId),
      ),
    )
    .orderBy(...orderBy("recommended"))
    .limit(limit);
}

/** generateStaticParams용: 빌드 시 미리 렌더링할 상품 (추천 상품) */
export async function getPrerenderProductIds() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.products);

  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.isVisible, true), eq(products.isFeatured, true)))
    .limit(50);
  return rows.map((r) => r.id);
}

// ── 배너 ───────────────────────────────────────────────

export async function getActiveBanners() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.banners);

  return db
    .select({
      id: banners.id,
      title: banners.title,
      imageUrl: banners.imageUrl,
      linkUrl: banners.linkUrl,
    })
    .from(banners)
    .where(eq(banners.isActive, true))
    .orderBy(asc(banners.sortOrder), desc(banners.id));
}
