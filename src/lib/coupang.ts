/**
 * 쿠팡 파트너스 Open API 클라이언트 (서버 전용).
 *
 * - 인증: HMAC-SHA256 서명을 Authorization 헤더에 담는다 (아래 signCoupangRequest).
 * - 호출 한도: 시간당 약 30회를 넘으면 쿠팡이 계정을 24시간 정지한다고 알려져 있어,
 *   DB(coupang_api_calls)에 호출을 기록하고 HOURLY_LIMIT을 넘으면 호출하지 않는다.
 * - 엔드포인트 경로는 공개 SDK(coupang-partners-sdk-standalone 1.3.2) 기준.
 *   API 키 발급 후 쿠팡 파트너스 > 도움말 > Open API 문서와 한 번 대조할 것.
 */
import "server-only";
import { createHmac } from "node:crypto";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupangApiCalls } from "@/lib/db/schema";

const DEFAULT_BASE_URL = "https://api-gateway.coupang.com";
const PATHS = {
  search: "/v2/providers/affiliate_open_api/apis/openapi/products/search",
  deeplink: "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink",
} as const;

/** 쿠팡 한도(시간당 약 30회)보다 여유 있게 잡은 자체 한도 */
export const HOURLY_LIMIT = 20;
const TIMEOUT_MS = 10_000;

export class CoupangApiError extends Error {
  constructor(message: string, readonly detail?: string) {
    super(message);
    this.name = "CoupangApiError";
  }
}

export function isCoupangConfigured() {
  return !!process.env.COUPANG_ACCESS_KEY && !!process.env.COUPANG_SECRET_KEY;
}

function credentials() {
  const accessKey = process.env.COUPANG_ACCESS_KEY;
  const secretKey = process.env.COUPANG_SECRET_KEY;
  if (!accessKey || !secretKey) {
    throw new CoupangApiError("쿠팡 파트너스 API 키가 설정되지 않았습니다. COUPANG_ACCESS_KEY, COUPANG_SECRET_KEY를 확인하세요.");
  }
  return { accessKey, secretKey };
}

/** yyMMdd'T'HHmmss'Z' (UTC) */
export function coupangSignedDate(now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    String(now.getUTCFullYear()).slice(-2) +
    p(now.getUTCMonth() + 1) +
    p(now.getUTCDate()) +
    "T" +
    p(now.getUTCHours()) +
    p(now.getUTCMinutes()) +
    p(now.getUTCSeconds()) +
    "Z"
  );
}

/**
 * Authorization 헤더 값 생성.
 * 서명 대상 = signedDate + METHOD + path + query (쿼리는 '?' 없이, 실제 전송하는 인코딩 그대로)
 */
export function signCoupangRequest(
  method: string,
  path: string,
  query: string,
  keys: { accessKey: string; secretKey: string },
  now = new Date(),
) {
  const signedDate = coupangSignedDate(now);
  const message = signedDate + method.toUpperCase() + path + query;
  const signature = createHmac("sha256", keys.secretKey).update(message).digest("hex");
  return `CEA algorithm=HmacSHA256, access-key=${keys.accessKey}, signed-date=${signedDate}, signature=${signature}`;
}

// ── 호출 한도 ────────────────────────────────────────────

export async function getHourlyUsage() {
  const [row] = await db
    .select({ used: count() })
    .from(coupangApiCalls)
    .where(gte(coupangApiCalls.calledAt, sql`now() - interval '1 hour'`));
  return { used: row.used, limit: HOURLY_LIMIT, remaining: Math.max(0, HOURLY_LIMIT - row.used) };
}

/** 호출 자리를 먼저 기록(예약)한 뒤 한도를 확인한다. 동시에 여러 번 눌러도 한도를 넘지 않도록 */
async function reserveCall(endpoint: keyof typeof PATHS) {
  const [row] = await db
    .insert(coupangApiCalls)
    .values({ endpoint, success: false, error: "pending" })
    .returning({ id: coupangApiCalls.id });
  const { used } = await getHourlyUsage();
  if (used > HOURLY_LIMIT) {
    await db.delete(coupangApiCalls).where(eq(coupangApiCalls.id, row.id));
    throw new CoupangApiError(
      `쿠팡 API 호출 한도(1시간 ${HOURLY_LIMIT}회)에 도달했습니다. 계정 정지를 막기 위해 잠시 후 다시 시도해 주세요.`,
    );
  }
  return row.id;
}

async function finishCall(id: number, error?: string) {
  await db
    .update(coupangApiCalls)
    .set({ success: !error, error: error?.slice(0, 500) ?? null })
    .where(and(eq(coupangApiCalls.id, id)));
}

// ── 공통 요청 ────────────────────────────────────────────

type Envelope<T> = { rCode?: string; rMessage?: string; data?: T; code?: string; message?: string };

async function request<T>(
  endpoint: keyof typeof PATHS,
  method: "GET" | "POST",
  { params, body }: { params?: Record<string, string>; body?: unknown } = {},
): Promise<T> {
  const keys = credentials();
  const baseUrl = process.env.COUPANG_API_BASE_URL || DEFAULT_BASE_URL;
  const url = new URL(PATHS[endpoint], baseUrl);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const callId = await reserveCall(endpoint);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: signCoupangRequest(method, url.pathname, url.search.slice(1), keys),
        "Content-Type": "application/json;charset=UTF-8",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    const text = await res.text();
    let json: Envelope<T> | undefined;
    try {
      json = JSON.parse(text);
    } catch {
      /* JSON이 아닌 오류 응답 */
    }

    if (res.status === 401 || res.status === 403) {
      throw new CoupangApiError("쿠팡 API 인증에 실패했습니다. API 키가 맞는지, 서버 시간이 정확한지 확인하세요.", text.slice(0, 300));
    }
    if (res.status === 429) {
      throw new CoupangApiError("쿠팡 API 호출 한도를 넘었습니다. 한동안 호출을 멈추세요.", text.slice(0, 300));
    }
    if (!res.ok) {
      throw new CoupangApiError(`쿠팡 API 오류 (HTTP ${res.status})`, text.slice(0, 300));
    }
    // HTTP 200이어도 rCode가 "0"이 아니면 실패 (예: 딥링크 변환 실패)
    if (!json || (json.rCode !== undefined && json.rCode !== "0")) {
      throw new CoupangApiError(`쿠팡 API 오류: ${json?.rMessage || json?.message || "알 수 없는 응답"}`, text.slice(0, 300));
    }

    await finishCall(callId);
    return json.data as T;
  } catch (err) {
    const error =
      err instanceof CoupangApiError
        ? err
        : new CoupangApiError(
            err instanceof Error && err.name === "TimeoutError"
              ? "쿠팡 API 응답이 너무 늦습니다. 잠시 후 다시 시도해 주세요."
              : "쿠팡 API에 연결하지 못했습니다.",
            err instanceof Error ? err.message : String(err),
          );
    await finishCall(callId, `${error.message} ${error.detail ?? ""}`.trim());
    throw error;
  }
}

// ── 상품 검색 ────────────────────────────────────────────

type RawProduct = {
  productId: number | string;
  productName: string;
  productPrice: number;
  productImage: string;
  productUrl: string;
  isRocket?: boolean;
  isFreeShipping?: boolean;
  categoryName?: string;
  rank?: number;
};

export type CoupangProduct = {
  coupangProductId: string;
  title: string;
  price: number;
  imageUrl: string;
  /** 검색 결과의 productUrl은 이미 파트너스 추적 링크 */
  affiliateUrl: string;
  isRocket: boolean;
  isFreeShipping: boolean;
  categoryName: string | null;
};

export const SEARCH_MAX = 10;

export async function searchCoupangProducts(keyword: string, limit = SEARCH_MAX): Promise<CoupangProduct[]> {
  const data = await request<{ landingUrl?: string; productData?: RawProduct[] }>("search", "GET", {
    params: {
      keyword: keyword.trim(),
      limit: String(Math.min(Math.max(limit, 1), SEARCH_MAX)),
      imageSize: "512x512",
      ...(process.env.COUPANG_SUB_ID ? { subId: process.env.COUPANG_SUB_ID } : {}),
    },
  });

  return (data?.productData ?? [])
    .filter((p) => p.productId && p.productName && p.productUrl)
    .map((p) => ({
      coupangProductId: String(p.productId),
      title: p.productName.trim().slice(0, 300),
      price: Math.round(Number(p.productPrice) || 0),
      imageUrl: p.productImage,
      affiliateUrl: p.productUrl,
      isRocket: !!p.isRocket,
      isFreeShipping: !!p.isFreeShipping,
      categoryName: p.categoryName ?? null,
    }));
}

// ── 딥링크 (쿠팡 URL → 파트너스 링크) ────────────────────

/** 쿠팡 상품 페이지 주소인지 확인 (딥링크 변환 대상) */
export function isCoupangUrl(value: string) {
  try {
    const { protocol, hostname } = new URL(value);
    return protocol === "https:" && (hostname === "coupang.com" || hostname.endsWith(".coupang.com"));
  } catch {
    return false;
  }
}

export async function createCoupangDeeplink(coupangUrl: string): Promise<string> {
  const data = await request<{ originalUrl: string; shortenUrl: string; landingUrl?: string }[]>("deeplink", "POST", {
    body: {
      coupangUrls: [coupangUrl],
      ...(process.env.COUPANG_SUB_ID ? { subId: process.env.COUPANG_SUB_ID } : {}),
    },
  });
  const link = data?.[0]?.shortenUrl;
  if (!link) throw new CoupangApiError("제휴 링크를 만들지 못했습니다. 쿠팡 상품 주소가 맞는지 확인하세요.");
  return link;
}
