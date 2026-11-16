import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** 상품 등록 경로: 쿠팡 파트너스 API 가져오기 / 관리자 수동 입력 */
export const productSource = pgEnum("product_source", ["api", "manual"]);

export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 50 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 300 }).notNull(),
    imageUrl: text("image_url").notNull(),
    /** 판매가 (원) */
    price: integer("price").notNull(),
    /** 정가 (원). 할인 없으면 null */
    originalPrice: integer("original_price"),
    /** 할인율 (%) */
    discountRate: integer("discount_rate"),
    isRocket: boolean("is_rocket").notNull().default(false),
    /** 쿠팡 파트너스 제휴 링크 (사용자는 /go/[id]를 거쳐 이동) */
    affiliateUrl: text("affiliate_url").notNull(),
    /** 쿠팡 상품 ID. API로 가져온 상품의 중복 방지(upsert) 키 */
    coupangProductId: varchar("coupang_product_id", { length: 40 }).unique(),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    source: productSource("source").notNull().default("manual"),
    isVisible: boolean("is_visible").notNull().default(true),
    isFeatured: boolean("is_featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("products_category_visible_idx").on(t.categoryId, t.isVisible),
    index("products_featured_idx").on(t.isFeatured).where(sql`${t.isFeatured} = true`),
    // 상품명 부분 검색(ILIKE '%키워드%')용 trigram 인덱스. pg_trgm 확장 필요
    index("products_title_trgm_idx").using("gin", sql`${t.title} gin_trgm_ops`),
  ],
);

export const clickLogs = pgTable(
  "click_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }).notNull().defaultNow(),
    referer: text("referer"),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("click_logs_product_clicked_idx").on(t.productId, t.clickedAt),
    index("click_logs_clicked_idx").on(t.clickedAt),
  ],
);

export const banners = pgTable("banners", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 100 }).notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
});

export const adminUsers = pgTable(
  "admin_users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    ...timestamps,
  },
  // 이메일은 대소문자 구분 없이 유일
  (t) => [uniqueIndex("admin_users_email_lower_idx").on(sql`lower(${t.email})`)],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  clickLogs: many(clickLogs),
}));

export const clickLogsRelations = relations(clickLogs, ({ one }) => ({
  product: one(products, {
    fields: [clickLogs.productId],
    references: [products.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Banner = typeof banners.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
