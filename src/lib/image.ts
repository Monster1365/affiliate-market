/**
 * next/image 최적화를 허용한 호스트 (next.config.ts의 images.remotePatterns와 맞출 것).
 * 관리자가 다른 호스트의 이미지 URL을 입력해도 깨지지 않도록,
 * 목록에 없는 호스트는 최적화 없이(unoptimized) 원본을 그대로 보여준다.
 */
const OPTIMIZED_HOSTS = [/\.coupangcdn\.com$/, /^placehold\.co$/];

export function isOptimizableImage(src: string) {
  try {
    const { protocol, hostname } = new URL(src);
    return protocol === "https:" && OPTIMIZED_HOSTS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}
