import type { Metadata } from "next";
import Link from "next/link";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteForm } from "@/components/admin/delete-form";
import { PageHeader } from "@/components/admin/page-header";
import { deleteCategory } from "@/lib/actions/categories";
import { requireAdmin } from "@/lib/admin/session";
import { getAdminCategories } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "카테고리" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const categories = await getAdminCategories();

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="카테고리"
        description="쇼핑몰 상단 메뉴와 홈 화면 섹션에 이 순서대로 표시됩니다. slug는 주소에 쓰입니다 (/category/slug)."
      />

      <section className="rounded-xl border bg-background p-4">
        <h2 className="mb-3 text-sm font-bold">새 카테고리</h2>
        <CategoryForm />
      </section>

      <section className="rounded-xl border bg-background">
        <div className="hidden grid-cols-[1fr_1fr_90px_auto] gap-2 border-b px-4 py-2 text-xs text-muted-foreground sm:grid">
          <span>이름</span>
          <span>slug</span>
          <span>정렬 순서</span>
          <span />
        </div>
        <ul className="divide-y">
          {categories.length === 0 && <li className="p-8 text-center text-sm text-muted-foreground">카테고리가 없습니다.</li>}
          {categories.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 p-4">
              <CategoryForm category={c} />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  상품 {c.productCount}개 ·{" "}
                  <Link href={`/category/${c.slug}`} target="_blank" className="hover:text-primary">
                    /category/{c.slug}
                  </Link>
                </span>
                <DeleteForm
                  action={deleteCategory}
                  id={c.id}
                  message={
                    c.productCount
                      ? `'${c.name}' 카테고리를 삭제할까요?\n속한 상품 ${c.productCount}개는 삭제되지 않고 '미분류'가 됩니다.`
                      : `'${c.name}' 카테고리를 삭제할까요?`
                  }
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
