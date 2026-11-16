import { after, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clickLogs } from "@/lib/db/schema";
import { getProduct } from "@/lib/queries/shop";

/** 검색엔진 봇·링크 미리보기 요청은 클릭으로 집계하지 않는다 */
const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|kakaotalk-scrap|headless/i;

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

const NO_INDEX_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

/**
 * GET /go/[id]
 * 클릭을 click_logs에 기록하고 쿠팡 제휴 링크로 302 리다이렉트.
 * 기록은 after()로 응답 이후에 처리해 이동이 지연되지 않게 한다.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/go/[id]">) {
  const { id } = await ctx.params;
  const productId = Number(id);
  const product =
    Number.isInteger(productId) && productId > 0 ? await getProduct(productId) : null;

  if (!product || !isHttpUrl(product.affiliateUrl)) {
    // 판매 종료·비노출 상품: 상품 페이지 대신 홈으로
    return Response.redirect(new URL("/", request.url), 302);
  }

  const userAgent = request.headers.get("user-agent");
  if (!userAgent || !BOT_UA.test(userAgent)) {
    const referer = request.headers.get("referer");
    after(async () => {
      try {
        await db.insert(clickLogs).values({
          productId: product.id,
          referer: referer?.slice(0, 500) ?? null,
          userAgent: userAgent?.slice(0, 500) ?? null,
        });
      } catch (err) {
        console.error("[go] 클릭 기록 실패", err);
      }
    });
  }

  return new Response(null, {
    status: 302,
    headers: { Location: product.affiliateUrl, ...NO_INDEX_HEADERS },
  });
}
