/** 관리자 페이지 공통 로딩 화면 (각 페이지의 DB 조회를 Suspense로 감싸는 역할) */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="불러오는 중">
      <div className="h-8 w-40 animate-pulse rounded bg-background" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-background" />
        ))}
      </div>
    </div>
  );
}
