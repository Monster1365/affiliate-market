import type { Metadata } from "next";
import { BannerForm } from "@/components/admin/banner-form";
import { DeleteForm } from "@/components/admin/delete-form";
import { PageHeader } from "@/components/admin/page-header";
import { ToggleForm } from "@/components/admin/toggle-form";
import { deleteBanner, toggleBanner } from "@/lib/actions/banners";
import { requireAdmin } from "@/lib/admin/session";
import { getAdminBanners } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "배너" };

export default async function AdminBannersPage() {
  await requireAdmin();
  const banners = await getAdminBanners();
  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="배너"
        description={`홈 화면 맨 위에 가로로 넘겨 보는 배너입니다. 표시 중인 배너가 없으면 기본 안내 문구가 나옵니다. (표시 중 ${activeCount}개)`}
      />

      <section className="rounded-xl border bg-background p-4">
        <h2 className="mb-3 text-sm font-bold">새 배너</h2>
        <BannerForm />
      </section>

      {banners.length > 0 && (
        <ul className="flex flex-col gap-3">
          {banners.map((b) => (
            <li key={b.id} className="flex flex-col gap-3 rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between">
                <ToggleForm action={toggleBanner} fields={{ id: b.id }} on={b.isActive} onLabel="표시 중" offLabel="숨김" />
                <DeleteForm action={deleteBanner} id={b.id} message={`'${b.title}' 배너를 삭제할까요?`} />
              </div>
              <BannerForm banner={b} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
