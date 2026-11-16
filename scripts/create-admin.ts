/**
 * 관리자 계정 생성. 같은 이메일이 있으면 비밀번호와 이름을 갱신한다.
 *
 *   npm run admin:create -- <이메일> <비밀번호> [이름]
 *
 * 비밀번호는 8자 이상. 셸 기록에 남지 않게 하려면 앞에 공백을 두고 실행하거나
 * 실행 후 history에서 지우세요.
 */
import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { adminUsers } from "../src/lib/db/schema";

config({ path: ".env.local", quiet: true });

const args = z
  .tuple([z.email(), z.string().min(8, "비밀번호는 8자 이상이어야 합니다."), z.string().min(1).max(50).optional()])
  .safeParse(process.argv.slice(2));

if (!args.success) {
  console.error("사용법: npm run admin:create -- <이메일> <비밀번호(8자 이상)> [이름]");
  console.error(args.error.issues.map((i) => `  - ${i.message}`).join("\n"));
  process.exit(1);
}

const [email, password, name = "관리자"] = args.data;
const db = drizzle(neon(process.env.DATABASE_URL!));

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);
  const [existing] = await db
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(eq(sql`lower(${adminUsers.email})`, email.toLowerCase()))
    .limit(1);

  if (existing) {
    await db.update(adminUsers).set({ passwordHash, name }).where(eq(adminUsers.id, existing.id));
    console.log(`기존 관리자 계정을 갱신했습니다: ${email}`);
  } else {
    await db.insert(adminUsers).values({ email, passwordHash, name });
    console.log(`관리자 계정을 만들었습니다: ${email}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
