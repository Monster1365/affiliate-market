"use server";

import { eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/admin/session";
import {
  categorySchema,
  fieldErrors,
  formValues,
  isUniqueViolation,
  parseId,
  type FormState,
} from "@/lib/admin/validation";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { CACHE_TAGS } from "@/lib/queries/shop";

/** 카테고리 이름은 헤더 메뉴·홈 섹션·상품 상세 경로에 모두 쓰이므로 두 태그 모두 무효화 */
function invalidate() {
  updateTag(CACHE_TAGS.categories);
  updateTag(CACHE_TAGS.products);
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const id = parseId(formData.get("id"));
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { message: "입력값을 확인해 주세요.", errors: fieldErrors(parsed.error), values: formValues(formData) };
  }

  try {
    if (id) await db.update(categories).set(parsed.data).where(eq(categories.id, id));
    else await db.insert(categories).values(parsed.data);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        message: "입력값을 확인해 주세요.",
        errors: { slug: ["이미 쓰고 있는 slug입니다. 다른 값을 입력하세요."] },
        values: formValues(formData),
      };
    }
    console.error("[saveCategory]", err);
    return { message: "저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", values: formValues(formData) };
  }

  invalidate();
  refresh();
  return { ok: true, message: id ? "저장했습니다." : `'${parsed.data.name}' 카테고리를 추가했습니다.` };
}

/** 카테고리 삭제. 속한 상품은 지워지지 않고 '미분류'가 된다 (FK: ON DELETE SET NULL) */
export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = parseId(formData.get("id"));
  if (!id) return;

  await db.delete(categories).where(eq(categories.id, id));
  invalidate();
  refresh();
}
