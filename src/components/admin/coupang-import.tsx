"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Check, Search, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  importCoupangProducts,
  searchCoupang,
  type CoupangSearchState,
  type ImportState,
  type SearchResultItem,
} from "@/lib/actions/coupang";
import { formatPrice } from "@/lib/format";
import { isOptimizableImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { SubmitButton, selectClass } from "./form-parts";

type Usage = { used: number; limit: number; remaining: number };

function UsageBadge({ usage }: { usage: Usage }) {
  const low = usage.remaining <= 3;
  return (
    <p className={cn("text-xs", low ? "font-medium text-destructive" : "text-muted-foreground")}>
      최근 1시간 API 호출 {usage.used}/{usage.limit}회 · 남은 횟수 {usage.remaining}회
      {low && " (한도를 넘으면 쿠팡이 계정을 정지할 수 있어요)"}
    </p>
  );
}

function ResultCard({ item, imported, checked, onToggle }: {
  item: SearchResultItem;
  imported: number | null;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label
        className={cn(
          "flex h-full cursor-pointer flex-col gap-2 rounded-xl border bg-background p-2 transition-colors",
          checked ? "border-primary ring-2 ring-primary/20" : "hover:border-brand-500/50",
        )}
      >
        <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
          <Image src={item.imageUrl} alt="" fill sizes="200px" unoptimized={!isOptimizableImage(item.imageUrl)} className="object-cover" />
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggle}
            className="absolute top-2 left-2 size-5 accent-primary"
            aria-label={`${item.title} 선택`}
          />
          {imported && (
            <span className="absolute top-2 right-2 rounded bg-brand-900/85 px-1.5 py-0.5 text-[10px] font-medium text-white">
              등록됨
            </span>
          )}
        </div>
        <p className="line-clamp-2 text-sm leading-5">{item.title}</p>
        <div className="mt-auto flex items-center justify-between gap-1">
          <span className="font-bold">{formatPrice(item.price)}</span>
          {item.isRocket && (
            <span className="inline-flex items-center gap-0.5 rounded bg-brand-50 px-1 text-[10px] font-bold text-brand-700">
              <Zap className="size-3 fill-current" aria-hidden />
              로켓
            </span>
          )}
        </div>
        {imported && (
          <Link href={`/admin/products/${imported}`} className="text-xs text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
            등록된 상품 수정 →
          </Link>
        )}
      </label>
    </li>
  );
}

export function CoupangImport({
  categories,
  initialUsage,
}: {
  categories: { id: number; name: string }[];
  initialUsage: Usage;
}) {
  const [search, searchAction] = useActionState<CoupangSearchState, FormData>(searchCoupang, {});
  const [result, importAction] = useActionState<ImportState, FormData>(importCoupangProducts, {});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prevSearch, setPrevSearch] = useState(search);
  const [imported, setImported] = useState<Record<string, number>>({});
  const [prevResult, setPrevResult] = useState(result);

  // 새 검색 결과가 오면: 아직 등록 안 된 상품만 기본 선택
  if (search !== prevSearch) {
    setPrevSearch(search);
    setSelected(new Set((search.results ?? []).filter((r) => !r.existingId).map((r) => r.coupangProductId)));
  }
  // 가져오기가 끝나면: 등록됨 표시, 선택 해제
  if (result !== prevResult) {
    setPrevResult(result);
    if (result.ok && result.importedIds) {
      setImported((m) => ({ ...m, ...result.importedIds }));
      setSelected(new Set());
    }
  }

  const results = search.results ?? [];
  const usage = search.usage ?? initialUsage;
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-xl border bg-background p-4">
        <form action={searchAction} className="flex gap-2">
          <Label htmlFor="keyword" className="sr-only">검색어</Label>
          <Input
            id="keyword"
            name="keyword"
            defaultValue={search.keyword}
            placeholder="쿠팡에서 검색할 상품 (예: 무선 이어폰)"
            minLength={2}
            maxLength={50}
            required
            disabled={usage.remaining === 0}
          />
          <SubmitButton pendingText="검색 중..." disabled={usage.remaining === 0} className="shrink-0">
            <Search aria-hidden />
            쿠팡 검색
          </SubmitButton>
        </form>
        <UsageBadge usage={usage} />
        <p className="text-xs text-muted-foreground">
          검색 1번에 API를 1회 호출하고, 결과는 최대 10개입니다. 같은 검색을 반복하지 말고 필요한 상품을 한 번에 골라 주세요.
        </p>
        {search.error && (
          <p role="alert" className="text-sm text-destructive">
            {search.error}
          </p>
        )}
      </section>

      {search.keyword && !search.error && results.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">&lsquo;{search.keyword}&rsquo; 검색 결과가 없습니다.</p>
      )}

      {results.length > 0 && (
        <form action={importAction} className="flex flex-col gap-4">
          {results
            .filter((r) => selected.has(r.coupangProductId))
            .map((r) => (
              <input
                key={r.coupangProductId}
                type="hidden"
                name="item"
                value={JSON.stringify({
                  coupangProductId: r.coupangProductId,
                  title: r.title,
                  price: r.price,
                  imageUrl: r.imageUrl,
                  affiliateUrl: r.affiliateUrl,
                  isRocket: r.isRocket,
                })}
              />
            ))}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">
              <strong>&lsquo;{search.keyword}&rsquo;</strong> 검색 결과 {results.length}개 · {selected.size}개 선택
            </p>
            <div className="flex gap-2 text-xs">
              <button type="button" className="rounded px-2 py-1 hover:bg-background" onClick={() => setSelected(new Set(results.map((r) => r.coupangProductId)))}>
                전체 선택
              </button>
              <button type="button" className="rounded px-2 py-1 hover:bg-background" onClick={() => setSelected(new Set())}>
                선택 해제
              </button>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {results.map((r) => (
              <ResultCard
                key={r.coupangProductId}
                item={r}
                imported={imported[r.coupangProductId] ?? r.existingId}
                checked={selected.has(r.coupangProductId)}
                onToggle={() => toggle(r.coupangProductId)}
              />
            ))}
          </ul>

          <div className="sticky bottom-4 flex flex-col gap-3 rounded-xl border bg-background p-4 shadow-lg sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="import-category" className="shrink-0">카테고리</Label>
                <select id="import-category" name="categoryId" className={cn(selectClass, "w-40")} defaultValue="">
                  <option value="">선택 안 함</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isFeatured" className="size-4 accent-primary" />
                MD 추천으로 표시
              </label>
            </div>
            <SubmitButton size="lg" className="h-10 px-5" disabled={selected.size === 0} pendingText="저장 중...">
              <Check aria-hidden />
              선택한 {selected.size}개 가져오기
            </SubmitButton>
          </div>
          {result.message && (
            <p role={result.ok ? "status" : "alert"} className={cn("text-sm", result.ok ? "text-primary" : "text-destructive")}>
              {result.message}{" "}
              {result.ok && (
                <Link href="/admin/products" className="underline">
                  상품 관리에서 보기
                </Link>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            이미 등록된 상품을 다시 가져오면 이름·가격·이미지·링크만 최신으로 바뀌고, 노출 여부 등 직접 바꾼 설정은 유지됩니다.
            쿠팡 검색 결과에는 정가가 없어 할인율은 표시되지 않습니다. 필요하면 상품 수정에서 정가를 입력하세요.
          </p>
        </form>
      )}
    </div>
  );
}
