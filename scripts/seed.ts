/**
 * 개발용 시드: 카테고리 + 샘플 상품.
 * 실행: npm run db:seed  (여러 번 실행해도 중복되지 않음)
 *
 * 샘플 상품은 실제 쿠팡 상품이 아닙니다. 제목에 [샘플]이 붙고
 * coupang_product_id가 "sample-"로 시작하므로 나중에 한 번에 지울 수 있습니다:
 *   DELETE FROM products WHERE coupang_product_id LIKE 'sample-%';
 */
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema";

config({ path: ".env.local", quiet: true });

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const { categories, products } = schema;

const CATEGORIES = [
  { name: "가전디지털", slug: "digital" },
  { name: "주방용품", slug: "kitchen" },
  { name: "생활용품", slug: "living" },
  { name: "식품", slug: "food" },
  { name: "뷰티", slug: "beauty" },
  { name: "패션", slug: "fashion" },
  { name: "스포츠/레저", slug: "sports" },
  { name: "유아동", slug: "kids" },
];

type Sample = {
  title: string;
  category: string;
  price: number;
  originalPrice?: number;
  isRocket?: boolean;
  isFeatured?: boolean;
};

const SAMPLES: Sample[] = [
  { title: "무선 블루투스 이어폰 노이즈캔슬링", category: "digital", price: 39900, originalPrice: 59000, isRocket: true, isFeatured: true },
  { title: "27인치 QHD 모니터 IPS 165Hz", category: "digital", price: 249000, originalPrice: 299000, isRocket: true },
  { title: "고속 충전 보조배터리 20000mAh", category: "digital", price: 24900, isRocket: true },
  { title: "스테인리스 프라이팬 28cm", category: "kitchen", price: 32900, originalPrice: 45000, isFeatured: true },
  { title: "에어프라이어 5.5L 대용량", category: "kitchen", price: 69000, originalPrice: 89000, isRocket: true },
  { title: "도톰한 3겹 화장지 30롤", category: "living", price: 18900, isRocket: true, isFeatured: true },
  { title: "대용량 세탁세제 4L 2개입", category: "living", price: 21900, originalPrice: 27800 },
  { title: "제주 삼다수 2L 12병", category: "food", price: 11900, isRocket: true },
  { title: "견과류 하루한줌 50봉", category: "food", price: 29900, originalPrice: 39900, isFeatured: true },
  { title: "수분 크림 100ml 민감성", category: "beauty", price: 19800, originalPrice: 28000 },
  { title: "남성 기본 라운드 반팔티 3팩", category: "fashion", price: 22900, isRocket: true },
  { title: "요가매트 10mm 논슬립", category: "sports", price: 15900, originalPrice: 22000, isFeatured: true },
  { title: "유아 원목 블록 놀이세트", category: "kids", price: 34900, originalPrice: 42000 },
];

function placeholderImage(text: string) {
  // 상품 이미지 대체용 플레이스홀더 (3단계에서 next/image remotePatterns에 등록)
  return `https://placehold.co/600x600/eff6ff/2563eb/png?text=${encodeURIComponent(text)}`;
}

async function main() {
  // 1) 카테고리 upsert (slug 기준)
  const cats = await db
    .insert(categories)
    .values(CATEGORIES.map((c, i) => ({ ...c, sortOrder: i })))
    .onConflictDoUpdate({
      target: categories.slug,
      set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order` },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const catId = new Map(cats.map((c) => [c.slug, c.id]));
  console.log(`카테고리 ${cats.length}개 반영`);

  // 2) 샘플 상품 upsert (coupang_product_id = sample-N 기준)
  const rows = SAMPLES.map((s, i) => ({
    title: `[샘플] ${s.title}`,
    imageUrl: placeholderImage(`Sample ${i + 1}`),
    price: s.price,
    originalPrice: s.originalPrice ?? null,
    discountRate: s.originalPrice
      ? Math.round((1 - s.price / s.originalPrice) * 100)
      : null,
    isRocket: s.isRocket ?? false,
    isFeatured: s.isFeatured ?? false,
    affiliateUrl: "https://www.coupang.com/",
    coupangProductId: `sample-${i + 1}`,
    categoryId: catId.get(s.category)!,
    source: "manual" as const,
    sortOrder: i,
  }));

  const inserted = await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.coupangProductId,
      set: {
        title: sql`excluded.title`,
        imageUrl: sql`excluded.image_url`,
        price: sql`excluded.price`,
        originalPrice: sql`excluded.original_price`,
        discountRate: sql`excluded.discount_rate`,
        isRocket: sql`excluded.is_rocket`,
        isFeatured: sql`excluded.is_featured`,
        categoryId: sql`excluded.category_id`,
        sortOrder: sql`excluded.sort_order`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: products.id });

  console.log(`샘플 상품 ${inserted.length}개 반영`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
