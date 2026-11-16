"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBanner } from "@/lib/actions/banners";
import type { Banner } from "@/lib/db/schema";
import type { FormState } from "@/lib/admin/validation";
import { FieldError, FormMessage, SubmitButton, invalidProps } from "./form-parts";

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** 배너 추가(banner 없음) 또는 수정 폼 */
export function BannerForm({ banner }: { banner?: Banner }) {
  const [state, action] = useActionState<FormState, FormData>(saveBanner, {});
  const failed = !!state.values && !state.ok;
  const text = (name: keyof Banner, fallback = "") =>
    failed ? (state.values?.[name] ?? "") : String(banner?.[name] ?? fallback);
  const isActive = failed ? state.values?.isActive === "on" : (banner?.isActive ?? true);
  const [imageUrl, setImageUrl] = useState(text("imageUrl"));

  // 새 배너를 추가하고 나면 미리보기도 비운다 (렌더링 중 상태 조정 패턴)
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok && !banner) setImageUrl("");
  }
  const id = banner ? banner.id : "new";

  return (
    <form action={action} className="grid gap-4 md:grid-cols-[240px_1fr]" noValidate>
      {banner && <input type="hidden" name="id" value={banner.id} />}

      <div className="relative flex aspect-[3/1] items-center justify-center overflow-hidden rounded-lg bg-muted">
        {isHttpUrl(imageUrl) ? (
          <Image src={imageUrl} alt="" fill sizes="240px" unoptimized className="object-cover" />
        ) : (
          <ImageOff className="size-6 text-muted-foreground" aria-hidden />
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`title-${id}`}>제목 (이미지 대체 텍스트)</Label>
            <Input id={`title-${id}`} name="title" defaultValue={text("title")} {...invalidProps(state, "title")} />
            <FieldError state={state} name="title" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`linkUrl-${id}`}>링크 (선택)</Label>
            <Input
              id={`linkUrl-${id}`}
              name="linkUrl"
              placeholder="/category/digital 또는 https://..."
              defaultValue={text("linkUrl")}
              {...invalidProps(state, "linkUrl")}
            />
            <FieldError state={state} name="linkUrl" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`imageUrl-${id}`}>이미지 주소 (가로:세로 = 3:1 권장)</Label>
          <Input
            id={`imageUrl-${id}`}
            name="imageUrl"
            type="url"
            defaultValue={text("imageUrl")}
            onChange={(e) => setImageUrl(e.target.value.trim())}
            {...invalidProps(state, "imageUrl")}
          />
          <FieldError state={state} name="imageUrl" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor={`sortOrder-${id}`} className="shrink-0">정렬 순서</Label>
            <Input id={`sortOrder-${id}`} name="sortOrder" type="number" className="w-20" defaultValue={text("sortOrder", "0")} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={isActive} className="size-4 accent-primary" />
            홈에 표시
          </label>
          <SubmitButton variant={banner ? "outline" : "default"}>{banner ? "저장" : "추가"}</SubmitButton>
          <FormMessage state={state} />
        </div>
      </div>
    </form>
  );
}
