import { Button } from "@/components/ui/button";

// 1단계 임시 홈 화면: 테마 색상 확인용. 3단계에서 (shop)/page.tsx로 대체합니다.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 font-bold">
          블루마켓
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="text-2xl font-bold">프로젝트 셋업 완료</h1>
        <p className="text-muted-foreground">
          Next.js + Tailwind + shadcn/ui 파란색 테마가 적용되었습니다.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>쿠팡에서 구매하기</Button>
          <Button variant="secondary">보조 버튼</Button>
          <Button variant="outline">외곽선 버튼</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {["bg-brand-50", "bg-brand-100", "bg-brand-500", "bg-brand-600", "bg-brand-700", "bg-brand-900", "bg-sale"].map(
            (c) => (
              <div key={c} className={`${c} size-12 rounded-md border`} title={c} />
            ),
          )}
        </div>
      </main>
      <footer className="border-t bg-muted text-xs text-muted-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6">
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </div>
      </footer>
    </div>
  );
}
