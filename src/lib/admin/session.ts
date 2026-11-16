import "server-only";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export type CurrentAdmin = { id: number; email: string; name: string };

/**
 * 관리자 권한 확인 (Data Access Layer).
 *
 * ⚠️ 관리자 "레이아웃"만으로는 페이지를 보호할 수 없다. 레이아웃과 페이지는 동시에
 * 렌더링되므로, 레이아웃에서 막혀도 페이지가 조회한 데이터가 응답에 섞여 나갈 수 있다.
 * 그래서 아래 세 곳 모두 첫 줄에서 호출한다.
 *   1. 관리자 레이아웃  2. 모든 관리자 페이지  3. 모든 관리자 Server Action
 *
 * 세션만 믿지 않고 DB에서 계정이 아직 있는지 확인하므로, 계정을 지우면
 * 세션이 남아 있어도 바로 접근이 막힌다. React cache()로 한 요청 안에서는 한 번만 조회한다.
 */
export const requireAdmin = cache(async (): Promise<CurrentAdmin> => {
  // Auth.js는 세션을 읽으며 JWT를 다시 암호화(난수 사용)하므로,
  // 이 부분이 항상 요청 시점에 실행된다고 Next.js에 알린다
  await connection();
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/login");

  const [admin] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name })
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);
  if (!admin) redirect("/admin/login");

  return admin;
});
