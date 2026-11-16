const krw = new Intl.NumberFormat("ko-KR");

/** 39900 → "39,900원" */
export function formatPrice(value: number) {
  return `${krw.format(value)}원`;
}
