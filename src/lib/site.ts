/** 사이트 기본 정보 */
export const SITE = {
  name: "ELI",
  nameKo: "엘리마켓",
  description: "엄선한 쿠팡 인기 상품을 한곳에서 비교하고 구매하세요.",
} as const;

/**
 * 사이트 절대 주소 (sitemap, canonical, 공유 미리보기에 사용).
 * 1. SITE_URL 환경변수 (직접 연결한 도메인이 있으면 여기에)
 * 2. Vercel이 자동으로 넣어 주는 운영 도메인
 * 3. 로컬 개발 주소
 */
export function siteUrl() {
  const explicit = process.env.SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

/** 페이지별 openGraph는 루트 설정을 통째로 덮어쓰므로, 공통 값을 함께 넣을 때 사용 */
export const OG_DEFAULTS = {
  type: "website",
  locale: "ko_KR",
  siteName: `${SITE.nameKo} ${SITE.name}`,
} as const;
