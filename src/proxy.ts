import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

/**
 * /admin 접근 1차 확인 (Next.js 16에서 middleware → proxy로 이름 변경).
 * 로그인 쿠키(JWT)만 확인해 로그인 화면으로 돌려보낸다.
 * 실제 권한 확인은 requireAdmin()에서 한다.
 */
const { auth } = NextAuth(authConfig);

// authConfig.callbacks.authorized가 통과 여부를 결정한다
export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
