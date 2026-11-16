import type { NextAuthConfig } from "next-auth";

/**
 * proxy.ts와 auth.ts가 함께 쓰는 설정.
 * DB·bcrypt를 import하지 않아 proxy에서 가볍게 실행된다.
 * (proxy는 쿠키만 보는 1차 확인이고, 실제 권한 확인은 lib/admin/session.ts의 requireAdmin)
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8시간
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      if (nextUrl.pathname === "/admin/login") {
        // 이미 로그인했으면 로그인 화면 대신 대시보드로
        return isLoggedIn ? Response.redirect(new URL("/admin", nextUrl)) : true;
      }
      // false면 Auth.js가 /admin/login?callbackUrl=... 로 보낸다
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
