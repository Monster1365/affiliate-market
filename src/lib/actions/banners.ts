"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import { bannerSchema, fieldErrors, formValues, parseId, type FormState } from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { banners } from "@/lib/db/schema";
import { CACHE_TAGS } from "@/lib/queries/shop";

export async function saveBanner(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  const parsed = bannerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { message: "입력값을 확인해 주세요.", errors: fieldErrors(parsed.error), values: formValues(formData) };
  }

  const values = { ...parsed.data, linkUrl: parsed.data.linkUrl ?? null };
  try {
    if (id) await db.update(banners).set(values).where(eq(banners.id, id));
    else await db.insert(banners).values(values);
  } catch (err) {
    console.error("[saveBanner]", err);
    return { message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", values: formValues(formData) };
  }

  updateTag(CACHE_TAGS.banners);
  refresh();
  return { ok: true, message: id ? "저장했습니다." : `'${parsed.data.title}' 배너를 추가했습니다.` };
}

export async function deleteBanner(formData: FormData) {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id) return;

  await db.delete(banners).where(eq(banners.id, id));
  updateTag(CACHE_TAGS.banners);
  refresh();
}

export async function toggleBanner(formData: FormData) {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id) return;

  await db
    .update(banners)
    .set({ isActive: formData.get("value") === "true" })
    .where(eq(banners.id, id));
  updateTag(CACHE_TAGS.banners);
  refresh();
}
