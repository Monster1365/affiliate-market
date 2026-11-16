"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/session";
import {
  discountRateOf,
  fieldErrors,
  formValues,
  parseId,
  productSchema,
  type FormState,
} from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { CACHE_TAGS } from "@/lib/queries/shop";

/** 상품 등록/수정. id가 있으면 수정 */
export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { message: "입력값을 확인해 주세요.", errors: fieldErrors(parsed.error), values: formValues(formData) };
  }

  const d = parsed.data;
  const values = {
    title: d.title,
    imageUrl: d.imageUrl,
    affiliateUrl: d.affiliateUrl,
    price: d.price,
    originalPrice: d.originalPrice ?? null,
    discountRate: discountRateOf(d.price, d.originalPrice),
    categoryId: d.categoryId ?? null,
    isRocket: d.isRocket,
    isVisible: d.isVisible,
    isFeatured: d.isFeatured,
    sortOrder: d.sortOrder,
  };

  try {
    if (id) {
      const updated = await db.update(products).set(values).where(eq(products.id, id)).returning({ id: products.id });
      if (!updated.length) return { message: "상품을 찾을 수 없습니다. 이미 삭제되었을 수 있어요." };
    } else {
      await db.insert(products).values({ ...values, source: "manual" });
    }
  } catch (err) {
    console.error("[saveProduct]", err);
    // 카테고리가 그 사이 삭제된 경우(FK 위반) 등
    return { message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", values: formValues(formData) };
  }

  updateTag(CACHE_TAGS.products);
  redirect(`/admin/products?saved=${id ? "updated" : "created"}`);
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id) return;

  await db.delete(products).where(eq(products.id, id));
  updateTag(CACHE_TAGS.products);

  // 수정 화면에서 삭제했으면 목록으로, 목록에서 삭제했으면 그 자리에서 새로고침
  if (formData.get("from") === "edit") redirect("/admin/products?saved=deleted");
  refresh();
}

/** 목록에서 노출/추천을 바로 켜고 끄기 */
export async function toggleProduct(formData: FormData) {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  const field = formData.get("field");
  if (!id || (field !== "isVisible" && field !== "isFeatured")) return;

  const next = formData.get("value") === "true";
  await db
    .update(products)
    .set({ [field]: next } as { isVisible: boolean } | { isFeatured: boolean })
    .where(eq(products.id, id));

  updateTag(CACHE_TAGS.products);
  refresh();
}
