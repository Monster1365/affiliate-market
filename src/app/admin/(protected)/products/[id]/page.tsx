import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteForm } from "@/components/admin/delete-form";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { deleteProduct } from "@/lib/actions/products";
import { requireAdmin } from "@/lib/admin/session";
import { getAdminCategories, getAdminProduct } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "상품 수정" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const [product, categories] = await Promise.all([getAdminProduct(productId), getAdminCategories()]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title="상품 수정" description={`#${product.id} · ${product.source === "api" ? "쿠팡 API" : "직접 등록"}`}>
        <Link href={`/product/${product.id}`} target="_blank" className="rounded-lg px-3 py-1.5 text-sm hover:bg-background">
          쇼핑몰에서 보기
        </Link>
        <DeleteForm
          action={deleteProduct}
          id={product.id}
          extra={{ from: "edit" }}
          label="상품 삭제"
          message={`'${product.title}' 상품을 삭제할까요?\n클릭 기록도 함께 삭제됩니다.`}
        />
      </PageHeader>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
