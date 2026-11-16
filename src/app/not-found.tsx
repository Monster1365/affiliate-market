import { EmptyState } from "@/components/shop/empty-state";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <EmptyState title="페이지를 찾을 수 없어요" description="주소가 올바른지 확인해 주세요." />
    </main>
  );
}
