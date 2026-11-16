import type { Metadata } from "next";
import { Suspense } from "react";
import { ShoppingBag } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "로그인" };

/** callbackUrl을 서버에서 읽어 폼에 넘긴다 (JS 없이도 폼이 동작하도록 서버에서 렌더링) */
async function LoginFormWithCallback({ searchParams }: Pick<PageProps<"/admin/login">, "searchParams">) {
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={typeof callbackUrl === "string" ? callbackUrl : ""} />;
}

export default function AdminLoginPage(props: PageProps<"/admin/login">) {
  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-brand-50 text-primary">
            <ShoppingBag className="size-6" aria-hidden />
          </div>
          <CardTitle className="text-xl">
            {SITE.name} {SITE.nameKo} 관리자
          </CardTitle>
          <CardDescription>관리자 계정으로 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* searchParams는 요청 시점에만 읽을 수 있으므로 Suspense 필요 */}
          <Suspense fallback={<div className="h-56" />}>
            <LoginFormWithCallback searchParams={props.searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
