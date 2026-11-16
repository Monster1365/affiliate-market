"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string; email?: string } | undefined;

/**
 * 로그인 후 이동할 경로. Auth.js는 callbackUrl을 전체 주소로 넘기므로 경로만 꺼내 쓴다.
 * 호스트는 버리고 /admin 하위 경로만 허용해 외부 사이트로의 오픈 리다이렉트를 막는다.
 */
function safeRedirect(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) return "/admin";
  try {
    const url = new URL(value, "http://localhost");
    const path = url.pathname;
    const isAdminPath = path === "/admin" || path.startsWith("/admin/");
    return isAdminPath && !path.startsWith("/admin/login") ? `${path}${url.search}` : "/admin";
  } catch {
    return "/admin";
  }
}

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: safeRedirect(formData.get("callbackUrl")),
    });
  } catch (error) {
    // 성공 시 signIn이 던지는 redirect는 그대로 전파해야 한다
    if (error instanceof AuthError) {
      // 폼이 초기화되어도 이메일은 다시 채워지도록 돌려준다 (비밀번호는 돌려주지 않음)
      const email = formData.get("email");
      return {
        error: "이메일 또는 비밀번호가 올바르지 않습니다.",
        email: typeof email === "string" ? email.slice(0, 255) : "",
      };
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/admin/login" });
}
