import Link from "next/link";
import { PackageSearch } from "lucide-react";

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <PackageSearch className="size-12 text-brand-500" aria-hidden />
      <p className="text-lg font-bold">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      <Link href="/" className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-700">
        홈으로 가기
      </Link>
    </div>
  );
}
