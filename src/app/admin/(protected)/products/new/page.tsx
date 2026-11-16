import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { requireAdmin } from "@/lib/admin/session";
import { isCoupangConfigured } from "@/lib/coupang";
import { getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "상품 등록" };

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <div>
      <PageHeader title="상품 등록" description="쿠팡 파트너스 링크로 상품을 직접 등록합니다." />
      <ProductForm categories={categories} coupangEnabled={isCoupangConfigured()} />
    </div>
  );
}
