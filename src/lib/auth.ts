import "server-only";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.email().max(255),
  password: z.string().min(1).max(200),
});

// 존재하지 않는 이메일에도 같은 시간만큼 bcrypt 비교를 해서
// 응답 시간으로 계정 존재 여부를 알 수 없게 한다
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [admin] = await db
          .select()
          .from(adminUsers)
          .where(eq(sql`lower(${adminUsers.email})`, email.toLowerCase()))
          .limit(1);

        const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
        if (!admin || !ok) return null;

        return { id: String(admin.id), email: admin.email, name: admin.name };
      },
    }),
  ],
});
