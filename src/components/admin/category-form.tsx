"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { saveCategory } from "@/lib/actions/categories";
import type { FormState } from "@/lib/admin/validation";
import { cn } from "@/lib/utils";
import { FieldError, FormMessage, SubmitButton, invalidProps } from "./form-parts";

type Category = { id: number; name: string; slug: string; sortOrder: number };

/** 카테고리 추가(category 없음) 또는 한 줄 수정 폼 */
export function CategoryForm({ category, className }: { category?: Category; className?: string }) {
  const [state, action] = useActionState<FormState, FormData>(saveCategory, {});
  // 추가 폼은 성공하면 비우고, 실패하면 입력값 유지
  const v = (name: keyof Category) =>
    state.values && !state.ok ? (state.values[name] ?? "") : String(category?.[name] ?? (name === "sortOrder" ? 0 : ""));
  const idSuffix = category ? `-${category.id}` : "-new";

  return (
    <form action={action} className={cn("flex flex-col gap-1", className)}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_90px_auto]">
        <div>
          <label htmlFor={`name${idSuffix}`} className="sr-only">이름</label>
          <Input id={`name${idSuffix}`} name="name" placeholder="이름 (예: 반려동물)" defaultValue={v("name")} {...invalidProps(state, "name")} />
        </div>
        <div>
          <label htmlFor={`slug${idSuffix}`} className="sr-only">slug</label>
          <Input id={`slug${idSuffix}`} name="slug" placeholder="slug (예: pet)" defaultValue={v("slug")} {...invalidProps(state, "slug")} />
        </div>
        <div>
          <label htmlFor={`sortOrder${idSuffix}`} className="sr-only">정렬 순서</label>
          <Input id={`sortOrder${idSuffix}`} name="sortOrder" type="number" title="정렬 순서 (작을수록 앞)" defaultValue={v("sortOrder")} {...invalidProps(state, "sortOrder")} />
        </div>
        <SubmitButton variant={category ? "outline" : "default"}>{category ? "저장" : "추가"}</SubmitButton>
      </div>
      <FieldError state={state} name="name" />
      <FieldError state={state} name="slug" />
      <FieldError state={state} name="sortOrder" />
      <FormMessage state={state} />
    </form>
  );
}
