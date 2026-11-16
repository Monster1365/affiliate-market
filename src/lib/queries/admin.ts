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

// ── 대시보드 통계 ─────────────────────────────────────────

export const STAT_RANGES = [7, 30, 90] as const;
export type StatRange = (typeof STAT_RANGES)[number];

export function parseRange(value: unknown): StatRange {
  const n = Number(value);
  return (STAT_RANGES as readonly number[]).includes(n) ? (n as StatRange) : 30;
}

/**
 * 한국 시간 기준 일별 클릭 수 (클릭 없는 날은 0으로 채움) + 직전 같은 기간 합계.
 * 봇 클릭은 /go에서 이미 기록하지 않는다.
 */
export async function getDailyClicks(days: StatRange) {
  const rows = await db.execute<{ day: string; clicks: number }>(sql`
    with days as (
      select generate_series(
        (now() at time zone 'Asia/Seoul')::date - ${days - 1}::int,
        (now() at time zone 'Asia/Seoul')::date,
        interval '1 day'
      )::date as day
    )
    select to_char(d.day, 'YYYY-MM-DD') as day, count(c.id)::int as clicks
    from days d
    left join ${clickLogs} c on (c.clicked_at at time zone 'Asia/Seoul')::date = d.day
    group by d.day
    order by d.day
  `);

  const [prev] = await db
    .select({ clicks: count() })
    .from(clickLogs)
    .where(
      sql`(${clickLogs.clickedAt} at time zone 'Asia/Seoul')::date
        between (now() at time zone 'Asia/Seoul')::date - ${days * 2 - 1}::int
            and (now() at time zone 'Asia/Seoul')::date - ${days}::int`,
    );

  const series = rows.rows.map((r) => ({ day: r.day, clicks: Number(r.clicks) }));
  return {
    series,
    total: series.reduce((sum, d) => sum + d.clicks, 0),
    previousTotal: prev.clicks,
  };
}

/** 기간 내 클릭이 많은 상품 */
export async function getTopClickedProducts(days: StatRange, limit = 10) {
  return db
    .select({
      id: products.id,
      title: products.title,
      imageUrl: products.imageUrl,
      isVisible: products.isVisible,
      categoryName: categories.name,
      clicks: count(clickLogs.id),
    })
    .from(clickLogs)
    .innerJoin(products, eq(clickLogs.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(sql`${clickLogs.clickedAt} >= now() - make_interval(days => ${days}::int)`)
    .groupBy(products.id, categories.name)
    .orderBy(desc(count(clickLogs.id)), asc(products.id))
    .limit(limit);
}

/** 기간 내 카테고리별 클릭 수 */
export async function getCategoryClicks(days: StatRange) {
  return db
    .select({
      name: sql<string>`coalesce(${categories.name}, '미분류')`,
      clicks: count(clickLogs.id),
    })
    .from(clickLogs)
    .innerJoin(products, eq(clickLogs.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(sql`${clickLogs.clickedAt} >= now() - make_interval(days => ${days}::int)`)
    .groupBy(categories.name)
    .orderBy(desc(count(clickLogs.id)));
}
