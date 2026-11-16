import { z } from "zod";

/** 폼 체크박스: 체크되면 "on", 아니면 값 없음 */
const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

/** 빈 문자열은 undefined로 */
const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

const httpUrl = (label: string) =>
  z
    .string({ error: `${label}을(를) 입력하세요.` })
    .trim()
    .min(1, `${label}을(를) 입력하세요.`)
    .max(2000, `${label}이(가) 너무 깁니다.`)
    .refine((v) => {
      try {
        return ["http:", "https:"].includes(new URL(v).protocol);
      } catch {
        return false;
      }
    }, `${label}은(는) http:// 또는 https://로 시작하는 주소여야 합니다.`);

const won = (label: string) =>
  z.coerce
    .number({ error: `${label}은(는) 숫자로 입력하세요.` })
    .int(`${label}은(는) 정수(원 단위)로 입력하세요.`)
    .min(0, `${label}은(는) 0원 이상이어야 합니다.`)
    .max(100_000_000, `${label}이(가) 너무 큽니다.`);

const sortOrder = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int("정렬 순서는 정수로 입력하세요.").min(-9999).max(9999).default(0),
);

export const productSchema = z
  .object({
    title: z.string().trim().min(1, "상품명을 입력하세요.").max(300, "상품명은 300자 이하로 입력하세요."),
    imageUrl: httpUrl("이미지 주소"),
    affiliateUrl: httpUrl("제휴 링크"),
    price: won("판매가"),
    originalPrice: z.preprocess(emptyToUndefined, won("정가").optional()),
    categoryId: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    isRocket: checkbox,
    isVisible: checkbox,
    isFeatured: checkbox,
    sortOrder,
  })
  .refine((d) => d.originalPrice === undefined || d.originalPrice >= d.price, {
    path: ["originalPrice"],
    message: "정가는 판매가보다 같거나 커야 합니다.",
  });

export type ProductInput = z.infer<typeof productSchema>;

/** 정가가 판매가보다 클 때만 할인율(%) 계산 */
export function discountRateOf(price: number, originalPrice?: number | null) {
  return originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : null;
}

export const categorySchema = z.object({
  name: z.string().trim().min(1, "이름을 입력하세요.").max(50, "이름은 50자 이하로 입력하세요."),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "주소용 이름(slug)을 입력하세요.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug는 영문 소문자, 숫자, 하이픈(-)만 쓸 수 있습니다. 예: kitchen, baby-food"),
  sortOrder,
});

export const bannerSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(100, "제목은 100자 이하로 입력하세요."),
  imageUrl: httpUrl("이미지 주소"),
  linkUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .max(2000)
      .refine((v) => (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//.test(v), "링크는 /로 시작하는 사이트 내부 경로나 http(s) 주소여야 합니다.")
      .optional(),
  ),
  isActive: checkbox,
  sortOrder,
});

/** 폼 액션 결과: 필드별 오류 + 다시 채울 입력값 */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};

export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData) if (typeof v === "string" && !k.startsWith("$")) values[k] = v;
  return values;
}

export function fieldErrors(error: z.ZodError): FormState["errors"] {
  return z.flattenError(error).fieldErrors as FormState["errors"];
}

/** Postgres unique 제약 위반(23505) 여부. Drizzle은 원래 오류를 cause에 담는다 */
export function isUniqueViolation(err: unknown) {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

/** 폼에서 넘어온 id 파싱 */
export function parseId(value: FormDataEntryValue | null) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
