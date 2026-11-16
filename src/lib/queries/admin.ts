/**
 * 관리자 페이지용 조회 함수. 항상 최신 데이터를 봐야 하므로 캐시하지 않는다.
 * 호출하는 페이지에서 먼저 requireAdmin()을 호출할 것.
 */
import "server-only";
import { and, asc, count, desc, eq, ilike, isNull, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { banners, categories, clickLogs, products } from "@/lib/db/schema";

export const ADMIN_PAGE_SIZE = 30;

export type ProductFilter = {
  q?: string;
  /** 카테고리 id, 또는 "none"(미분류) */
  category?: string;
  /** "visible" | "hidden" | "featured" */
  status?: string;
  page: number;
};

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function getAdminProducts({ q, category, status, page }: ProductFilter) {
  const conditions: SQL[] = [];
  if (q) conditions.push(ilike(products.title, `%${escapeLike(q)}%`));
  if (category === "none") conditions.push(isNull(products.categoryId));
  else if (category && Number(category) > 0) conditions.push(eq(products.categoryId, Number(category)));
  if (status === "visible") conditions.push(eq(products.isVisible, true));
  if (status === "hidden") conditions.push(eq(products.isVisible, false));
  if (status === "featured") conditions.push(eq(products.isFeatured, true));
  const where = conditions.length ? and(...conditions) : undefined;

  // 최근 30일 클릭 수
  const clicks = db
    .select({ productId: clickLogs.productId, clicks: count().as("clicks") })
    .from(clickLogs)
    .where(sql`${clickLogs.clickedAt} >= now() - interval '30 days'`)
    .groupBy(clickLogs.productId)
    .as("clicks");

  const [items, [{ total }]] = await Promise.all([
    db
      .select({
        id: products.id,
        title: products.title,
        imageUrl: products.imageUrl,
        price: products.price,
        discountRate: products.discountRate,
        isRocket: products.isRocket,
        isVisible: products.isVisible,
        isFeatured: products.isFeatured,
        source: products.source,
        sortOrder: products.sortOrder,
        categoryName: categories.name,
        clicks30d: sql<number>`coalesce(${clicks.clicks}, 0)`.mapWith(Number),
        updatedAt: products.updatedAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(clicks, eq(clicks.productId, products.id))
      .where(where)
      .orderBy(desc(products.updatedAt), desc(products.id))
      .limit(ADMIN_PAGE_SIZE)
      .offset((page - 1) * ADMIN_PAGE_SIZE),
    db.select({ total: count() }).from(products).where(where),
  ]);

  return { items, total, page, totalPages: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)) };
}

export async function getAdminProduct(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function getAdminCategories() {
  const productCount = db
    .select({ categoryId: products.categoryId, n: count().as("n") })
    .from(products)
    .groupBy(products.categoryId)
    .as("pc");

  return db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      sortOrder: categories.sortOrder,
      productCount: sql<number>`coalesce(${productCount.n}, 0)`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(productCount, eq(productCount.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder), asc(categories.id));
}

export async function getAdminBanners() {
  return db.select().from(banners).orderBy(asc(banners.sortOrder), desc(banners.id));
}
