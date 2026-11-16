import { EmptyState } from "@/components/shop/empty-state";

export default function ShopNotFound() {
  return <EmptyState title="페이지를 찾을 수 없어요" description="상품이 판매 종료되었거나 주소가 잘못되었을 수 있어요." />;
}
