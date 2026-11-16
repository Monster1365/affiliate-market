"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertToAffiliateLink } from "@/lib/actions/coupang";
import { saveProduct } from "@/lib/actions/products";
import type { Product } from "@/lib/db/schema";
import { discountRateOf, type FormState } from "@/lib/admin/validation";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FieldError, FormMessage, SubmitButton, invalidProps, selectClass } from "./form-parts";

type Props = {
  product?: Product;
  categories: { id: number; name: string }[];
  /** 쿠팡 API 키가 있으면 '제휴 링크로 변환' 버튼 표시 */
  coupangEnabled?: boolean;
};

/** 쿠팡 상품 주소 → 파트너스 제휴 링크 변환 (딥링크 API 1회 호출) */
function DeeplinkButton({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await convertToAffiliateLink(inputRef.current?.value ?? "");
            if (res.url && inputRef.current) {
              inputRef.current.value = res.url;
              setMessage({ ok: true, text: "제휴 링크로 바꿨습니다." });
            } else {
              setMessage({ ok: false, text: res.error ?? "변환하지 못했습니다." });
            }
          })
        }
        className="rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-brand-100 disabled:opacity-50"
      >
        {pending ? "변환 중..." : "쿠팡 주소 → 제휴 링크로 변환"}
      </button>
      {message && (
        <span role={message.ok ? "status" : "alert"} className={cn("text-xs", message.ok ? "text-primary" : "text-destructive")}>
          {message.text}
        </span>
      )}
    </div>
  );
}

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function ProductForm({ product, categories, coupangEnabled }: Props) {
  const affiliateRef = useRef<HTMLInputElement>(null);
  const [state, action] = useActionState<FormState, FormData>(saveProduct, {});

  // 저장 실패 시에는 방금 입력한 값, 아니면 기존 상품 값
  const text = (name: keyof Product, fallback = "") =>
    state.values ? (state.values[name] ?? "") : String(product?.[name] ?? fallback);
  const checked = (name: keyof Product, fallback: boolean) =>
    state.values ? state.values[name] === "on" : ((product?.[name] as boolean | undefined) ?? fallback);

  const [imageUrl, setImageUrl] = useState(text("imageUrl"));
  const [price, setPrice] = useState(text("price"));
  const [originalPrice, setOriginalPrice] = useState(text("originalPrice"));
  const rate = discountRateOf(Number(price) || 0, Number(originalPrice) || null);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_280px]" noValidate>
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="flex flex-col gap-5 rounded-xl border bg-background p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">상품명</Label>
          <Input id="title" name="title" defaultValue={text("title")} maxLength={300} {...invalidProps(state, "title")} />
          <FieldError state={state} name="title" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="affiliateUrl">쿠팡 제휴 링크</Label>
          <Input
            ref={affiliateRef}
            id="affiliateUrl"
            name="affiliateUrl"
            type="url"
            placeholder="https://link.coupang.com/a/..."
            defaultValue={text("affiliateUrl")}
            {...invalidProps(state, "affiliateUrl")}
          />
          <p className="text-xs text-muted-foreground">
            쿠팡 파트너스에서 만든 링크를 넣으세요. 일반 쿠팡 상품 주소를 넣으면 수수료가 적립되지 않습니다.
            {coupangEnabled && " 일반 쿠팡 주소를 넣고 아래 버튼을 누르면 제휴 링크로 바꿔 줍니다."}
          </p>
          {coupangEnabled && <DeeplinkButton inputRef={affiliateRef} />}
          <FieldError state={state} name="affiliateUrl" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="imageUrl">이미지 주소</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://thumbnail.coupangcdn.com/..."
            defaultValue={text("imageUrl")}
            onChange={(e) => setImageUrl(e.target.value.trim())}
            {...invalidProps(state, "imageUrl")}
          />
          <FieldError state={state} name="imageUrl" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">판매가 (원)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={text("price")}
              onChange={(e) => setPrice(e.target.value)}
              {...invalidProps(state, "price")}
            />
            <FieldError state={state} name="price" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="originalPrice">정가 (원, 선택)</Label>
            <Input
              id="originalPrice"
              name="originalPrice"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="할인 전 가격"
              defaultValue={text("originalPrice")}
              onChange={(e) => setOriginalPrice(e.target.value)}
              {...invalidProps(state, "originalPrice")}
            />
            <FieldError state={state} name="originalPrice" />
          </div>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          할인율은 정가와 판매가로 자동 계산됩니다{rate ? <strong className="ml-1 text-sale">현재 {rate}% 할인</strong> : null}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="categoryId">카테고리</Label>
            <select id="categoryId" name="categoryId" defaultValue={text("categoryId")} className={selectClass}>
              <option value="">미분류</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sortOrder">정렬 순서</Label>
            <Input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={text("sortOrder", "0")}
              {...invalidProps(state, "sortOrder")}
            />
            <p className="text-xs text-muted-foreground">추천순에서 숫자가 작을수록 앞에 나옵니다.</p>
            <FieldError state={state} name="sortOrder" />
          </div>
        </div>

        <fieldset className="flex flex-wrap gap-x-6 gap-y-3">
          <legend className="sr-only">표시 옵션</legend>
          {(
            [
              ["isVisible", "쇼핑몰에 노출", true],
              ["isFeatured", "MD 추천", false],
              ["isRocket", "로켓배송", false],
            ] as const
          ).map(([name, label, fallback]) => (
            <label key={name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked(name, fallback)}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </fieldset>

        {product?.source === "api" && product.coupangProductId && (
          <p className="text-xs text-muted-foreground">
            쿠팡 API로 가져온 상품입니다 (쿠팡 상품 ID: {product.coupangProductId}).
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <SubmitButton size="lg" className="h-10 px-6">
            {product ? "저장" : "등록"}
          </SubmitButton>
          <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-foreground">
            취소
          </Link>
          <FormMessage state={state} />
        </div>
      </div>

      {/* 미리보기 */}
      <aside className="flex flex-col gap-3">
        <p className="text-sm font-medium">미리보기</p>
        <div className="flex flex-col gap-2 rounded-xl border bg-background p-3">
          <div
            className={cn(
              "relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted",
            )}
          >
            {isHttpUrl(imageUrl) ? (
              <Image src={imageUrl} alt="" fill sizes="280px" unoptimized className="object-cover" />
            ) : (
              <ImageOff className="size-8 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            {rate ? <span className="font-bold text-sale">{rate}%</span> : null}
            <span className="font-bold">{Number(price) > 0 ? formatPrice(Number(price)) : "판매가"}</span>
          </div>
        </div>
      </aside>
    </form>
  );
}
