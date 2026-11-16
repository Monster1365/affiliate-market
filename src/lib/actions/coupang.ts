"use server";

import { inArray, sql } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin/session";
import {
  CoupangApiError,
  createCoupangDeeplink,
  getHourlyUsage,
  isCoupangUrl,
  searchCoupangProducts,
  type CoupangProduct,
} from "@/lib/coupang";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { CACHE_TAGS } from "@/lib/queries/shop";

type Usage = Awaited<ReturnType<typeof getHourlyUsage>>;

export type SearchResultItem = CoupangProduct & { existingId: number | null };

export type CoupangSearchState = {
  keyword?: string;
  results?: SearchResultItem[];
  error?: string;
  usage?: Usage;
};

function errorMessage(err: unknown) {
  if (err instanceof CoupangApiError) {
    if (err.detail) console.error("[coupang]", err.message, err.detail);
    return err.message;
  }
  console.error("[coupang]", err);
  return "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
}

async function existingIdsOf(coupangIds: string[]) {
  if (!coupangIds.length) return new Map<string, number>();
  const rows = await db
    .select({ id: products.id, coupangProductId: products.coupangProductId })
    .from(products)
    .where(inArray(products.coupangProductId, coupangIds));
  return new Map(rows.map((r) => [r.coupangProductId!, r.id]));
}

/** 쿠팡 상품 검색 (API 1회 호출) */
export async function searchCoupang(_prev: CoupangSearchState, formData: FormData): Promise<CoupangSearchState> {
  await requireAdmin();
  const keyword = String(formData.get("keyword") ?? "").trim();
  if (keyword.length < 2 || keyword.length > 50) {
    return { keyword, error: "검색어는 2~50자로 입력하세요.", usage: await getHourlyUsage() };
  }

  try {
    const items = await searchCoupangProducts(keyword);
    const existing = await existingIdsOf(items.map((i) => i.coupangProductId));
    return {
      keyword,
      results: items.map((i) => ({ ...i, existingId: existing.get(i.coupangProductId) ?? null })),
      usage: await getHourlyUsage(),
    };
  } catch (err) {
    return { keyword, error: errorMessage(err), usage: await getHourlyUsage() };
  }
}

const importItemSchema = z.object({
  coupangProductId: z.string().min(1).max(40),
  title: z.string().trim().min(1).max(300),
  price: z.number().int().min(0).max(100_000_000),
  imageUrl: z.url({ protocol: /^https?$/ }).max(2000),
  affiliateUrl: z.url({ protocol: /^https?$/ }).max(2000),
  isRocket: z.boolean(),
});

export type ImportState = { ok?: boolean; message?: string; importedIds?: Record<string, number> };

/** 검색 결과에서 고른 상품 저장. 쿠팡 상품 ID 기준으로 새로 넣거나 갱신 */
export async function importCoupangProducts(_prev: ImportState, formData: FormData): Promise<ImportState> {
  await requireAdmin();

  const parsed = z
    .array(importItemSchema)
    .min(1, "가져올 상품을 하나 이상 고르세요.")
    .max(50)
    .safeParse(
      formData.getAll("item").flatMap((v) => {
        try {
          return [JSON.parse(String(v))];
        } catch {
          return [];
        }
      }),
    );
  if (!parsed.success) return { message: parsed.error.issues[0]?.message ?? "선택한 상품 정보가 올바르지 않습니다." };

  const categoryId = Number(formData.get("categoryId")) || null;
  const isFeatured = formData.get("isFeatured") === "on";
  const items = parsed.data;
  const before = await existingIdsOf(items.map((i) => i.coupangProductId));

  try {
    const rows = await db
      .insert(products)
      .values(
        items.map((i) => ({
          coupangProductId: i.coupangProductId,
          title: i.title,
          price: i.price,
          imageUrl: i.imageUrl,
          affiliateUrl: i.affiliateUrl,
          isRocket: i.isRocket,
          source: "api" as const,
          categoryId,
          isFeatured,
          isVisible: true,
        })),
      )
      .onConflictDoUpdate({
        target: products.coupangProductId,
        set: {
          // 쿠팡 정보(이름·가격·이미지·링크)는 최신으로 갱신
          title: sql`excluded.title`,
          price: sql`excluded.price`,
          imageUrl: sql`excluded.image_url`,
          affiliateUrl: sql`excluded.affiliate_url`,
          isRocket: sql`excluded.is_rocket`,
          // 관리자가 넣어 둔 정가가 있으면 새 가격으로 할인율 재계산
          discountRate: sql`case when ${products.originalPrice} > excluded.price
            then round((1 - excluded.price::numeric / ${products.originalPrice}) * 100)::int else null end`,
          // 카테고리는 이번에 골랐을 때만 바꾸고, 노출 여부 등 관리자 설정은 유지
          categoryId: sql`coalesce(excluded.category_id, ${products.categoryId})`,
          isFeatured: isFeatured ? sql`true` : sql`${products.isFeatured}`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: products.id, coupangProductId: products.coupangProductId });

    updateTag(CACHE_TAGS.products);
    refresh();

    const updated = items.filter((i) => before.has(i.coupangProductId)).length;
    const created = items.length - updated;
    return {
      ok: true,
      message: `${items.length}개 상품을 저장했습니다 (새로 등록 ${created}개, 갱신 ${updated}개).`,
      importedIds: Object.fromEntries(rows.map((r) => [r.coupangProductId!, r.id])),
    };
  } catch (err) {
    console.error("[importCoupangProducts]", err);
    return { message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

/** 상품 등록 폼에서 쿠팡 상품 주소를 파트너스 제휴 링크로 변환 (API 1회 호출) */
export async function convertToAffiliateLink(coupangUrl: string): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const value = coupangUrl.trim();
  if (!isCoupangUrl(value)) return { error: "https://www.coupang.com/ 으로 시작하는 쿠팡 상품 주소를 넣어 주세요." };
  if (value.startsWith("https://link.coupang.com/")) return { error: "이미 제휴 링크입니다." };

  try {
    return { url: await createCoupangDeeplink(value) };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}
